import { supabase } from './supabase'

export async function getWeeksList() {
  const { data, error } = await supabase
    .from('weekly_summary')
    .select('id, week_start, week_end')
    .order('week_start', { ascending: false })
  if (error) { console.error('getWeeksList error:', error); return [] }
  return data || []
}

export async function getWeeklyOverview(weekId?: number) {
  if (!weekId) {
    const { data, error } = await supabase
      .from('vw_weekly_overview')
      .select('*')
      .order('week_start', { ascending: false })
      .limit(1)
      .single()
    if (error) { console.error('getWeeklyOverview error:', error); return null }
    return data
  }
  const { data, error } = await supabase
    .from('vw_weekly_overview')
    .select('*')
    .eq('id', weekId)
    .single()
  if (error) { console.error('getWeeklyOverview error:', error); return null }
  return data
}

export async function getPreviousWeek(weekStart: string) {
  const { data, error } = await supabase
    .from('vw_weekly_overview')
    .select('*')
    .lt('week_start', weekStart)
    .order('week_start', { ascending: false })
    .limit(1)
    .single()
  if (error) { console.error('getPreviousWeek error:', error); return null }
  return data
}

export async function getTrendData(limit = 12) {
  const { data, error } = await supabase
    .from('weekly_summary')
    .select('week_start, tickets_total, satisfaction_rating, ticket_pct, patient_pct, calls, patient_support_tickets, total_submissions')
    .order('week_start', { ascending: true })
    .limit(limit)
  if (error) { console.error('getTrendData error:', error); return [] }
  return data || []
}

export async function getTrustTicketsForWeek(weekId: number) {
  const { data, error } = await supabase
    .from('trust_tickets')
    .select('ticket_count, trusts(name)')
    .eq('week_id', weekId)
    .order('ticket_count', { ascending: false })
  if (error) { console.error('getTrustTicketsForWeek error:', error); return [] }
  return data || []
}

export async function getTrustTrends(limit = 12) {
  const { data, error } = await supabase
    .from('vw_trust_weekly')
    .select('*')
    .order('week_start', { ascending: true })
    .limit(limit * 20)
  if (error) { console.error('getTrustTrends error:', error); return [] }
  return data || []
}

export async function getProductTicketsForWeek(weekId: number) {
  const { data, error } = await supabase
    .from('product_tickets')
    .select('ticket_count, products(name)')
    .eq('week_id', weekId)
    .order('ticket_count', { ascending: false })
  if (error) { console.error('getProductTicketsForWeek error:', error); return [] }
  return data || []
}

export async function getProductTrends(limit = 12) {
  const { data, error } = await supabase
    .from('vw_product_weekly')
    .select('*')
    .order('week_start', { ascending: true })
    .limit(limit * 10)
  if (error) { console.error('getProductTrends error:', error); return [] }
  return data || []
}

export async function getTopIssuesForWeek(weekId: number) {
  const { data, error } = await supabase
    .from('weekly_issues')
    .select('count, issue_categories(id, name, parent_id)')
    .eq('week_id', weekId)
    .order('count', { ascending: false })
  if (error) { console.error('getTopIssuesForWeek error:', error); return [] }
  return data || []
}

export async function getChannelBreakdownForWeek(weekId: number) {
  const { data, error } = await supabase
    .from('channel_breakdown')
    .select('percentage, channels(name)')
    .eq('week_id', weekId)
    .order('percentage', { ascending: false })
  if (error) { console.error('getChannelBreakdownForWeek error:', error); return [] }
  return data || []
}

export async function getAgentFeedbackForWeek(weekId: number) {
  const { data, error } = await supabase
    .from('agent_feedback')
    .select('comment, agents(name)')
    .eq('week_id', weekId)
  if (error) { console.error('getAgentFeedbackForWeek error:', error); return [] }
  return data || []
}

export async function getWeeklyImages(weekId: number) {
  const { data, error } = await supabase
    .from('weekly_images')
    .select('image_url, image_type')
    .eq('week_id', weekId)
  if (error) { console.error('getWeeklyImages error:', error); return [] }
  return data || []
}

// --- Multi-week query functions ---

export async function getWeeklyOverviewForWeeks(weekIds: number[]) {
  const { data, error } = await supabase
    .from('vw_weekly_overview')
    .select('*')
    .in('id', weekIds)
  if (error) { console.error('getWeeklyOverviewForWeeks error:', error); return [] }
  return data || []
}

export async function getTrustTicketsForWeeks(weekIds: number[]) {
  const { data, error } = await supabase
    .from('trust_tickets')
    .select('ticket_count, trusts(name)')
    .in('week_id', weekIds)
    .order('ticket_count', { ascending: false })
  if (error) { console.error('getTrustTicketsForWeeks error:', error); return [] }
  return data || []
}

export async function getTrustIssuesForWeeks(weekIds: number[]) {
  const { data, error } = await supabase
    .from('trust_issues')
    .select('count, trusts(name), issue_categories(name)')
    .in('week_id', weekIds)
    .order('count', { ascending: false })
  if (error) { console.error('getTrustIssuesForWeeks error:', error); return [] }
  return data || []
}

export async function getProductTicketsForWeeks(weekIds: number[]) {
  const { data, error } = await supabase
    .from('product_tickets')
    .select('ticket_count, products(name)')
    .in('week_id', weekIds)
    .order('ticket_count', { ascending: false })
  if (error) { console.error('getProductTicketsForWeeks error:', error); return [] }
  return data || []
}

export async function getTopIssuesForWeeks(weekIds: number[]) {
  const { data, error } = await supabase
    .from('weekly_issues')
    .select('count, issue_categories(id, name, parent_id)')
    .in('week_id', weekIds)
    .order('count', { ascending: false })
  if (error) { console.error('getTopIssuesForWeeks error:', error); return [] }
  return data || []
}

export async function getChannelBreakdownForWeeks(weekIds: number[]) {
  const { data, error } = await supabase
    .from('channel_breakdown')
    .select('percentage, channels(name)')
    .in('week_id', weekIds)
    .order('percentage', { ascending: false })
  if (error) { console.error('getChannelBreakdownForWeeks error:', error); return [] }
  return data || []
}

export async function getAgentFeedbackForWeeks(weekIds: number[]) {
  const { data, error } = await supabase
    .from('agent_feedback')
    .select('comment, agents(name), week_id')
    .in('week_id', weekIds)
  if (error) { console.error('getAgentFeedbackForWeeks error:', error); return [] }
  return data || []
}

export async function getTrendDataForWeeks(weekIds: number[]) {
  const { data, error } = await supabase
    .from('weekly_summary')
    .select('week_start, tickets_total, satisfaction_rating, ticket_pct, patient_pct, calls, patient_support_tickets, total_submissions')
    .in('id', weekIds)
    .order('week_start', { ascending: true })
  if (error) { console.error('getTrendDataForWeeks error:', error); return [] }
  return data || []
}
