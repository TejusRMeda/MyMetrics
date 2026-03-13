'use client'

import { Textarea } from '@/components/ui/textarea'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'

interface AgentOption {
  id: number
  name: string
}

interface FeedbackEntry {
  agent_id: number
  agent_name: string
  comment: string
}

interface VersionEntry {
  version: string
  ticket_count: number
}

interface Props {
  agents: AgentOption[]
  feedback: FeedbackEntry[]
  versions: VersionEntry[]
  onFeedbackChange: (data: FeedbackEntry[]) => void
  onVersionsChange: (data: VersionEntry[]) => void
}

export default function FeedbackStep({ agents, feedback, versions, onFeedbackChange, onVersionsChange }: Props) {
  const addFeedback = () => {
    onFeedbackChange([...feedback, { agent_id: 0, agent_name: '', comment: '' }])
  }

  const updateFeedback = (index: number, field: string, value: string | number) => {
    const updated = [...feedback]
    if (field === 'agent_id') {
      const agent = agents.find((a) => a.id === Number(value))
      updated[index] = { ...updated[index], agent_id: Number(value), agent_name: agent?.name || '' }
    } else {
      updated[index] = { ...updated[index], [field]: value }
    }
    onFeedbackChange(updated)
  }

  const removeFeedback = (index: number) => {
    const updated = [...feedback]
    updated.splice(index, 1)
    onFeedbackChange(updated)
  }

  const addVersion = () => {
    onVersionsChange([...versions, { version: '', ticket_count: 0 }])
  }

  const updateVersion = (index: number, field: string, value: string | number) => {
    const updated = [...versions]
    updated[index] = { ...updated[index], [field]: value }
    onVersionsChange(updated)
  }

  const removeVersion = (index: number) => {
    const updated = [...versions]
    updated.splice(index, 1)
    onVersionsChange(updated)
  }

  return (
    <div className="space-y-6">
      {/* Agent Feedback */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Agent Feedback</CardTitle>
              <CardDescription>Satisfaction feedback comments per agent.</CardDescription>
            </div>
            <Button size="sm" variant="outline" onClick={addFeedback}>
              + Add Comment
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {feedback.length === 0 ? (
            <p className="text-sm text-muted-foreground">No feedback yet. Click &quot;+ Add Comment&quot; to add.</p>
          ) : (
            <div className="space-y-4">
              {feedback.map((entry, idx) => (
                <div key={idx} className="border rounded-lg p-3 space-y-2">
                  <div className="flex items-center gap-2">
                    <select
                      value={entry.agent_id || ''}
                      onChange={(e) => updateFeedback(idx, 'agent_id', Number(e.target.value))}
                      className="h-9 w-40 rounded-md border border-input bg-transparent px-3 py-1 text-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                    >
                      <option value="">Agent...</option>
                      {agents.map((agent) => (
                        <option key={agent.id} value={agent.id}>
                          {agent.name}
                        </option>
                      ))}
                    </select>
                    <Button size="sm" variant="ghost" onClick={() => removeFeedback(idx)}>
                      ✕
                    </Button>
                  </div>
                  <Textarea
                    value={entry.comment}
                    onChange={(e) => updateFeedback(idx, 'comment', e.target.value)}
                    placeholder="Feedback comment..."
                    rows={2}
                  />
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Version Tickets */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Version Tickets</CardTitle>
              <CardDescription>Product version ticket counts.</CardDescription>
            </div>
            <Button size="sm" variant="outline" onClick={addVersion}>
              + Add Version
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {versions.length === 0 ? (
            <p className="text-sm text-muted-foreground">No versions yet.</p>
          ) : (
            <div className="space-y-2">
              {versions.map((entry, idx) => (
                <div key={idx} className="flex items-center gap-2">
                  <input
                    type="text"
                    value={entry.version}
                    onChange={(e) => updateVersion(idx, 'version', e.target.value)}
                    placeholder="e.g. V2.5"
                    className="flex h-9 w-32 rounded-md border border-input bg-transparent px-3 py-1 text-sm transition-colors placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                  />
                  <input
                    type="number"
                    min={0}
                    value={entry.ticket_count || ''}
                    onChange={(e) => updateVersion(idx, 'ticket_count', Number(e.target.value))}
                    placeholder="0"
                    className="flex h-9 w-24 rounded-md border border-input bg-transparent px-3 py-1 text-sm transition-colors placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                  />
                  <Button size="sm" variant="ghost" onClick={() => removeVersion(idx)}>
                    ✕
                  </Button>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
