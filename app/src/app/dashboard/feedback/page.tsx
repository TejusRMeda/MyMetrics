'use client'

import { useEffect, useState, useCallback } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { FeedbackSkeleton } from '@/components/ui/dashboard-skeleton'
import { getAgentFeedbackForWeek, getAgentFeedbackForWeeks } from '@/lib/dashboard-data'
import { useDateRange } from '@/components/dashboard/date-range-context'

function formatDate(d: string) {
  return new Date(d + 'T00:00:00').toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })
}

interface FeedbackItem {
  agent: string
  comment: string
  weekLabel?: string
}

interface FeedbackGroup {
  agent: string
  comments: { text: string; weekLabel?: string }[]
}

export default function FeedbackPage() {
  const { weekIds, isMultiWeek, allWeeks } = useDateRange()
  const [groups, setGroups] = useState<FeedbackGroup[]>([])
  const [loading, setLoading] = useState(true)

  const loadData = useCallback(async () => {
    if (weekIds.length === 0) return
    setLoading(true)

    let items: FeedbackItem[] = []

    if (isMultiWeek) {
      const data = await getAgentFeedbackForWeeks(weekIds)
      // Build week_id -> label map
      const weekMap = new Map(allWeeks.map((w) => [w.id, `${formatDate(w.week_start)} — ${formatDate(w.week_end)}`]))
      items = data.map((d: Record<string, unknown>) => ({
        agent: (d.agents as { name: string })?.name || 'Unknown',
        comment: d.comment as string,
        weekLabel: weekMap.get(d.week_id as number),
      }))
    } else {
      const data = await getAgentFeedbackForWeek(weekIds[0])
      items = data.map((d: Record<string, unknown>) => ({
        agent: (d.agents as { name: string })?.name || 'Unknown',
        comment: d.comment as string,
      }))
    }

    // Group by agent
    const map = new Map<string, { text: string; weekLabel?: string }[]>()
    for (const item of items) {
      if (!map.has(item.agent)) map.set(item.agent, [])
      map.get(item.agent)!.push({ text: item.comment, weekLabel: item.weekLabel })
    }
    setGroups(Array.from(map.entries()).map(([agent, comments]) => ({ agent, comments })))
    setLoading(false)
  }, [weekIds, isMultiWeek, allWeeks])

  useEffect(() => { loadData() }, [loadData])

  if (loading) return <FeedbackSkeleton />

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-semibold">Agent Feedback</h1>

      {groups.length === 0 ? (
        <div className="text-center text-muted-foreground py-12">No feedback for this period.</div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {groups.map((group) => (
            <Card key={group.agent}>
              <CardHeader>
                <CardTitle className="text-base flex items-center justify-between">
                  {group.agent}
                  <span className="text-sm font-normal text-muted-foreground">
                    {group.comments.length} comment{group.comments.length !== 1 ? 's' : ''}
                  </span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {group.comments.map((c, idx) => (
                    <div key={idx}>
                      <blockquote className="border-l-2 border-primary/30 pl-3 text-sm text-muted-foreground italic">
                        &ldquo;{c.text}&rdquo;
                      </blockquote>
                      {c.weekLabel && (
                        <Badge variant="secondary" className="text-xs mt-1">{c.weekLabel}</Badge>
                      )}
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}
