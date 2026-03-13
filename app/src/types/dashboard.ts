// ============================================
// DASHBOARD VIEW TYPES — what the charts/tables consume
// ============================================

export type RAGStatus = 'RED' | 'AMBER' | 'GREEN'

export interface KPICard {
  label: string
  value: number | string
  previousValue?: number | string
  delta?: number
  deltaDirection?: 'up' | 'down' | 'flat'
  rag?: RAGStatus
  unit?: string
}

export interface TrendDataPoint {
  week_start: string
  value: number
}

export interface TrustComparisonEntry {
  trust_name: string
  ticket_count: number
}

export interface IssueBreakdownEntry {
  issue_name: string
  parent_issue: string | null
  count: number
  children?: IssueBreakdownEntry[]
}

export interface ProductBreakdownEntry {
  product_name: string
  ticket_count: number
  percentage: number
}

export interface ChannelBreakdownEntry {
  channel_name: string
  percentage: number
}

export interface AgentFeedbackEntry {
  agent_name: string
  comments: string[]
  comment_count: number
}

export interface WeekOption {
  id: number
  week_start: string
  week_end: string
  label: string
}
