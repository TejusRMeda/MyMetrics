// Pure aggregation functions for multi-week data — no Supabase dependency

type RAGStatus = 'RED' | 'AMBER' | 'GREEN'

function computeRAG(value: number, thresholds: { red: number; amber: number }, higher: 'good' | 'bad'): RAGStatus {
  if (higher === 'bad') {
    if (value >= thresholds.red) return 'RED'
    if (value >= thresholds.amber) return 'AMBER'
    return 'GREEN'
  }
  if (value <= thresholds.red) return 'RED'
  if (value <= thresholds.amber) return 'AMBER'
  return 'GREEN'
}

export function aggregateOverviewKPIs(rows: Record<string, unknown>[]) {
  if (rows.length === 0) return null
  const sum = (key: string) => rows.reduce((s, r) => s + (Number(r[key]) || 0), 0)
  const avg = (key: string) => {
    const vals = rows.filter((r) => r[key] !== null && r[key] !== undefined)
    if (vals.length === 0) return null
    return Number((vals.reduce((s, r) => s + Number(r[key]), 0) / vals.length).toFixed(2))
  }

  const ticket_pct = avg('ticket_pct')
  const satisfaction_rating = avg('satisfaction_rating')

  return {
    tickets_total: sum('tickets_total'),
    calls: sum('calls'),
    patient_support_tickets: sum('patient_support_tickets'),
    total_submissions: sum('total_submissions'),
    ticket_pct,
    patient_pct: avg('patient_pct'),
    satisfaction_rating,
    ticket_rag: ticket_pct !== null ? computeRAG(ticket_pct, { red: 30, amber: 20 }, 'bad') : null,
    satisfaction_rag: satisfaction_rating !== null ? computeRAG(satisfaction_rating, { red: 85, amber: 90 }, 'good') : null,
  }
}

export function aggregateTrustTickets(rows: { ticket_count: number; trusts: { name: string } }[]) {
  const map = new Map<string, number>()
  for (const r of rows) {
    const name = r.trusts?.name || 'Unknown'
    map.set(name, (map.get(name) || 0) + r.ticket_count)
  }
  return Array.from(map.entries())
    .map(([name, tickets]) => ({ name, tickets }))
    .sort((a, b) => b.tickets - a.tickets)
}

export function aggregateProductTickets(rows: { ticket_count: number; products: { name: string } }[]) {
  const map = new Map<string, number>()
  for (const r of rows) {
    const name = r.products?.name || 'Unknown'
    map.set(name, (map.get(name) || 0) + r.ticket_count)
  }
  return Array.from(map.entries())
    .map(([name, value]) => ({ name, value }))
    .sort((a, b) => b.value - a.value)
}

export function aggregateIssues(rows: { count: number; issue_categories: { id: number; name: string; parent_id: number | null } }[]) {
  const map = new Map<number, { id: number; name: string; count: number; parent_id: number | null }>()
  for (const r of rows) {
    const cat = r.issue_categories
    if (!cat) continue
    const existing = map.get(cat.id)
    if (existing) {
      existing.count += r.count
    } else {
      map.set(cat.id, { id: cat.id, name: cat.name, count: r.count, parent_id: cat.parent_id })
    }
  }
  return Array.from(map.values()).sort((a, b) => b.count - a.count)
}

export function aggregateChannelBreakdown(rows: { percentage: number; channels: { name: string } }[]) {
  const map = new Map<string, number[]>()
  for (const r of rows) {
    const name = r.channels?.name || 'Unknown'
    if (!map.has(name)) map.set(name, [])
    map.get(name)!.push(r.percentage)
  }
  return Array.from(map.entries())
    .map(([name, vals]) => ({
      channels: { name },
      percentage: Number((vals.reduce((s, v) => s + v, 0) / vals.length).toFixed(1)),
    }))
    .sort((a, b) => b.percentage - a.percentage)
}

export function aggregateTrustIssues(rows: { count: number; trusts: { name: string }; issue_categories: { name: string } }[]) {
  const map = new Map<string, { trust: string; issue: string; count: number }>()
  for (const r of rows) {
    const key = `${r.trusts?.name}::${r.issue_categories?.name}`
    const existing = map.get(key)
    if (existing) {
      existing.count += r.count
    } else {
      map.set(key, {
        trust: r.trusts?.name || '',
        issue: r.issue_categories?.name || '',
        count: r.count,
      })
    }
  }
  return Array.from(map.values()).sort((a, b) => b.count - a.count)
}

export function collectFeedback(
  rows: { comment: string; agents: { name: string } }[],
  weekLabel?: string
) {
  return rows.map((r) => ({
    agent: (r.agents as { name: string })?.name || 'Unknown',
    comment: r.comment,
    weekLabel,
  }))
}
