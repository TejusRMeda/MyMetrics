'use client'

import { useEffect, useState, useCallback } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { SingleChartSkeleton } from '@/components/ui/dashboard-skeleton'
import { getTopIssuesForWeek, getTopIssuesForWeeks } from '@/lib/dashboard-data'
import { aggregateIssues } from '@/lib/dashboard-aggregation'
import { useDateRange } from '@/components/dashboard/date-range-context'
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
} from 'recharts'

interface IssueRow {
  name: string
  count: number
  parent_id: number | null
  id: number
}

export default function IssuesPage() {
  const { weekIds, isMultiWeek } = useDateRange()
  const [issues, setIssues] = useState<IssueRow[]>([])
  const [expandedParent, setExpandedParent] = useState<number | null>(null)
  const [loading, setLoading] = useState(true)

  const loadData = useCallback(async () => {
    if (weekIds.length === 0) return
    setLoading(true)

    if (isMultiWeek) {
      const data = await getTopIssuesForWeeks(weekIds)
      const aggregated = aggregateIssues(data as unknown as { count: number; issue_categories: { id: number; name: string; parent_id: number | null } }[])
      setIssues(aggregated)
    } else {
      const data = await getTopIssuesForWeek(weekIds[0])
      setIssues(data.map((d: Record<string, unknown>) => {
        const cat = d.issue_categories as { id: number; name: string; parent_id: number | null }
        return { id: cat?.id || 0, name: cat?.name || 'Unknown', count: d.count as number, parent_id: cat?.parent_id || null }
      }))
    }
    setLoading(false)
  }, [weekIds, isMultiWeek])

  useEffect(() => { loadData() }, [loadData])

  const parentIssues = issues.filter((i) => i.parent_id === null).sort((a, b) => b.count - a.count)
  const getChildren = (parentId: number) => issues.filter((i) => i.parent_id === parentId).sort((a, b) => b.count - a.count)

  const chartData = parentIssues.filter((i) => i.count > 0).slice(0, 10)
  const maxCount = chartData[0]?.count || 1

  if (loading) return <SingleChartSkeleton />
  if (issues.length === 0) return <div className="text-center text-muted-foreground py-12">No data yet.</div>

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-semibold">Issues View</h1>

      <Card>
        <CardHeader><CardTitle className="text-base">Top Issues</CardTitle></CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={Math.max(chartData.length * 35, 200)}>
            <BarChart data={chartData} layout="vertical" margin={{ left: 20 }}>
              <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
              <XAxis type="number" tick={{ fontSize: 12 }} />
              <YAxis type="category" dataKey="name" tick={{ fontSize: 11 }} width={110} />
              <Tooltip />
              <Bar dataKey="count" fill="hsl(var(--primary))" radius={[0, 4, 4, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle className="text-base">Issue Breakdown</CardTitle></CardHeader>
        <CardContent>
          <div className="space-y-1">
            {parentIssues.map((parent) => {
              const children = getChildren(parent.id)
              const isExpanded = expandedParent === parent.id
              return (
                <div key={parent.id}>
                  <div
                    className="flex items-center gap-3 py-2 cursor-pointer hover:bg-muted/50 rounded px-2"
                    role="button"
                    tabIndex={0}
                    onClick={() => setExpandedParent(isExpanded ? null : parent.id)}
                    onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); setExpandedParent(isExpanded ? null : parent.id) } }}
                  >
                    <span className="text-xs text-muted-foreground w-4 shrink-0">
                      {children.length > 0 ? (isExpanded ? '▾' : '▸') : '•'}
                    </span>
                    <span className="text-sm flex-1 font-medium min-w-0 truncate">{parent.name}</span>
                    {children.length > 0 && (
                      <Badge variant="secondary" className="text-xs shrink-0">{children.length} sub</Badge>
                    )}
                    <div className="w-20 sm:w-32 bg-muted rounded-full h-4 overflow-hidden shrink-0">
                      <div
                        className="bg-primary h-full rounded-full"
                        style={{ width: `${(parent.count / maxCount) * 100}%` }}
                      />
                    </div>
                    <span className="text-sm font-bold w-10 text-right shrink-0">{parent.count}</span>
                  </div>
                  {isExpanded && children.map((child) => (
                    <div key={child.id} className="flex items-center gap-3 py-1.5 pl-8 pr-2">
                      <span className="text-muted-foreground/50 text-xs shrink-0">└</span>
                      <span className="text-sm text-muted-foreground flex-1 min-w-0 truncate">{child.name}</span>
                      <div className="w-20 sm:w-32 bg-muted rounded-full h-3 overflow-hidden shrink-0">
                        <div
                          className="bg-primary/50 h-full rounded-full"
                          style={{ width: `${(child.count / maxCount) * 100}%` }}
                        />
                      </div>
                      <span className="text-sm w-10 text-right shrink-0">{child.count}</span>
                    </div>
                  ))}
                </div>
              )
            })}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
