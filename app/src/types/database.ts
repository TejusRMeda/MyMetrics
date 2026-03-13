// ============================================
// DATABASE TYPES — mirrors Supabase schema
// ============================================

export interface Database {
  public: {
    Tables: {
      weekly_summary: {
        Row: WeeklySummary
        Insert: WeeklySummaryInsert
        Update: Partial<WeeklySummaryInsert>
      }
      trusts: {
        Row: Trust
        Insert: TrustInsert
        Update: Partial<TrustInsert>
      }
      trust_tickets: {
        Row: TrustTicket
        Insert: TrustTicketInsert
        Update: Partial<TrustTicketInsert>
      }
      issue_categories: {
        Row: IssueCategory
        Insert: IssueCategoryInsert
        Update: Partial<IssueCategoryInsert>
      }
      weekly_issues: {
        Row: WeeklyIssue
        Insert: WeeklyIssueInsert
        Update: Partial<WeeklyIssueInsert>
      }
      trust_issues: {
        Row: TrustIssue
        Insert: TrustIssueInsert
        Update: Partial<TrustIssueInsert>
      }
      products: {
        Row: Product
        Insert: ProductInsert
        Update: Partial<ProductInsert>
      }
      product_tickets: {
        Row: ProductTicket
        Insert: ProductTicketInsert
        Update: Partial<ProductTicketInsert>
      }
      channels: {
        Row: Channel
        Insert: ChannelInsert
        Update: Partial<ChannelInsert>
      }
      channel_breakdown: {
        Row: ChannelBreakdown
        Insert: ChannelBreakdownInsert
        Update: Partial<ChannelBreakdownInsert>
      }
      agents: {
        Row: Agent
        Insert: AgentInsert
        Update: Partial<AgentInsert>
      }
      agent_feedback: {
        Row: AgentFeedback
        Insert: AgentFeedbackInsert
        Update: Partial<AgentFeedbackInsert>
      }
      version_tickets: {
        Row: VersionTicket
        Insert: VersionTicketInsert
        Update: Partial<VersionTicketInsert>
      }
      weekly_images: {
        Row: WeeklyImage
        Insert: WeeklyImageInsert
        Update: Partial<WeeklyImageInsert>
      }
    }
    Views: {
      vw_weekly_overview: { Row: WeeklyOverviewView }
      vw_trust_weekly: { Row: TrustWeeklyView }
      vw_top_issues_weekly: { Row: TopIssuesWeeklyView }
      vw_product_weekly: { Row: ProductWeeklyView }
    }
  }
}

// ============================================
// TABLE TYPES
// ============================================

export interface WeeklySummary {
  id: number
  week_start: string
  week_end: string
  tickets_total: number
  calls: number
  patient_support_tickets: number
  total_submissions: number
  ticket_pct: number | null
  patient_pct: number | null
  satisfaction_rating: number | null
  notes: string | null
  created_at: string
  updated_at: string
}

export interface WeeklySummaryInsert {
  week_start: string
  week_end: string
  tickets_total: number
  calls: number
  patient_support_tickets: number
  total_submissions: number
  ticket_pct?: number | null
  patient_pct?: number | null
  satisfaction_rating?: number | null
  notes?: string | null
}

export interface Trust {
  id: number
  name: string
  is_active: boolean
  created_at: string
}

export interface TrustInsert {
  name: string
  is_active?: boolean
}

export interface TrustTicket {
  id: number
  week_id: number
  trust_id: number
  ticket_count: number
  no_trust_count: number | null
}

export interface TrustTicketInsert {
  week_id: number
  trust_id: number
  ticket_count: number
  no_trust_count?: number | null
}

export interface IssueCategory {
  id: number
  name: string
  parent_id: number | null
  created_at: string
}

export interface IssueCategoryInsert {
  name: string
  parent_id?: number | null
}

export interface WeeklyIssue {
  id: number
  week_id: number
  issue_id: number
  count: number
}

export interface WeeklyIssueInsert {
  week_id: number
  issue_id: number
  count: number
}

export interface TrustIssue {
  id: number
  week_id: number
  trust_id: number
  issue_id: number
  count: number
}

export interface TrustIssueInsert {
  week_id: number
  trust_id: number
  issue_id: number
  count: number
}

export interface Product {
  id: number
  name: string
  is_active: boolean
  created_at: string
}

export interface ProductInsert {
  name: string
  is_active?: boolean
}

export interface ProductTicket {
  id: number
  week_id: number
  product_id: number
  ticket_count: number
}

export interface ProductTicketInsert {
  week_id: number
  product_id: number
  ticket_count: number
}

export interface Channel {
  id: number
  name: string
}

export interface ChannelInsert {
  name: string
}

export interface ChannelBreakdown {
  id: number
  week_id: number
  channel_id: number
  percentage: number
}

export interface ChannelBreakdownInsert {
  week_id: number
  channel_id: number
  percentage: number
}

export interface Agent {
  id: number
  name: string
  is_active: boolean
  created_at: string
}

export interface AgentInsert {
  name: string
  is_active?: boolean
}

export interface AgentFeedback {
  id: number
  week_id: number
  agent_id: number
  comment: string
  created_at: string
}

export interface AgentFeedbackInsert {
  week_id: number
  agent_id: number
  comment: string
}

export interface VersionTicket {
  id: number
  week_id: number
  version: string
  ticket_count: number
}

export interface VersionTicketInsert {
  week_id: number
  version: string
  ticket_count: number
}

export interface WeeklyImage {
  id: number
  week_id: number
  image_url: string
  image_type: 'tickets_by_hour' | 'tickets_by_day'
  created_at: string
}

export interface WeeklyImageInsert {
  week_id: number
  image_url: string
  image_type: 'tickets_by_hour' | 'tickets_by_day'
}

// ============================================
// VIEW TYPES
// ============================================

export interface WeeklyOverviewView {
  id: number
  week_start: string
  week_end: string
  tickets_total: number
  calls: number
  patient_support_tickets: number
  total_submissions: number
  ticket_pct: number | null
  patient_pct: number | null
  satisfaction_rating: number | null
  notes: string | null
  created_at: string
  updated_at: string
  ticket_rag: 'RED' | 'AMBER' | 'GREEN'
  satisfaction_rag: 'RED' | 'AMBER' | 'GREEN'
}

export interface TrustWeeklyView {
  week_start: string
  week_end: string
  trust_name: string
  ticket_count: number
}

export interface TopIssuesWeeklyView {
  week_start: string
  issue_name: string
  parent_issue: string | null
  count: number
}

export interface ProductWeeklyView {
  week_start: string
  product_name: string
  ticket_count: number
}
