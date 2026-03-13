// ============================================
// FORM INPUT TYPES — what the supervisor submits
// ============================================

export interface WeeklySummaryFormData {
  week_start: string
  week_end: string
  tickets_total: number
  calls: number
  patient_support_tickets: number
  total_submissions: number
  ticket_pct: number
  patient_pct: number
  satisfaction_rating: number
  notes: string
}

export interface TrustTicketFormEntry {
  trust_id: number
  trust_name: string
  ticket_count: number
}

export interface TrustIssueFormEntry {
  trust_id: number
  issue_id: number
  count: number
}

export interface TopIssueFormEntry {
  issue_id: number
  count: number
}

export interface ProductTicketFormEntry {
  product_id: number
  product_name: string
  ticket_count: number
}

export interface ChannelBreakdownFormEntry {
  channel_id: number
  channel_name: string
  percentage: number
}

export interface AgentFeedbackFormEntry {
  agent_id: number
  agent_name: string
  comment: string
}

export interface VersionTicketFormEntry {
  version: string
  ticket_count: number
}

export interface WeeklyImageFormEntry {
  image_type: 'tickets_by_hour' | 'tickets_by_day'
  file: File | null
}

// The complete weekly entry form state
export interface WeeklyEntryFormData {
  summary: WeeklySummaryFormData
  trustTickets: TrustTicketFormEntry[]
  trustIssues: Record<number, TrustIssueFormEntry[]> // keyed by trust_id
  topIssues: TopIssueFormEntry[]
  productTickets: ProductTicketFormEntry[]
  channelBreakdown: ChannelBreakdownFormEntry[]
  agentFeedback: AgentFeedbackFormEntry[]
  versionTickets: VersionTicketFormEntry[]
  images: WeeklyImageFormEntry[]
}
