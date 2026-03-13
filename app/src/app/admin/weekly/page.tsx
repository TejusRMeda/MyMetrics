'use client'

import { useEffect, useState, useCallback } from 'react'
import Link from 'next/link'
import { supabase } from '@/lib/supabase'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { TableSkeleton } from '@/components/ui/dashboard-skeleton'
import {
  Table,
  TableBody,
  TableCaption,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { CsvImportDialog } from '@/components/weekly/csv-import-dialog'

interface WeekEntry {
  id: number
  week_start: string
  week_end: string
  tickets_total: number
  satisfaction_rating: number | null
  ticket_pct: number | null
}

function ragColor(type: 'ticket' | 'satisfaction', value: number | null): string {
  if (value === null) return 'text-muted-foreground'
  if (type === 'ticket') {
    if (value > 10) return 'text-red-700 dark:text-red-400'
    if (value >= 5) return 'text-amber-700 dark:text-amber-400'
    return 'text-green-700 dark:text-green-400'
  }
  // satisfaction
  if (value < 85) return 'text-red-700 dark:text-red-400'
  if (value <= 95) return 'text-amber-700 dark:text-amber-400'
  return 'text-green-700 dark:text-green-400'
}

export default function WeeklyListPage() {
  const [weeks, setWeeks] = useState<WeekEntry[]>([])
  const [loading, setLoading] = useState(true)
  const [importOpen, setImportOpen] = useState(false)

  const fetchWeeks = useCallback(async () => {
    const { data, error } = await supabase
      .from('weekly_summary')
      .select('id, week_start, week_end, tickets_total, satisfaction_rating, ticket_pct')
      .order('week_start', { ascending: false })
    if (error) {
      toast.error('Failed to load weekly entries: ' + error.message)
    }
    setWeeks(data || [])
    setLoading(false)
  }, [])

  useEffect(() => {
    fetchWeeks()
  }, [fetchWeeks])

  const formatDate = (d: string) => {
    return new Date(d + 'T00:00:00').toLocaleDateString('en-GB', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    })
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-semibold">Weekly Entries</h1>
          <p className="text-sm text-muted-foreground mt-1">View and manage weekly support data.</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => setImportOpen(true)}>
            Import Data
          </Button>
          <Button nativeButton={false} render={<Link href="/admin/weekly/new" />}>
            + New Week
          </Button>
        </div>
      </div>

      {loading ? (
        <TableSkeleton />
      ) : (
      <div className="border rounded-lg overflow-x-auto">
        {weeks.length === 0 ? (
          <div className="p-8 text-center text-muted-foreground">
            No weekly entries yet. Click &quot;+ New Week&quot; to submit your first week of data.
          </div>
        ) : (
          <Table>
            <TableCaption className="sr-only">Weekly support data entries</TableCaption>
            <TableHeader>
              <TableRow>
                <TableHead>Week</TableHead>
                <TableHead className="text-right">Tickets</TableHead>
                <TableHead className="text-right">Ticket %</TableHead>
                <TableHead className="text-right">Satisfaction</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {weeks.map((week) => (
                <TableRow key={week.id}>
                  <TableCell className="font-medium">
                    <span aria-label={`${formatDate(week.week_start)} to ${formatDate(week.week_end)}`}>
                      {formatDate(week.week_start)} — {formatDate(week.week_end)}
                    </span>
                  </TableCell>
                  <TableCell className="text-right">{week.tickets_total}</TableCell>
                  <TableCell className={`text-right font-medium ${ragColor('ticket', week.ticket_pct)}`}>
                    {week.ticket_pct !== null ? `${week.ticket_pct}%` : '—'}
                  </TableCell>
                  <TableCell className={`text-right font-medium ${ragColor('satisfaction', week.satisfaction_rating)}`}>
                    {week.satisfaction_rating !== null ? `${week.satisfaction_rating}%` : '—'}
                  </TableCell>
                  <TableCell className="text-right">
                    <Link
                      href={`/admin/weekly/edit/${week.id}`}
                      className="text-sm text-primary hover:underline font-medium"
                    >
                      Edit
                    </Link>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </div>
      )}

      <CsvImportDialog
        open={importOpen}
        onOpenChange={setImportOpen}
        onComplete={fetchWeeks}
      />
    </div>
  )
}
