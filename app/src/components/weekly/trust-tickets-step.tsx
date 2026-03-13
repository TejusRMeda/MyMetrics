'use client'

import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'

interface TrustEntry {
  trust_id: number
  trust_name: string
  ticket_count: number
}

interface Props {
  data: TrustEntry[]
  onChange: (data: TrustEntry[]) => void
}

export default function TrustTicketsStep({ data, onChange }: Props) {
  const updateCount = (trustId: number, count: number) => {
    onChange(data.map((t) => (t.trust_id === trustId ? { ...t, ticket_count: count } : t)))
  }

  const total = data.reduce((sum, t) => sum + t.ticket_count, 0)

  return (
    <Card>
      <CardHeader>
        <CardTitle>Trust / Hospital Tickets</CardTitle>
        <CardDescription>
          Enter ticket count per trust for this week. Total: <strong>{total}</strong>
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {data.map((trust) => (
            <div key={trust.trust_id} className="flex items-center gap-4">
              <Label className="w-48 text-sm shrink-0">{trust.trust_name}</Label>
              <Input
                type="number"
                min={0}
                value={trust.ticket_count || ''}
                onChange={(e) => updateCount(trust.trust_id, Number(e.target.value))}
                className="w-24"
                placeholder="0"
              />
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  )
}
