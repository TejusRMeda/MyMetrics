'use client'

import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'

interface ChannelEntry {
  channel_id: number
  channel_name: string
  percentage: number
}

interface Props {
  data: ChannelEntry[]
  onChange: (data: ChannelEntry[]) => void
}

export default function ChannelsStep({ data, onChange }: Props) {
  const updatePct = (channelId: number, pct: number) => {
    onChange(data.map((c) => (c.channel_id === channelId ? { ...c, percentage: pct } : c)))
  }

  const total = data.reduce((sum, c) => sum + c.percentage, 0)
  const isValid = Math.abs(total - 100) <= 1

  return (
    <Card>
      <CardHeader>
        <CardTitle>Channel Breakdown</CardTitle>
        <CardDescription>
          Enter the percentage split across channels. Total:{' '}
          <strong className={isValid ? 'text-green-600' : 'text-orange-500'}>{total}%</strong>
          {!isValid && total > 0 && <span className="text-orange-500 text-xs ml-2">(should be ~100%)</span>}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {data.map((channel) => (
            <div key={channel.channel_id} className="flex items-center gap-4">
              <Label className="w-48 text-sm shrink-0">{channel.channel_name}</Label>
              <div className="flex items-center gap-1">
                <Input
                  type="number"
                  min={0}
                  max={100}
                  step={0.1}
                  value={channel.percentage || ''}
                  onChange={(e) => updatePct(channel.channel_id, Number(e.target.value))}
                  className="w-24"
                  placeholder="0"
                />
                <span className="text-sm text-muted-foreground">%</span>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  )
}
