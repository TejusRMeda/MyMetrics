'use client'

import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'

interface SummaryData {
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

interface Props {
  data: SummaryData
  onChange: (data: SummaryData) => void
}

export default function SummaryStep({ data, onChange }: Props) {
  const update = (field: keyof SummaryData, value: string | number) => {
    const newData = { ...data, [field]: value }

    // Auto-calculate percentages
    if (field === 'tickets_total' || field === 'total_submissions') {
      const tickets = field === 'tickets_total' ? Number(value) : data.tickets_total
      const submissions = field === 'total_submissions' ? Number(value) : data.total_submissions
      if (submissions > 0) {
        newData.ticket_pct = Math.round((tickets / submissions) * 10000) / 100
      }
    }
    if (field === 'patient_support_tickets' || field === 'total_submissions') {
      const patients = field === 'patient_support_tickets' ? Number(value) : data.patient_support_tickets
      const submissions = field === 'total_submissions' ? Number(value) : data.total_submissions
      if (submissions > 0) {
        newData.patient_pct = Math.round((patients / submissions) * 10000) / 100
      }
    }

    onChange(newData)
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Weekly Summary</CardTitle>
        <CardDescription>Top-level KPIs for the reporting week.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Date range */}
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label>Week Start</Label>
            <Input
              type="date"
              value={data.week_start}
              onChange={(e) => update('week_start', e.target.value)}
            />
          </div>
          <div className="space-y-2">
            <Label>Week End</Label>
            <Input
              type="date"
              value={data.week_end}
              onChange={(e) => update('week_end', e.target.value)}
            />
          </div>
        </div>

        {/* Core metrics */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          <div className="space-y-2">
            <Label>Total Tickets</Label>
            <Input
              type="number"
              min={0}
              value={data.tickets_total || ''}
              onChange={(e) => update('tickets_total', Number(e.target.value))}
              placeholder="0"
            />
          </div>
          <div className="space-y-2">
            <Label>Calls</Label>
            <Input
              type="number"
              min={0}
              value={data.calls || ''}
              onChange={(e) => update('calls', Number(e.target.value))}
              placeholder="0"
            />
          </div>
          <div className="space-y-2">
            <Label>Patient Support Tickets</Label>
            <Input
              type="number"
              min={0}
              value={data.patient_support_tickets || ''}
              onChange={(e) => update('patient_support_tickets', Number(e.target.value))}
              placeholder="0"
            />
          </div>
          <div className="space-y-2">
            <Label>Total Submissions</Label>
            <Input
              type="number"
              min={0}
              value={data.total_submissions || ''}
              onChange={(e) => update('total_submissions', Number(e.target.value))}
              placeholder="0"
            />
          </div>
        </div>

        {/* Calculated + satisfaction */}
        <div className="grid grid-cols-3 gap-4">
          <div className="space-y-2">
            <Label>Ticket % <span className="text-muted-foreground text-xs">(auto)</span></Label>
            <Input
              type="number"
              step="0.01"
              value={data.ticket_pct || ''}
              onChange={(e) => update('ticket_pct', Number(e.target.value))}
              placeholder="0.00"
            />
          </div>
          <div className="space-y-2">
            <Label>Patient % <span className="text-muted-foreground text-xs">(auto)</span></Label>
            <Input
              type="number"
              step="0.01"
              value={data.patient_pct || ''}
              onChange={(e) => update('patient_pct', Number(e.target.value))}
              placeholder="0.00"
            />
          </div>
          <div className="space-y-2">
            <Label>Satisfaction Rating %</Label>
            <Input
              type="number"
              step="0.1"
              min={0}
              max={100}
              value={data.satisfaction_rating || ''}
              onChange={(e) => update('satisfaction_rating', Number(e.target.value))}
              placeholder="0.0"
            />
          </div>
        </div>

        {/* Notes */}
        <div className="space-y-2">
          <Label>Notes (optional)</Label>
          <Textarea
            value={data.notes}
            onChange={(e) => update('notes', e.target.value)}
            placeholder="Any context for this week..."
            rows={3}
          />
        </div>
      </CardContent>
    </Card>
  )
}
