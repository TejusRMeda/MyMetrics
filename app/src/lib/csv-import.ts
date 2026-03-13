import { supabase } from './supabase'
import {
  saveWeeklySummary,
  saveTrustTickets,
  saveTrustIssues,
  saveWeeklyIssues,
  saveProductTickets,
  saveChannelBreakdown,
  saveAgentFeedback,
  saveVersionTickets,
} from './weekly-actions'

// ============================================
// Types
// ============================================

export type SectionType =
  | 'summary'
  | 'trust_tickets'
  | 'trust_issues'
  | 'weekly_issues'
  | 'product_tickets'
  | 'channel_breakdown'
  | 'agent_feedback'
  | 'version_tickets'

interface CsvRow {
  section: SectionType
  week_start: string
  week_end: string
  cols: string[]
}

export interface ParsedWeek {
  week_start: string
  week_end: string
  summary: string[][] // rows of cols
  trust_tickets: string[][]
  trust_issues: string[][]
  weekly_issues: string[][]
  product_tickets: string[][]
  channel_breakdown: string[][]
  agent_feedback: string[][]
  version_tickets: string[][]
}

export interface NameMaps {
  trusts: Map<string, number>
  issues: Map<string, number>
  products: Map<string, number>
  channels: Map<string, number>
  agents: Map<string, number>
}

export interface ValidationWarning {
  week: string
  section: string
  message: string
}

// Tracks names that need to be created before import
export interface NewEntities {
  trusts: Set<string>
  issues: Set<string>
  products: Set<string>
  channels: Set<string>
  agents: Set<string>
}

export interface ValidatedWeek {
  week_start: string
  week_end: string
  existingId?: number
  summary: {
    tickets_total: number
    calls: number
    patient_support_tickets: number
    total_submissions: number
    ticket_pct: number | null
    patient_pct: number | null
    satisfaction_rating: number | null
    notes: string
  } | null
  // Resolved entries (name already exists)
  trustTickets: { trust_id: number; ticket_count: number }[]
  trustIssues: { trust_id: number; issue_id: number; count: number }[]
  weeklyIssues: { issue_id: number; count: number }[]
  productTickets: { product_id: number; ticket_count: number }[]
  channelBreakdown: { channel_id: number; percentage: number }[]
  agentFeedback: { agent_id: number; comment: string }[]
  versionTickets: { version: string; ticket_count: number }[]
  // Deferred entries (name needs to be created first)
  deferredTrustTickets: { name: string; ticket_count: number }[]
  deferredTrustIssues: { trust_name: string; issue_name: string; count: number }[]
  deferredWeeklyIssues: { name: string; count: number }[]
  deferredProductTickets: { name: string; ticket_count: number }[]
  deferredChannelBreakdown: { name: string; percentage: number }[]
  deferredAgentFeedback: { name: string; comment: string }[]
  warnings: ValidationWarning[]
}

export interface ImportResult {
  imported: number
  skipped: number
  entitiesCreated: number
  errors: string[]
}

// ============================================
// CSV Parsing
// ============================================

const VALID_SECTIONS = new Set<SectionType>([
  'summary', 'trust_tickets', 'trust_issues', 'weekly_issues',
  'product_tickets', 'channel_breakdown', 'agent_feedback', 'version_tickets',
])

function parseCsvLine(line: string): string[] {
  const fields: string[] = []
  let current = ''
  let inQuotes = false
  for (let i = 0; i < line.length; i++) {
    const ch = line[i]
    if (inQuotes) {
      if (ch === '"') {
        if (i + 1 < line.length && line[i + 1] === '"') {
          current += '"'
          i++
        } else {
          inQuotes = false
        }
      } else {
        current += ch
      }
    } else if (ch === '"') {
      inQuotes = true
    } else if (ch === ',') {
      fields.push(current)
      current = ''
    } else {
      current += ch
    }
  }
  fields.push(current)
  return fields
}

export function parseCSV(text: string): { weeks: ParsedWeek[]; errors: string[] } {
  const lines = text.split(/\r?\n/).filter((l) => l.trim() !== '')
  const errors: string[] = []

  // Skip header if present
  const firstLine = lines[0]?.toLowerCase().trim() ?? ''
  const startIdx = firstLine.startsWith('section') ? 1 : 0

  const rows: CsvRow[] = []
  for (let i = startIdx; i < lines.length; i++) {
    const fields = parseCsvLine(lines[i])
    if (fields.length < 3) {
      errors.push(`Line ${i + 1}: too few columns`)
      continue
    }
    const section = fields[0].trim().toLowerCase() as SectionType
    if (!VALID_SECTIONS.has(section)) {
      errors.push(`Line ${i + 1}: unknown section "${fields[0].trim()}"`)
      continue
    }
    rows.push({
      section,
      week_start: fields[1].trim(),
      week_end: fields[2].trim(),
      cols: fields.slice(3).map((f) => f.trim()),
    })
  }

  // Group by week_start+week_end
  const weekMap = new Map<string, ParsedWeek>()
  for (const row of rows) {
    const key = `${row.week_start}|${row.week_end}`
    if (!weekMap.has(key)) {
      weekMap.set(key, {
        week_start: row.week_start,
        week_end: row.week_end,
        summary: [],
        trust_tickets: [],
        trust_issues: [],
        weekly_issues: [],
        product_tickets: [],
        channel_breakdown: [],
        agent_feedback: [],
        version_tickets: [],
      })
    }
    weekMap.get(key)![row.section].push(row.cols)
  }

  return { weeks: Array.from(weekMap.values()), errors }
}

// ============================================
// Name Maps
// ============================================

export async function fetchNameMaps(): Promise<NameMaps> {
  const [trusts, issues, products, channels, agents] = await Promise.all([
    supabase.from('trusts').select('id, name'),
    supabase.from('issue_categories').select('id, name'),
    supabase.from('products').select('id, name'),
    supabase.from('channels').select('id, name'),
    supabase.from('agents').select('id, name'),
  ])

  const toMap = (data: { id: number; name: string }[] | null) => {
    const map = new Map<string, number>()
    for (const row of data ?? []) {
      map.set(row.name.toLowerCase().trim(), row.id)
    }
    return map
  }

  return {
    trusts: toMap(trusts.data),
    issues: toMap(issues.data),
    products: toMap(products.data),
    channels: toMap(channels.data),
    agents: toMap(agents.data),
  }
}

// ============================================
// Validation & Mapping
// ============================================

function resolveId(name: string, map: Map<string, number>): number | null {
  return map.get(name.toLowerCase().trim()) ?? null
}

function parseNum(val: string | undefined): number {
  if (!val || val === '') return 0
  const n = Number(val)
  return isNaN(n) ? 0 : n
}

export function collectNewEntities(weeks: ParsedWeek[], maps: NameMaps): NewEntities {
  const newEntities: NewEntities = {
    trusts: new Set(),
    issues: new Set(),
    products: new Set(),
    channels: new Set(),
    agents: new Set(),
  }
  for (const week of weeks) {
    for (const row of week.trust_tickets) {
      const name = (row[0] || '').trim()
      if (name && !resolveId(name, maps.trusts)) newEntities.trusts.add(name)
    }
    for (const row of week.trust_issues) {
      const trustName = (row[0] || '').trim()
      const issueName = (row[1] || '').trim()
      if (trustName && !resolveId(trustName, maps.trusts)) newEntities.trusts.add(trustName)
      if (issueName && !resolveId(issueName, maps.issues)) newEntities.issues.add(issueName)
    }
    for (const row of week.weekly_issues) {
      const name = (row[0] || '').trim()
      if (name && !resolveId(name, maps.issues)) newEntities.issues.add(name)
    }
    for (const row of week.product_tickets) {
      const name = (row[0] || '').trim()
      if (name && !resolveId(name, maps.products)) newEntities.products.add(name)
    }
    for (const row of week.channel_breakdown) {
      const name = (row[0] || '').trim()
      if (name && !resolveId(name, maps.channels)) newEntities.channels.add(name)
    }
    for (const row of week.agent_feedback) {
      const name = (row[0] || '').trim()
      if (name && !resolveId(name, maps.agents)) newEntities.agents.add(name)
    }
  }
  return newEntities
}

export function newEntitiesCount(ne: NewEntities): number {
  return ne.trusts.size + ne.issues.size + ne.products.size + ne.channels.size + ne.agents.size
}

export function validateAndMap(weeks: ParsedWeek[], maps: NameMaps): ValidatedWeek[] {
  return weeks.map((week) => {
    const label = `${week.week_start} — ${week.week_end}`
    const warnings: ValidationWarning[] = []

    // Summary
    let summary: ValidatedWeek['summary'] = null
    if (week.summary.length > 0) {
      const c = week.summary[0]
      summary = {
        tickets_total: parseNum(c[0]),
        calls: parseNum(c[1]),
        patient_support_tickets: parseNum(c[2]),
        total_submissions: parseNum(c[3]),
        ticket_pct: c[4] ? parseNum(c[4]) : null,
        patient_pct: c[5] ? parseNum(c[5]) : null,
        satisfaction_rating: c[6] ? parseNum(c[6]) : null,
        notes: c[7] || '',
      }
    } else {
      warnings.push({ week: label, section: 'summary', message: 'No summary row found' })
    }

    // Trust tickets — resolve or defer
    const trustTickets: ValidatedWeek['trustTickets'] = []
    const deferredTrustTickets: ValidatedWeek['deferredTrustTickets'] = []
    for (const row of week.trust_tickets) {
      const name = (row[0] || '').trim()
      if (!name) continue
      const id = resolveId(name, maps.trusts)
      if (id) {
        trustTickets.push({ trust_id: id, ticket_count: parseNum(row[1]) })
      } else {
        deferredTrustTickets.push({ name, ticket_count: parseNum(row[1]) })
      }
    }

    // Trust issues — resolve or defer
    const trustIssues: ValidatedWeek['trustIssues'] = []
    const deferredTrustIssues: ValidatedWeek['deferredTrustIssues'] = []
    for (const row of week.trust_issues) {
      const trustName = (row[0] || '').trim()
      const issueName = (row[1] || '').trim()
      if (!trustName || !issueName) continue
      const trustId = resolveId(trustName, maps.trusts)
      const issueId = resolveId(issueName, maps.issues)
      if (trustId && issueId) {
        trustIssues.push({ trust_id: trustId, issue_id: issueId, count: parseNum(row[2]) })
      } else {
        deferredTrustIssues.push({ trust_name: trustName, issue_name: issueName, count: parseNum(row[2]) })
      }
    }

    // Weekly issues — resolve or defer
    const weeklyIssues: ValidatedWeek['weeklyIssues'] = []
    const deferredWeeklyIssues: ValidatedWeek['deferredWeeklyIssues'] = []
    for (const row of week.weekly_issues) {
      const name = (row[0] || '').trim()
      if (!name) continue
      const id = resolveId(name, maps.issues)
      if (id) {
        weeklyIssues.push({ issue_id: id, count: parseNum(row[1]) })
      } else {
        deferredWeeklyIssues.push({ name, count: parseNum(row[1]) })
      }
    }

    // Product tickets — resolve or defer
    const productTickets: ValidatedWeek['productTickets'] = []
    const deferredProductTickets: ValidatedWeek['deferredProductTickets'] = []
    for (const row of week.product_tickets) {
      const name = (row[0] || '').trim()
      if (!name) continue
      const id = resolveId(name, maps.products)
      if (id) {
        productTickets.push({ product_id: id, ticket_count: parseNum(row[1]) })
      } else {
        deferredProductTickets.push({ name, ticket_count: parseNum(row[1]) })
      }
    }

    // Channel breakdown — resolve or defer
    const channelBreakdown: ValidatedWeek['channelBreakdown'] = []
    const deferredChannelBreakdown: ValidatedWeek['deferredChannelBreakdown'] = []
    for (const row of week.channel_breakdown) {
      const name = (row[0] || '').trim()
      if (!name) continue
      const id = resolveId(name, maps.channels)
      if (id) {
        channelBreakdown.push({ channel_id: id, percentage: parseNum(row[1]) })
      } else {
        deferredChannelBreakdown.push({ name, percentage: parseNum(row[1]) })
      }
    }

    // Agent feedback — resolve or defer
    const agentFeedback: ValidatedWeek['agentFeedback'] = []
    const deferredAgentFeedback: ValidatedWeek['deferredAgentFeedback'] = []
    for (const row of week.agent_feedback) {
      const name = (row[0] || '').trim()
      if (!name) continue
      const id = resolveId(name, maps.agents)
      if (id) {
        agentFeedback.push({ agent_id: id, comment: row[1] || '' })
      } else {
        deferredAgentFeedback.push({ name, comment: row[1] || '' })
      }
    }

    // Version tickets — no name resolution needed
    const versionTickets: ValidatedWeek['versionTickets'] = []
    for (const row of week.version_tickets) {
      if (row[0]) {
        versionTickets.push({ version: row[0], ticket_count: parseNum(row[1]) })
      }
    }

    return {
      week_start: week.week_start,
      week_end: week.week_end,
      summary,
      trustTickets,
      trustIssues,
      weeklyIssues,
      productTickets,
      channelBreakdown,
      agentFeedback,
      versionTickets,
      deferredTrustTickets,
      deferredTrustIssues,
      deferredWeeklyIssues,
      deferredProductTickets,
      deferredChannelBreakdown,
      deferredAgentFeedback,
      warnings,
    }
  })
}

// ============================================
// Check Existing Weeks
// ============================================

export async function checkExistingWeeks(weekStarts: string[]): Promise<Map<string, number>> {
  const { data } = await supabase
    .from('weekly_summary')
    .select('id, week_start')
    .in('week_start', weekStarts)

  const map = new Map<string, number>()
  for (const row of data ?? []) {
    map.set(row.week_start, row.id)
  }
  return map
}

// ============================================
// Create New Entities
// ============================================

async function createEntity(table: string, name: string): Promise<number | null> {
  const { data, error } = await supabase.from(table).insert({ name }).select('id').single()
  if (error) return null
  return data.id
}

export async function createNewEntities(newEntities: NewEntities): Promise<{ maps: NameMaps; created: number; errors: string[] }> {
  const maps: NameMaps = { trusts: new Map(), issues: new Map(), products: new Map(), channels: new Map(), agents: new Map() }
  let created = 0
  const errors: string[] = []

  const entityConfigs: { key: keyof NewEntities; table: string }[] = [
    { key: 'trusts', table: 'trusts' },
    { key: 'issues', table: 'issue_categories' },
    { key: 'products', table: 'products' },
    { key: 'channels', table: 'channels' },
    { key: 'agents', table: 'agents' },
  ]

  for (const { key, table } of entityConfigs) {
    for (const name of newEntities[key]) {
      const id = await createEntity(table, name)
      if (id) {
        maps[key].set(name.toLowerCase().trim(), id)
        created++
      } else {
        errors.push(`Failed to create ${key.slice(0, -1)}: "${name}"`)
      }
    }
  }

  return { maps, created, errors }
}

// Merge newly created entity maps into deferred rows, returning resolved entries
function resolveDeferredRows(week: ValidatedWeek, newMaps: NameMaps) {
  const trustTickets = [...week.trustTickets]
  for (const d of week.deferredTrustTickets) {
    const id = resolveId(d.name, newMaps.trusts)
    if (id) trustTickets.push({ trust_id: id, ticket_count: d.ticket_count })
  }

  const trustIssues = [...week.trustIssues]
  for (const d of week.deferredTrustIssues) {
    const trustId = resolveId(d.trust_name, newMaps.trusts)
    const issueId = resolveId(d.issue_name, newMaps.issues)
    if (trustId && issueId) trustIssues.push({ trust_id: trustId, issue_id: issueId, count: d.count })
  }

  const weeklyIssues = [...week.weeklyIssues]
  for (const d of week.deferredWeeklyIssues) {
    const id = resolveId(d.name, newMaps.issues)
    if (id) weeklyIssues.push({ issue_id: id, count: d.count })
  }

  const productTickets = [...week.productTickets]
  for (const d of week.deferredProductTickets) {
    const id = resolveId(d.name, newMaps.products)
    if (id) productTickets.push({ product_id: id, ticket_count: d.ticket_count })
  }

  const channelBreakdown = [...week.channelBreakdown]
  for (const d of week.deferredChannelBreakdown) {
    const id = resolveId(d.name, newMaps.channels)
    if (id) channelBreakdown.push({ channel_id: id, percentage: d.percentage })
  }

  const agentFeedback = [...week.agentFeedback]
  for (const d of week.deferredAgentFeedback) {
    const id = resolveId(d.name, newMaps.agents)
    if (id) agentFeedback.push({ agent_id: id, comment: d.comment })
  }

  return { trustTickets, trustIssues, weeklyIssues, productTickets, channelBreakdown, agentFeedback }
}

// ============================================
// Import
// ============================================

export async function importWeeks(
  weeks: ValidatedWeek[],
  mode: 'overwrite' | 'skip',
  newEntities: NewEntities,
  onProgress?: (current: number, total: number) => void,
): Promise<ImportResult> {
  let imported = 0
  let skipped = 0
  let entitiesCreated = 0
  const errors: string[] = []

  // Step 1: Create new entities
  let newMaps: NameMaps = { trusts: new Map(), issues: new Map(), products: new Map(), channels: new Map(), agents: new Map() }
  if (newEntitiesCount(newEntities) > 0) {
    onProgress?.(0, weeks.length)
    const result = await createNewEntities(newEntities)
    newMaps = result.maps
    entitiesCreated = result.created
    errors.push(...result.errors)
  }

  // Step 2: Import weeks
  for (let i = 0; i < weeks.length; i++) {
    const week = weeks[i]
    onProgress?.(i + 1, weeks.length)

    if (week.existingId && mode === 'skip') {
      skipped++
      continue
    }

    if (!week.summary) {
      errors.push(`${week.week_start}: No summary data, skipped`)
      skipped++
      continue
    }

    try {
      // Save summary
      const { id: weekId, error: summaryError } = await saveWeeklySummary(
        {
          week_start: week.week_start,
          week_end: week.week_end,
          ...week.summary,
        },
        week.existingId,
      )
      if (summaryError || !weekId) {
        errors.push(`${week.week_start}: summary: ${summaryError?.message ?? 'Failed to save summary'}`)
        continue
      }

      // Resolve deferred rows with newly created entities
      const resolved = resolveDeferredRows(week, newMaps)

      // Save all sections in parallel
      const sectionNames = ['trustTickets', 'trustIssues', 'weeklyIssues', 'productTickets', 'channelBreakdown', 'agentFeedback', 'versionTickets']
      const results = await Promise.all([
        saveTrustTickets(weekId, resolved.trustTickets),
        saveTrustIssues(weekId, resolved.trustIssues),
        saveWeeklyIssues(weekId, resolved.weeklyIssues),
        saveProductTickets(weekId, resolved.productTickets),
        saveChannelBreakdown(weekId, resolved.channelBreakdown),
        saveAgentFeedback(weekId, resolved.agentFeedback),
        saveVersionTickets(weekId, week.versionTickets),
      ])

      const sectionErrors: string[] = []
      results.forEach((r, idx) => {
        if (r.error) sectionErrors.push(`${sectionNames[idx]}: ${r.error.message}`)
      })
      if (sectionErrors.length > 0) {
        errors.push(`${week.week_start}: ${sectionErrors.join('; ')}`)
      } else {
        imported++
      }
    } catch (err) {
      errors.push(`${week.week_start}: ${err instanceof Error ? err.message : 'Unknown error'}`)
    }
  }

  return { imported, skipped, entitiesCreated, errors }
}
