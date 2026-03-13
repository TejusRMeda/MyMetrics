import * as pdfjsLib from 'pdfjs-dist'
import type { ParsedWeek } from './csv-import'

// Configure worker
pdfjsLib.GlobalWorkerOptions.workerSrc = new URL(
  'pdfjs-dist/build/pdf.worker.min.mjs',
  import.meta.url,
).toString()

// ============================================
// Text Extraction
// ============================================

interface TextItem {
  text: string
  x: number
  y: number
}

async function extractLines(file: File): Promise<string[]> {
  const buffer = await file.arrayBuffer()
  const pdf = await pdfjsLib.getDocument({ data: buffer }).promise
  const allLines: string[] = []

  for (let p = 1; p <= pdf.numPages; p++) {
    const page = await pdf.getPage(p)
    const content = await page.getTextContent()

    const items: TextItem[] = content.items
      .filter((item): item is Extract<typeof item, { str: string }> => 'str' in item)
      .filter((item) => item.str.trim() !== '')
      .map((item) => ({
        text: item.str,
        x: item.transform[4],
        y: Math.round(item.transform[5]),
      }))

    // Group by Y with tolerance
    const lines = new Map<number, TextItem[]>()
    for (const item of items) {
      let matched = false
      for (const [y] of lines) {
        if (Math.abs(y - item.y) <= 3) {
          lines.get(y)!.push(item)
          matched = true
          break
        }
      }
      if (!matched) {
        lines.set(item.y, [item])
      }
    }

    // Sort lines top-to-bottom (higher Y = higher on page in PDF coords)
    const sortedKeys = [...lines.keys()].sort((a, b) => b - a)
    for (const key of sortedKeys) {
      const lineItems = lines.get(key)!.sort((a, b) => a.x - b.x)
      allLines.push(lineItems.map((i) => i.text).join(' '))
    }
  }

  return allLines
}

// ============================================
// Number helpers
// ============================================

function cleanNum(s: string): string {
  return s.replace(/,/g, '').replace(/%/g, '').trim()
}

// ============================================
// Date Parsing
// ============================================

const MONTHS: Record<string, number> = {
  january: 0, february: 1, march: 2, april: 3, may: 4, june: 5,
  july: 6, august: 7, september: 8, october: 9, november: 10, december: 11,
}

function parseMonth(name: string): number {
  return MONTHS[name.toLowerCase()] ?? -1
}

function fmtDate(day: number, month: number, year: number): string {
  const mm = String(month + 1).padStart(2, '0')
  const dd = String(day).padStart(2, '0')
  return `${year}-${mm}-${dd}`
}

function parseDateRange(text: string, year: number): { week_start: string; week_end: string } | null {
  const m = text.match(
    /(\d{1,2})\s+([A-Za-z]+)\s*[-–]\s*(\d{1,2})\s+([A-Za-z]+)/,
  )
  if (!m) return null

  const startDay = parseInt(m[1])
  const startMonth = parseMonth(m[2])
  const endDay = parseInt(m[3])
  const endMonth = parseMonth(m[4])
  if (startMonth === -1 || endMonth === -1) return null

  let startYear = year
  let endYear = year
  if (startMonth === 11 && endMonth === 0) {
    endYear = year + 1
  }

  return {
    week_start: fmtDate(startDay, startMonth, startYear),
    week_end: fmtDate(endDay, endMonth, endYear),
  }
}

// ============================================
// Pre-processing: merge split lines
// ============================================

// PDF table rows often split across two lines, e.g.:
//   "16 January - 22"
//   "January 234 164 218 5,255 4.45% 4.15% 94.1%"
// Merge consecutive lines where the first ends with a number (day) or dash
// and the next starts with a month name followed by numbers.
function mergeLines(rawLines: string[]): string[] {
  const merged: string[] = []
  let i = 0
  while (i < rawLines.length) {
    let line = rawLines[i]

    if (i + 1 < rawLines.length) {
      const nextLine = rawLines[i + 1]
      const firstWordOfNext = nextLine.trim().split(/\s+/)[0]?.toLowerCase()
      const nextIsMonth = firstWordOfNext ? MONTHS[firstWordOfNext] !== undefined : false

      // Case 1: line ends with a day number, next starts with month
      //   "16 January - 22" + "January 234 164..."
      // Case 2: line ends with dash, next starts with month
      //   "26 December -" + "1 January 129 93..."
      // Case 3: line ends with "- DD", next starts with month (same as case 1)
      const endsWithDayOrDash = /(\d{1,2}\s*$|[-–]\s*$)/.test(line.trim())

      if (endsWithDayOrDash && nextIsMonth) {
        line = line + ' ' + nextLine
        i += 2
        merged.push(line)
        continue
      }

      // Also merge if line ends with dash and next starts with a digit (day) then month
      // "26 December -" + "1 January 129..."
      if (/[-–]\s*$/.test(line.trim()) && /^\s*\d{1,2}\s+[A-Za-z]/.test(nextLine)) {
        const secondWord = nextLine.trim().split(/\s+/)[1]?.toLowerCase()
        if (secondWord && MONTHS[secondWord] !== undefined) {
          line = line + ' ' + nextLine
          i += 2
          merged.push(line)
          continue
        }
      }
    }

    merged.push(line)
    i++
  }
  return merged
}

// ============================================
// Section Parsers
// ============================================

function parseSummarySection(lines: string[], year: number): {
  dates: { week_start: string; week_end: string } | null
  row: string[]
} {
  // Find ALL date rows and pick the last (most recent) one
  const dateRowPattern = /(\d{1,2}\s+[A-Za-z]+\s*[-–]\s*\d{1,2}\s+[A-Za-z]+)/
  let lastDateLine = -1
  let lastDates: { week_start: string; week_end: string } | null = null

  for (let i = 0; i < lines.length; i++) {
    const match = lines[i].match(dateRowPattern)
    if (match) {
      const parsed = parseDateRange(match[1], year)
      if (parsed) {
        lastDateLine = i
        lastDates = parsed
      }
    }
  }

  if (lastDateLine === -1 || !lastDates) {
    return { dates: null, row: [] }
  }

  // Extract all numbers from the date line
  const numbersText = lines[lastDateLine]
  const allNumbers = numbersText.match(/[\d,]+\.?\d*/g)?.map(cleanNum).filter(n => n !== '') || []

  // Remove the day-of-month numbers that are part of the date range itself
  // e.g. from "16 January - 22 January 234 164 218 5255 4.45 4.15 94.1"
  // we need to strip "16" and "22"
  const startDay = lastDates.week_start.split('-')[2].replace(/^0/, '')
  const endDay = lastDates.week_end.split('-')[2].replace(/^0/, '')

  // Remove first occurrence of each day number
  const filtered: string[] = []
  let removedStart = false
  let removedEnd = false
  for (const n of allNumbers) {
    if (!removedStart && n === startDay) { removedStart = true; continue }
    if (!removedEnd && n === endDay) { removedEnd = true; continue }
    filtered.push(n)
  }

  // Expected order: [tickets, calls, patient_tickets, total_submissions, ticket_pct, patient_pct, satisfaction]
  return { dates: lastDates, row: filtered }
}

function findSectionRange(lines: string[], headerPattern: RegExp): { start: number; end: number } {
  let start = -1
  for (let i = 0; i < lines.length; i++) {
    if (headerPattern.test(lines[i])) {
      start = i + 1
      break
    }
  }
  if (start === -1) return { start: -1, end: -1 }

  // End at next major section header
  const sectionHeaders = /^(Hospitals?:|Top Issues?:|Products?:|Channel|Satisfaction feedback|Agent Feedback|Version|Tickets vs|Tags\b|V\d)/i
  let end = lines.length
  for (let i = start; i < lines.length; i++) {
    if (sectionHeaders.test(lines[i].trim()) && i > start) {
      end = i
      break
    }
  }
  return { start, end }
}

// Shared bullet pattern: "● Name - 37" or "○ Name - 7"
// Use a more lenient pattern that handles "Locate Code -5" (no space before dash)
const BULLET_COUNT_PATTERN = /^[●○•\-\s]*(.+?)\s*[-–]\s*([\d,]+)\s*$/

function parseBulletItems(lines: string[], startIdx: number, endIdx: number): { name: string; count: string }[] {
  const results: { name: string; count: string }[] = []
  for (let i = startIdx; i < endIdx; i++) {
    const line = lines[i].trim()
    const m = line.match(BULLET_COUNT_PATTERN)
    if (m) {
      results.push({ name: m[1].trim(), count: cleanNum(m[2]) })
    }
  }
  return results
}

function parseTrustTickets(lines: string[]): string[][] {
  const { start, end } = findSectionRange(lines, /^Hospitals?:/i)
  if (start === -1) return []

  // Trust tickets are "● Name - Count" lines BEFORE the trust-issues section.
  // The trust-issues section starts when we see a "● Name -" (no count) followed by ○ sub-bullets.
  // Stop collecting when we hit a trust header with no count (start of issues section).
  const results: string[][] = []
  for (let i = start; i < end; i++) {
    const line = lines[i].trim()

    // Stop if we hit a trust header without count (start of nested issues)
    if (/^●\s*.+\s*[-–]\s*$/.test(line)) break

    // Stop if we hit sub-bullet (○)
    if (/^○/.test(line)) break

    const m = line.match(/^●\s*(.+?)\s*[-–]\s*([\d,]+)\s*$/)
    if (m) {
      results.push([m[1].trim(), cleanNum(m[2])])
    }
  }
  return results
}

function parseTrustIssues(lines: string[]): string[][] {
  // Trust issues: trust headers like "● NCA -" (no count) followed by "○ Issue - Count"
  const results: string[][] = []
  let currentTrust = ''
  let inIssueSection = false

  for (const line of lines) {
    const trimmed = line.trim()

    // Trust header with no count: "● NCA -" or "● Chesterfield -"
    const trustHeader = trimmed.match(/^●\s*(.+?)\s*[-–]\s*$/)
    if (trustHeader) {
      currentTrust = trustHeader[1].trim()
      inIssueSection = true
      continue
    }

    // Sub-issue with count: "○ Check-in assessment question - 7"
    if (inIssueSection && currentTrust) {
      const issue = trimmed.match(/^○\s*(.+?)\s*[-–]\s*([\d,]+)\s*$/)
      if (issue) {
        results.push([currentTrust, issue[1].trim(), cleanNum(issue[2])])
        continue
      }
    }

    // If we hit a new top-level bullet with a count, we've left the issue area for this trust
    if (/^●/.test(trimmed) && currentTrust) {
      // Check if it's a new trust header or a trust-ticket line
      if (!trimmed.match(/^●\s*(.+?)\s*[-–]\s*$/)) {
        inIssueSection = false
        currentTrust = ''
      }
    }
  }

  return results
}

function parseWeeklyIssues(lines: string[]): string[][] {
  const { start, end } = findSectionRange(lines, /^Top Issues?:/i)
  if (start === -1) return []

  const results: string[][] = []
  for (let i = start; i < end; i++) {
    const line = lines[i].trim()
    const m = line.match(BULLET_COUNT_PATTERN)
    if (m) {
      results.push([m[1].trim(), cleanNum(m[2])])
    }
  }
  return results
}

function parseProductTickets(lines: string[]): string[][] {
  const { start, end } = findSectionRange(lines, /^Products?$/i)
  if (start === -1) return []

  const items = parseBulletItems(lines, start, end)
  return items.map((item) => [item.name, item.count])
}

function parseChannelBreakdown(lines: string[]): string[][] {
  // Channel data comes from a bar chart — text extraction gives labels like
  // "Voice", "Email", "Messaging", "SMS" and nearby percentage text like "55%"
  // Strategy: look for known channel names near percentage values
  const results: string[][] = []
  const channelPattern = /\b(Voice|Email|Messaging|SMS|Chat|Phone|Web|Portal|Live Chat)\b/i

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i]
    const channelMatch = line.match(channelPattern)
    if (!channelMatch) continue

    // Look for percentage on same line or next line
    const pctOnLine = line.match(/([\d.]+)%/)
    if (pctOnLine) {
      results.push([channelMatch[1], cleanNum(pctOnLine[1])])
      continue
    }

    // Check next line for percentage
    if (i + 1 < lines.length) {
      const pctNext = lines[i + 1].match(/^([\d.]+)%$/)
      if (pctNext) {
        results.push([channelMatch[1], cleanNum(pctNext[1])])
      }
    }
  }

  return results
}

function parseAgentFeedback(lines: string[]): string[][] {
  // Header in this PDF is "Satisfaction feedback comments:" not "Agent Feedback"
  const { start, end } = findSectionRange(lines, /Satisfaction feedback comments|Agent Feedback/i)
  if (start === -1) return []

  const results: string[][] = []
  let currentAgent = ''
  const agentNamePattern = /^([A-Z][a-zA-Z]+(?:\s+[A-Z][a-zA-Z]+)*)$/
  const bulletPattern = /^[●•]\s+(.+)$/

  for (let i = start; i < end; i++) {
    const line = lines[i].trim()
    if (!line) continue

    // Skip lines that are clearly not agent names or comments
    if (/^(Please let me know|Tags|Hospitals|Products|Top Issues)/i.test(line)) break

    const nameMatch = line.match(agentNamePattern)
    const bulletMatch = line.match(bulletPattern)

    if (nameMatch && !bulletMatch) {
      currentAgent = nameMatch[1]
    } else if (bulletMatch && currentAgent) {
      results.push([currentAgent, bulletMatch[1].trim()])
    } else if (currentAgent && line.length > 3 && !nameMatch) {
      // Continuation line of a multi-line comment
      if (results.length > 0 && results[results.length - 1][0] === currentAgent) {
        results[results.length - 1][1] += ' ' + line
      }
    }
  }

  return results
}

function parseVersionTickets(lines: string[]): string[][] {
  const results: string[][] = []
  const pattern = /(V[\d.]+)\s*:\s*([\d,]+)/gi

  for (const line of lines) {
    let m: RegExpExecArray | null
    pattern.lastIndex = 0
    while ((m = pattern.exec(line)) !== null) {
      results.push([m[1], cleanNum(m[2])])
    }
  }

  return results
}

// ============================================
// Main Export
// ============================================

export interface PdfDateOverride {
  week_start: string // YYYY-MM-DD
  week_end: string   // YYYY-MM-DD
}

export async function parsePDFs(
  files: File[],
  year: number,
  onProgress?: (current: number, total: number) => void,
  dateOverride?: PdfDateOverride,
): Promise<{ weeks: ParsedWeek[]; errors: string[] }> {
  const allWeeks: ParsedWeek[] = []
  const errors: string[] = []

  for (let i = 0; i < files.length; i++) {
    const file = files[i]
    onProgress?.(i + 1, files.length)

    try {
      const rawLines = await extractLines(file)

      if (rawLines.length === 0) {
        errors.push(`${file.name}: No extractable text found (may be a scanned image)`)
        continue
      }

      // Merge split date rows before parsing
      const lines = mergeLines(rawLines)

      // Parse summary to get the date range (most recent week in the PDF)
      const { dates: autoDates, row: summaryRow } = parseSummarySection(lines, year)

      // Use manual override if provided, otherwise fall back to auto-detected dates
      const dates = dateOverride?.week_start && dateOverride?.week_end
        ? dateOverride
        : autoDates

      if (!dates) {
        errors.push(`${file.name}: Could not find a date range — use the manual date range option`)
        continue
      }

      const week: ParsedWeek = {
        week_start: dates.week_start,
        week_end: dates.week_end,
        summary: summaryRow.length > 0 ? [summaryRow] : [],
        trust_tickets: parseTrustTickets(lines),
        trust_issues: parseTrustIssues(lines),
        weekly_issues: parseWeeklyIssues(lines),
        product_tickets: parseProductTickets(lines),
        channel_breakdown: parseChannelBreakdown(lines),
        agent_feedback: parseAgentFeedback(lines),
        version_tickets: parseVersionTickets(lines),
      }

      allWeeks.push(week)
    } catch (err) {
      errors.push(`${file.name}: ${err instanceof Error ? err.message : 'Failed to parse PDF'}`)
    }
  }

  // Sort by week_start ascending
  allWeeks.sort((a, b) => a.week_start.localeCompare(b.week_start))

  return { weeks: allWeeks, errors }
}
