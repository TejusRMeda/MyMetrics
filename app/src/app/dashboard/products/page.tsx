'use client'

import { useEffect, useState, useCallback } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { ChartPageSkeleton } from '@/components/ui/dashboard-skeleton'
import { getProductTicketsForWeek, getProductTicketsForWeeks } from '@/lib/dashboard-data'
import { aggregateProductTickets } from '@/lib/dashboard-aggregation'
import { useDateRange } from '@/components/dashboard/date-range-context'
import {
  PieChart, Pie, Cell, ResponsiveContainer, Tooltip,
} from 'recharts'

const COLORS = ['#2563eb', '#7c3aed', '#db2777', '#ea580c', '#16a34a', '#6b7280']

export default function ProductsPage() {
  const { weekIds, isMultiWeek } = useDateRange()
  const [productData, setProductData] = useState<{ name: string; value: number }[]>([])
  const [loading, setLoading] = useState(true)

  const loadData = useCallback(async () => {
    if (weekIds.length === 0) return
    setLoading(true)
    if (isMultiWeek) {
      const data = await getProductTicketsForWeeks(weekIds)
      setProductData(aggregateProductTickets(data as unknown as { ticket_count: number; products: { name: string } }[]))
    } else {
      const data = await getProductTicketsForWeek(weekIds[0])
      const mapped = data.map((d: Record<string, unknown>) => ({
        name: (d.products as { name: string })?.name || 'Unknown',
        value: d.ticket_count as number,
      }))
      setProductData(mapped)
    }
    setLoading(false)
  }, [weekIds, isMultiWeek])

  useEffect(() => { loadData() }, [loadData])

  const total = productData.reduce((sum, p) => sum + p.value, 0)

  if (loading) return <ChartPageSkeleton />
  if (productData.length === 0) return <div className="text-center text-muted-foreground py-12">No data yet.</div>

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-semibold">Product View</h1>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader><CardTitle className="text-base">Product Distribution</CardTitle></CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={productData}
                  cx="50%"
                  cy="50%"
                  outerRadius={100}
                  dataKey="value"
                  label={({ name, percent }) => `${name} (${((percent ?? 0) * 100).toFixed(0)}%)`}
                  labelLine={false}
                >
                  {productData.map((_, idx) => (
                    <Cell key={idx} fill={COLORS[idx % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle className="text-base">Product Breakdown</CardTitle></CardHeader>
          <CardContent>
            <div className="space-y-3">
              {productData.map((p, idx) => (
                <div key={p.name} className="flex items-center gap-3">
                  <div className="w-3 h-3 rounded-full shrink-0" style={{ background: COLORS[idx % COLORS.length] }} />
                  <span className="text-sm flex-1">{p.name}</span>
                  <div className="w-20 sm:w-32 bg-muted rounded-full h-4 overflow-hidden shrink-0">
                    <div
                      className="h-full rounded-full"
                      style={{ width: `${(p.value / (total || 1)) * 100}%`, background: COLORS[idx % COLORS.length] }}
                    />
                  </div>
                  <span className="text-sm font-medium w-12 text-right">{p.value}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
