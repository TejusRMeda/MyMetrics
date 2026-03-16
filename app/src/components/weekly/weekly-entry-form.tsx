'use client'

import { useEffect, useState, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import {
  saveWeeklySummary,
  saveTrustTickets,
  saveTrustIssues,
  saveWeeklyIssues,
  saveProductTickets,
  saveChannelBreakdown,
  saveAgentFeedback,
  saveVersionTickets,
  saveWeeklyImage,
  loadWeekData,
} from '@/lib/weekly-actions'

import SummaryStep from '@/components/weekly/summary-step'
import TrustTicketsStep from '@/components/weekly/trust-tickets-step'
import TrustIssuesStep from '@/components/weekly/trust-issues-step'
import TopIssuesStep from '@/components/weekly/top-issues-step'
import ProductTicketsStep from '@/components/weekly/product-tickets-step'
import ChannelsStep from '@/components/weekly/channels-step'
import FeedbackStep from '@/components/weekly/feedback-step'
import ImagesStep from '@/components/weekly/images-step'

const STEPS = [
  'Summary',
  'Trust Tickets',
  'Trust Issues',
  'Top Issues',
  'Products',
  'Channels',
  'Feedback & Versions',
  'Screenshots',
]

interface WeeklyEntryFormProps {
  editWeekId?: number
}

export default function WeeklyEntryForm({ editWeekId }: WeeklyEntryFormProps) {
  const router = useRouter()
  const [step, setStep] = useState(0)
  const [saving, setSaving] = useState(false)
  const [loading, setLoading] = useState(!!editWeekId)
  const [weekId, setWeekId] = useState<number | null>(editWeekId ?? null)

  // Reference data
  const [trusts, setTrusts] = useState<{ id: number; name: string }[]>([])
  const [issues, setIssues] = useState<{ id: number; name: string; parent_id: number | null }[]>([])
  const [products, setProducts] = useState<{ id: number; name: string }[]>([])
  const [channels, setChannels] = useState<{ id: number; name: string }[]>([])
  const [agents, setAgents] = useState<{ id: number; name: string }[]>([])

  // Form state
  const [summary, setSummary] = useState({
    week_start: '',
    week_end: '',
    tickets_total: 0,
    calls: 0,
    patient_support_tickets: 0,
    total_submissions: 0,
    ticket_pct: 0,
    patient_pct: 0,
    satisfaction_rating: 0,
    notes: '',
  })

  const [trustTickets, setTrustTickets] = useState<{ trust_id: number; trust_name: string; ticket_count: number }[]>([])
  const [trustIssuesData, setTrustIssuesData] = useState<Record<number, { trust_id: number; issue_id: number; count: number }[]>>({})
  const [topIssues, setTopIssues] = useState<{ issue_id: number; count: number }[]>([])
  const [productTickets, setProductTickets] = useState<{ product_id: number; product_name: string; ticket_count: number }[]>([])
  const [channelBreakdown, setChannelBreakdown] = useState<{ channel_id: number; channel_name: string; percentage: number }[]>([])
  const [agentFeedback, setAgentFeedback] = useState<{ agent_id: number; agent_name: string; comment: string }[]>([])
  const [versionTickets, setVersionTickets] = useState<{ version: string; ticket_count: number }[]>([])
  const [weeklyImages, setWeeklyImages] = useState<{ image_type: 'tickets_by_hour' | 'tickets_by_day'; file: File | null }[]>([
    { image_type: 'tickets_by_hour', file: null },
    { image_type: 'tickets_by_day', file: null },
  ])

  // Load reference data + existing week data if editing
  const loadRefData = useCallback(async () => {
    const [t, i, p, ch, a] = await Promise.all([
      supabase.from('trusts').select('id, name').eq('is_active', true).order('name'),
      supabase.from('issue_categories').select('id, name, parent_id').order('name'),
      supabase.from('products').select('id, name').eq('is_active', true).order('name'),
      supabase.from('channels').select('id, name').order('name'),
      supabase.from('agents').select('id, name').eq('is_active', true).order('name'),
    ])

    const trustsList: { id: number; name: string }[] = t.data ?? []
    const issuesList: { id: number; name: string; parent_id: number | null }[] = i.data ?? []
    const productsList: { id: number; name: string }[] = p.data ?? []
    const channelsList: { id: number; name: string }[] = ch.data ?? []
    const agentsList: { id: number; name: string }[] = a.data ?? []

    setTrusts(trustsList)
    setIssues(issuesList)
    setProducts(productsList)
    setChannels(channelsList)
    setAgents(agentsList)

    if (editWeekId) {
      // Load existing data
      const existing = await loadWeekData(editWeekId)

      if (existing.summary) {
        const s = existing.summary as Record<string, unknown>
        setSummary({
          week_start: (s.week_start as string) || '',
          week_end: (s.week_end as string) || '',
          tickets_total: (s.tickets_total as number) || 0,
          calls: (s.calls as number) || 0,
          patient_support_tickets: (s.patient_support_tickets as number) || 0,
          total_submissions: (s.total_submissions as number) || 0,
          ticket_pct: (s.ticket_pct as number) || 0,
          patient_pct: (s.patient_pct as number) || 0,
          satisfaction_rating: (s.satisfaction_rating as number) || 0,
          notes: (s.notes as string) || '',
        })
      }

      // Trust tickets — merge with full trusts list so all trusts show
      const existingTrustTickets = existing.trustTickets as { trust_id: number; ticket_count: number }[]
      setTrustTickets(trustsList.map((tr) => {
        const match = existingTrustTickets.find((et) => et.trust_id === tr.id)
        return { trust_id: tr.id, trust_name: tr.name, ticket_count: match?.ticket_count || 0 }
      }))

      // Trust issues — group by trust_id
      const existingTrustIssues = existing.trustIssues as { trust_id: number; issue_id: number; count: number }[]
      const grouped: Record<number, { trust_id: number; issue_id: number; count: number }[]> = {}
      for (const ti of existingTrustIssues) {
        if (!grouped[ti.trust_id]) grouped[ti.trust_id] = []
        grouped[ti.trust_id].push({ trust_id: ti.trust_id, issue_id: ti.issue_id, count: ti.count })
      }
      setTrustIssuesData(grouped)

      // Top issues
      const existingWeeklyIssues = existing.weeklyIssues as { issue_id: number; count: number }[]
      setTopIssues(existingWeeklyIssues.map((wi) => ({ issue_id: wi.issue_id, count: wi.count })))

      // Product tickets — merge with full products list
      const existingProductTickets = existing.productTickets as { product_id: number; ticket_count: number }[]
      setProductTickets(productsList.map((pr) => {
        const match = existingProductTickets.find((ep) => ep.product_id === pr.id)
        return { product_id: pr.id, product_name: pr.name, ticket_count: match?.ticket_count || 0 }
      }))

      // Channel breakdown — merge with full channels list
      const existingChannels = existing.channelBreakdown as { channel_id: number; percentage: number }[]
      setChannelBreakdown(channelsList.map((c) => {
        const match = existingChannels.find((ec) => ec.channel_id === c.id)
        return { channel_id: c.id, channel_name: c.name, percentage: match?.percentage || 0 }
      }))

      // Agent feedback
      const existingFeedback = existing.agentFeedback as { agent_id: number; comment: string }[]
      setAgentFeedback(existingFeedback.map((f) => {
        const agent = agentsList.find((a) => a.id === f.agent_id)
        return { agent_id: f.agent_id, agent_name: agent?.name || 'Unknown', comment: f.comment }
      }))

      // Version tickets
      const existingVersions = existing.versionTickets as { version: string; ticket_count: number }[]
      setVersionTickets(existingVersions.map((v) => ({ version: v.version, ticket_count: v.ticket_count })))

      setLoading(false)
    } else {
      // New entry — initialize empty arrays
      setTrustTickets(trustsList.map((tr) => ({ trust_id: tr.id, trust_name: tr.name, ticket_count: 0 })))
      setProductTickets(productsList.map((pr) => ({ product_id: pr.id, product_name: pr.name, ticket_count: 0 })))
      setChannelBreakdown(channelsList.map((c) => ({ channel_id: c.id, channel_name: c.name, percentage: 0 })))
    }
  }, [editWeekId])

  useEffect(() => {
    loadRefData()
  }, [loadRefData])

  // Save current step data
  const saveStep = async () => {
    setSaving(true)
    try {
      if (step === 0) {
        if (!summary.week_start || !summary.week_end) {
          toast.error('Please enter week start and end dates.')
          setSaving(false)
          return false
        }
        if (summary.week_start >= summary.week_end) {
          toast.error('Week start must be before week end.')
          setSaving(false)
          return false
        }
        const { id, error } = await saveWeeklySummary(summary, weekId ?? undefined)
        if (error) {
          toast.error(error.message)
          setSaving(false)
          return false
        }
        if (id) setWeekId(id)
        toast.success('Summary saved')
      } else if (step === 1 && weekId) {
        const { error } = await saveTrustTickets(weekId, trustTickets)
        if (error) { toast.error(error.message); setSaving(false); return false }
        toast.success('Trust tickets saved')
      } else if (step === 2 && weekId) {
        const flat = Object.values(trustIssuesData).flat().filter((e) => e.issue_id > 0 && e.count > 0)
        const { error } = await saveTrustIssues(weekId, flat)
        if (error) { toast.error(error.message); setSaving(false); return false }
        toast.success('Trust issues saved')
      } else if (step === 3 && weekId) {
        const { error } = await saveWeeklyIssues(weekId, topIssues)
        if (error) { toast.error(error.message); setSaving(false); return false }
        toast.success('Top issues saved')
      } else if (step === 4 && weekId) {
        const { error } = await saveProductTickets(weekId, productTickets)
        if (error) { toast.error(error.message); setSaving(false); return false }
        toast.success('Product tickets saved')
      } else if (step === 5 && weekId) {
        const { error } = await saveChannelBreakdown(weekId, channelBreakdown)
        if (error) { toast.error(error.message); setSaving(false); return false }
        toast.success('Channel breakdown saved')
      } else if (step === 6 && weekId) {
        const feedbackFiltered = agentFeedback.filter((f) => f.agent_id > 0 && f.comment.trim())
        const { error: fbErr } = await saveAgentFeedback(weekId, feedbackFiltered)
        if (fbErr) { toast.error(fbErr.message); setSaving(false); return false }
        const { error: vErr } = await saveVersionTickets(weekId, versionTickets)
        if (vErr) { toast.error(vErr.message); setSaving(false); return false }
        toast.success('Feedback & versions saved')
      } else if (step === 7 && weekId) {
        for (const img of weeklyImages) {
          if (img.file) {
            const { error } = await saveWeeklyImage(weekId, img.image_type, img.file)
            if (error) { toast.error(`Image upload failed: ${error.message}`); setSaving(false); return false }
          }
        }
        toast.success('Images uploaded')
      }
    } catch {
      toast.error('An unexpected error occurred')
      setSaving(false)
      return false
    }
    setSaving(false)
    return true
  }

  const handleNext = async () => {
    const ok = await saveStep()
    if (ok && step < STEPS.length - 1) setStep(step + 1)
  }

  const handleFinish = async () => {
    const ok = await saveStep()
    if (ok) {
      toast.success(editWeekId ? 'Weekly entry updated!' : 'Weekly entry complete!')
      router.push('/admin/weekly')
    }
  }

  if (loading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-8 w-64" />
        <Skeleton className="h-4 w-40" />
        <div className="flex gap-1">
          {STEPS.map((s) => <Skeleton key={s} className="flex-1 h-2 rounded-full" />)}
        </div>
        <Skeleton className="h-64 w-full rounded-lg" />
      </div>
    )
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-semibold">{editWeekId ? 'Edit Weekly Entry' : 'New Weekly Entry'}</h1>
          <p className="text-sm text-muted-foreground mt-1" aria-live="polite">
            Step {step + 1} of {STEPS.length}: {STEPS[step]}
          </p>
        </div>
      </div>

      {/* Step indicators */}
      <div className="flex gap-1 mb-6">
        {STEPS.map((s, i) => (
          <button
            key={s}
            onClick={() => {
              if (i <= step || weekId) setStep(i)
            }}
            className={`flex-1 h-2 rounded-full transition-colors ${
              i <= step ? 'bg-primary' : 'bg-muted'
            } ${i <= step || weekId ? 'cursor-pointer' : 'cursor-not-allowed'}`}
            title={s}
          />
        ))}
      </div>

      {/* Step content */}
      <div className="mb-6">
        {step === 0 && <SummaryStep data={summary} onChange={setSummary} />}
        {step === 1 && <TrustTicketsStep data={trustTickets} onChange={setTrustTickets} />}
        {step === 2 && (
          <TrustIssuesStep
            trusts={trustTickets}
            issues={issues}
            data={trustIssuesData}
            onChange={setTrustIssuesData}
          />
        )}
        {step === 3 && <TopIssuesStep issues={issues} data={topIssues} onChange={setTopIssues} />}
        {step === 4 && <ProductTicketsStep data={productTickets} onChange={setProductTickets} />}
        {step === 5 && <ChannelsStep data={channelBreakdown} onChange={setChannelBreakdown} />}
        {step === 6 && (
          <FeedbackStep
            agents={agents}
            feedback={agentFeedback}
            versions={versionTickets}
            onFeedbackChange={setAgentFeedback}
            onVersionsChange={setVersionTickets}
          />
        )}
        {step === 7 && <ImagesStep data={weeklyImages} onChange={setWeeklyImages} />}
      </div>

      {/* Navigation */}
      <div className="flex justify-between">
        <Button
          variant="outline"
          onClick={() => setStep(step - 1)}
          disabled={step === 0}
        >
          Previous
        </Button>
        <div className="flex gap-2">
          {step < STEPS.length - 1 ? (
            <Button onClick={handleNext} disabled={saving}>
              {saving ? 'Saving...' : 'Save & Next'}
            </Button>
          ) : (
            <Button onClick={handleFinish} disabled={saving}>
              {saving ? 'Saving...' : 'Finish'}
            </Button>
          )}
        </div>
      </div>
    </div>
  )
}
