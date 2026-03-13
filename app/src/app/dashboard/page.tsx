'use client'

import { useEffect, useState, useCallback } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { KPIGridSkeleton } from '@/components/ui/dashboard-skeleton'
import {
  getWeeklyOverview,
  getPreviousWeek,
  getWeeklyOverviewForWeeks,
  getChannelBreakdownForWeek,
  getChannelBreakdownForWeeks,
  getWeeklyImages,
} from '@/lib/dashboard-data'
import { aggregateOverviewKPIs, aggregateChannelBreakdown } from '@/lib/dashboard-aggregation'
import { useDateRange } from '@/components/dashboard/date-range-context'

function KPICard({ label, value, unit, prev, rag }: {
  label: string; value: number | null; unit?: string; prev?: number | null; rag?: string | null
}) {
  const delta = value !== null && prev !== null && prev !== undefined
    ? Number((value - prev).toFixed(2))
    : null

  const ragColor = rag === 'GREEN' ? 'text-green-600'
    : rag === 'AMBER' ? 'text-amber-600'
    : rag === 'RED' ? 'text-red-600'
    : ''

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-medium text-muted-foreground">{label}</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="flex items-end justify-between">
          <div>
            <span className={`text-2xl font-bold ${ragColor}`}>
              {value !== null ? value.toLocaleString() : '—'}
            </span>
            {unit && <span className={`text-sm ml-1 ${ragColor || 'text-muted-foreground'}`}>{unit}</span>}
          </div>
          {delta !== null && (
            <span className={`text-xs font-medium ${delta > 0 ? 'text-red-500' : delta < 0 ? 'text-green-600' : 'text-muted-foreground'}`}>
              {delta > 0 ? '↑' : delta < 0 ? '↓' : '→'} {Math.abs(delta)}{unit === '%' ? '%' : ''}
            </span>
          )}
        </div>
      </CardContent>
    </Card>
  )
}

function formatDate(d: string) {
  return new Date(d + 'T00:00:00').toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })
}

export default function DashboardOverview() {
  const { weekIds, isMultiWeek, rangeLabel, loading: contextLoading } = useDateRange()
  const [current, setCurrent] = useState<Record<string, unknown> | null>(null)
  const [previous, setPrevious] = useState<Record<string, unknown> | null>(null)
  const [channels, setChannels] = useState<{ percentage: number; channels: { name: string } }[]>([])
  const [images, setImages] = useState<{ image_url: string; image_type: string }[]>([])
  const [loading, setLoading] = useState(true)

  const loadData = useCallback(async () => {
    if (weekIds.length === 0) return
    setLoading(true)

    if (isMultiWeek) {
      const [overviewRows, channelRows] = await Promise.all([
        getWeeklyOverviewForWeeks(weekIds),
        getChannelBreakdownForWeeks(weekIds),
      ])
      const aggregated = aggregateOverviewKPIs(overviewRows as Record<string, unknown>[])
      setCurrent(aggregated as Record<string, unknown> | null)
      setPrevious(null) // no deltas in multi-week mode
      setChannels(aggregateChannelBreakdown(channelRows as unknown as { percentage: number; channels: { name: string } }[]))
      setImages([]) // no images in multi-week mode
    } else {
      const weekId = weekIds[0]
      const overview = await getWeeklyOverview(weekId)
      setCurrent(overview)
      if (overview?.week_start) {
        const prev = await getPreviousWeek(overview.week_start)
        setPrevious(prev)
      } else {
        setPrevious(null)
      }
      if (overview?.id) {
        const [ch, img] = await Promise.all([
          getChannelBreakdownForWeek(overview.id),
          getWeeklyImages(overview.id),
        ])
        setChannels(ch as unknown as { percentage: number; channels: { name: string } }[])
        setImages(img as unknown as { image_url: string; image_type: string }[])
      }
    }
    setLoading(false)
  }, [weekIds, isMultiWeek])

  useEffect(() => {
    if (!contextLoading) loadData()
  }, [loadData, contextLoading])

  if (loading || contextLoading) return <KPIGridSkeleton />
  if (!current) return (
    <div className="text-center text-muted-foreground py-12">
      No data yet. <a href="/admin/weekly/new" className="text-primary hover:underline">Enter your first week</a>.
    </div>
  )

  const c = current as Record<string, number | string | null>
  const p = previous as Record<string, number | string | null> | null

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">
          {isMultiWeek ? 'Aggregated Overview' : 'Weekly Overview'}
        </h1>
        <p className="text-sm text-muted-foreground">
          {isMultiWeek
            ? rangeLabel
            : c.week_start && c.week_end
              ? `${formatDate(c.week_start as string)} — ${formatDate(c.week_end as string)}`
              : rangeLabel}
        </p>
      </div>

      {/* KPI cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <KPICard label="Total Tickets" value={c.tickets_total as number} prev={p?.tickets_total as number} />
        <KPICard label="Calls" value={c.calls as number} prev={p?.calls as number} />
        <KPICard label="Patient Support" value={c.patient_support_tickets as number} prev={p?.patient_support_tickets as number} />
        <KPICard label="Submissions" value={c.total_submissions as number} prev={p?.total_submissions as number} />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <KPICard label="Ticket %" value={c.ticket_pct as number} unit="%" prev={p?.ticket_pct as number} rag={c.ticket_rag as string} />
        <KPICard label="Patient %" value={c.patient_pct as number} unit="%" prev={p?.patient_pct as number} />
        <KPICard label="Satisfaction" value={c.satisfaction_rating as number} unit="%" prev={p?.satisfaction_rating as number} rag={c.satisfaction_rag as string} />
      </div>

      {/* Channel breakdown */}
      {channels.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Channel Breakdown</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {channels.map((ch) => (
                <div key={ch.channels?.name} className="flex items-center gap-3">
                  <span className="text-sm w-24 shrink-0">{ch.channels?.name}</span>
                  <div className="flex-1 bg-muted rounded-full h-5 overflow-hidden">
                    <div
                      className="bg-primary h-full rounded-full transition-all"
                      style={{ width: `${ch.percentage}%` }}
                    />
                  </div>
                  <span className="text-sm font-medium w-12 text-right">{ch.percentage}%</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Zendesk screenshots — single week only */}
      {!isMultiWeek && images.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {images.filter((img) => img.image_url.startsWith('https://')).map((img) => (
            <Card key={img.image_type}>
              <CardHeader>
                <CardTitle className="text-base">
                  {img.image_type === 'tickets_by_hour' ? 'Tickets by Hour' : 'Tickets by Day of Week'}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <img src={img.image_url} alt={img.image_type === 'tickets_by_hour' ? 'Tickets by hour chart' : 'Tickets by day of week chart'} className="rounded border w-full" />
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}
