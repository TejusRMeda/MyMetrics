'use client'

import { useEffect, useState, useCallback } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { SingleChartSkeleton } from '@/components/ui/dashboard-skeleton'
import { getTrustTicketsForWeek, getTrustTicketsForWeeks, getTrustIssuesForWeeks } from '@/lib/dashboard-data'
import { aggregateTrustTickets, aggregateTrustIssues } from '@/lib/dashboard-aggregation'
import { useDateRange } from '@/components/dashboard/date-range-context'
import { supabase } from '@/lib/supabase'
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
} from 'recharts'

export default function TrustsPage() {
  const { weekIds, isMultiWeek } = useDateRange()
  const [trustData, setTrustData] = useState<{ name: string; tickets: number }[]>([])
  const [trustIssues, setTrustIssues] = useState<{ trust: string; issue: string; count: number }[]>([])
  const [selectedTrust, setSelectedTrust] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)

  const loadData = useCallback(async () => {
    if (weekIds.length === 0) return
    setLoading(true)

    if (isMultiWeek) {
      const [ticketData, issueData] = await Promise.all([
        getTrustTicketsForWeeks(weekIds),
        getTrustIssuesForWeeks(weekIds),
      ])
      setTrustData(aggregateTrustTickets(ticketData as unknown as { ticket_count: number; trusts: { name: string } }[]))
      setTrustIssues(aggregateTrustIssues(issueData as unknown as { count: number; trusts: { name: string }; issue_categories: { name: string } }[]))
    } else {
      const weekId = weekIds[0]
      const data = await getTrustTicketsForWeek(weekId)
      setTrustData(data.map((d: Record<string, unknown>) => ({
        name: (d.trusts as { name: string })?.name || 'Unknown',
        tickets: d.ticket_count as number,
      })))

      const { data: issueData } = await supabase
        .from('trust_issues')
        .select('count, trusts(name), issue_categories(name)')
        .eq('week_id', weekId)
        .order('count', { ascending: false })
      setTrustIssues(
        (issueData || []).map((d: Record<string, unknown>) => ({
          trust: (d.trusts as { name: string })?.name || '',
          issue: (d.issue_categories as { name: string })?.name || '',
          count: d.count as number,
        }))
      )
    }
    setLoading(false)
  }, [weekIds, isMultiWeek])

  useEffect(() => { loadData() }, [loadData])

  const filteredIssues = selectedTrust
    ? trustIssues.filter((i) => i.trust === selectedTrust)
    : trustIssues

  if (loading) return <SingleChartSkeleton />
  if (trustData.length === 0) return <div className="text-center text-muted-foreground py-12">No data yet.</div>

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-semibold">Trust / Hospital View</h1>

      <Card>
        <CardHeader><CardTitle className="text-base">Tickets by Trust</CardTitle></CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={trustData} layout="vertical" margin={{ left: 20 }}>
              <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
              <XAxis type="number" tick={{ fontSize: 12 }} />
              <YAxis type="category" dataKey="name" tick={{ fontSize: 12 }} width={90} />
              <Tooltip />
              <Bar
                dataKey="tickets"
                fill="hsl(var(--primary))"
                radius={[0, 4, 4, 0]}
                cursor="pointer"
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                onClick={(d: any) => setSelectedTrust(d.name === selectedTrust ? null : d.name)}
              />
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="text-base">
              Issue Breakdown {selectedTrust ? `— ${selectedTrust}` : '(All Trusts)'}
            </CardTitle>
            {selectedTrust && (
              <button
                onClick={() => setSelectedTrust(null)}
                className="text-sm text-muted-foreground hover:text-foreground"
              >
                Show all
              </button>
            )}
          </div>
        </CardHeader>
        <CardContent>
          {filteredIssues.length === 0 ? (
            <p className="text-sm text-muted-foreground">No issue data for this selection.</p>
          ) : (
            <div className="space-y-2">
              {filteredIssues.slice(0, 20).map((item, idx) => (
                <div key={idx} className="flex items-center gap-3">
                  {!selectedTrust && (
                    <span className="text-xs text-muted-foreground w-20 sm:w-32 shrink-0 truncate">{item.trust}</span>
                  )}
                  <span className="text-sm flex-1">{item.issue}</span>
                  <div className="w-20 sm:w-32 bg-muted rounded-full h-4 overflow-hidden shrink-0">
                    <div
                      className="bg-primary/70 h-full rounded-full"
                      style={{ width: `${Math.min((item.count / (filteredIssues[0]?.count || 1)) * 100, 100)}%` }}
                    />
                  </div>
                  <span className="text-sm font-medium w-8 text-right shrink-0">{item.count}</span>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
