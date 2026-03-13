import { supabase } from './supabase'

// Save weekly summary and return the week ID
export async function saveWeeklySummary(data: {
  week_start: string
  week_end: string
  tickets_total: number
  calls: number
  patient_support_tickets: number
  total_submissions: number
  ticket_pct: number | null
  patient_pct: number | null
  satisfaction_rating: number | null
  notes: string
}, existingId?: number) {
  if (existingId) {
    const { data: result, error } = await supabase
      .from('weekly_summary')
      .update({ ...data, updated_at: new Date().toISOString() })
      .eq('id', existingId)
      .select('id')
      .single()
    return { id: result?.id ?? existingId, error }
  }
  const { data: result, error } = await supabase
    .from('weekly_summary')
    .insert(data)
    .select('id')
    .single()
  return { id: result?.id, error }
}

// Save trust tickets for a week (upsert)
export async function saveTrustTickets(weekId: number, entries: { trust_id: number; ticket_count: number }[]) {
  // Delete existing then insert
  const { error: deleteError } = await supabase.from('trust_tickets').delete().eq('week_id', weekId)
  if (deleteError) return { error: deleteError }
  if (entries.length === 0) return { error: null }
  const rows = entries.map((e) => ({ week_id: weekId, trust_id: e.trust_id, ticket_count: e.ticket_count }))
  const { error } = await supabase.from('trust_tickets').insert(rows)
  return { error }
}

// Save trust issues for a week
export async function saveTrustIssues(weekId: number, entries: { trust_id: number; issue_id: number; count: number }[]) {
  const { error: deleteError } = await supabase.from('trust_issues').delete().eq('week_id', weekId)
  if (deleteError) return { error: deleteError }
  if (entries.length === 0) return { error: null }
  const rows = entries.map((e) => ({ week_id: weekId, trust_id: e.trust_id, issue_id: e.issue_id, count: e.count }))
  const { error } = await supabase.from('trust_issues').insert(rows)
  return { error }
}

// Save top issues (global) for a week
export async function saveWeeklyIssues(weekId: number, entries: { issue_id: number; count: number }[]) {
  const { error: deleteError } = await supabase.from('weekly_issues').delete().eq('week_id', weekId)
  if (deleteError) return { error: deleteError }
  const filtered = entries.filter((e) => e.count > 0)
  if (filtered.length === 0) return { error: null }
  const rows = filtered.map((e) => ({ week_id: weekId, issue_id: e.issue_id, count: e.count }))
  const { error } = await supabase.from('weekly_issues').insert(rows)
  return { error }
}

// Save product tickets for a week
export async function saveProductTickets(weekId: number, entries: { product_id: number; ticket_count: number }[]) {
  const { error: deleteError } = await supabase.from('product_tickets').delete().eq('week_id', weekId)
  if (deleteError) return { error: deleteError }
  if (entries.length === 0) return { error: null }
  const rows = entries.map((e) => ({ week_id: weekId, product_id: e.product_id, ticket_count: e.ticket_count }))
  const { error } = await supabase.from('product_tickets').insert(rows)
  return { error }
}

// Save channel breakdown for a week
export async function saveChannelBreakdown(weekId: number, entries: { channel_id: number; percentage: number }[]) {
  const { error: deleteError } = await supabase.from('channel_breakdown').delete().eq('week_id', weekId)
  if (deleteError) return { error: deleteError }
  if (entries.length === 0) return { error: null }
  const rows = entries.map((e) => ({ week_id: weekId, channel_id: e.channel_id, percentage: e.percentage }))
  const { error } = await supabase.from('channel_breakdown').insert(rows)
  return { error }
}

// Save agent feedback for a week
export async function saveAgentFeedback(weekId: number, entries: { agent_id: number; comment: string }[]) {
  const { error: deleteError } = await supabase.from('agent_feedback').delete().eq('week_id', weekId)
  if (deleteError) return { error: deleteError }
  const filtered = entries.filter((e) => e.comment.trim() !== '')
  if (filtered.length === 0) return { error: null }
  const rows = filtered.map((e) => ({ week_id: weekId, agent_id: e.agent_id, comment: e.comment }))
  const { error } = await supabase.from('agent_feedback').insert(rows)
  return { error }
}

// Save version tickets for a week
export async function saveVersionTickets(weekId: number, entries: { version: string; ticket_count: number }[]) {
  const { error: deleteError } = await supabase.from('version_tickets').delete().eq('week_id', weekId)
  if (deleteError) return { error: deleteError }
  const filtered = entries.filter((e) => e.version.trim() !== '')
  if (filtered.length === 0) return { error: null }
  const rows = filtered.map((e) => ({ week_id: weekId, version: e.version, ticket_count: e.ticket_count }))
  const { error } = await supabase.from('version_tickets').insert(rows)
  return { error }
}

// Upload image to Supabase Storage and save reference
export async function saveWeeklyImage(weekId: number, imageType: string, file: File) {
  const ext = file.name.split('.').pop()
  const path = `week-${weekId}/${imageType}.${ext}`

  const { error: uploadError } = await supabase.storage
    .from('weekly-images')
    .upload(path, file, { upsert: true })
  if (uploadError) return { error: uploadError }

  const { data: urlData } = supabase.storage.from('weekly-images').getPublicUrl(path)

  // Upsert the image record
  await supabase.from('weekly_images').delete().eq('week_id', weekId).eq('image_type', imageType)
  const { error } = await supabase
    .from('weekly_images')
    .insert({ week_id: weekId, image_url: urlData.publicUrl, image_type: imageType })
  return { error }
}

// Load all data for an existing week
export async function loadWeekData(weekId: number) {
  const [summary, trustTickets, trustIssues, weeklyIssues, productTickets, channelBreakdown, agentFeedback, versionTickets, weeklyImages] = await Promise.all([
    supabase.from('weekly_summary').select('*').eq('id', weekId).single(),
    supabase.from('trust_tickets').select('*').eq('week_id', weekId),
    supabase.from('trust_issues').select('*').eq('week_id', weekId),
    supabase.from('weekly_issues').select('*').eq('week_id', weekId),
    supabase.from('product_tickets').select('*').eq('week_id', weekId),
    supabase.from('channel_breakdown').select('*').eq('week_id', weekId),
    supabase.from('agent_feedback').select('*').eq('week_id', weekId),
    supabase.from('version_tickets').select('*').eq('week_id', weekId),
    supabase.from('weekly_images').select('*').eq('week_id', weekId),
  ])
  return {
    summary: summary.data,
    trustTickets: trustTickets.data || [],
    trustIssues: trustIssues.data || [],
    weeklyIssues: weeklyIssues.data || [],
    productTickets: productTickets.data || [],
    channelBreakdown: channelBreakdown.data || [],
    agentFeedback: agentFeedback.data || [],
    versionTickets: versionTickets.data || [],
    weeklyImages: weeklyImages.data || [],
  }
}
