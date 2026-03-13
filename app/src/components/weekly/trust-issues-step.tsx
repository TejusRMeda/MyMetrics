'use client'

import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'

interface TrustEntry {
  trust_id: number
  trust_name: string
  ticket_count: number
}

interface IssueOption {
  id: number
  name: string
  parent_id: number | null
}

interface TrustIssueEntry {
  trust_id: number
  issue_id: number
  count: number
}

interface Props {
  trusts: TrustEntry[]
  issues: IssueOption[]
  data: Record<number, TrustIssueEntry[]>
  onChange: (data: Record<number, TrustIssueEntry[]>) => void
}

export default function TrustIssuesStep({ trusts, issues, data, onChange }: Props) {
  const activeTrusts = trusts.filter((t) => t.ticket_count > 0 && t.trust_name !== 'No Trust')

  const parents = issues.filter((i) => i.parent_id === null)
  const getChildren = (parentId: number) => issues.filter((i) => i.parent_id === parentId)

  const addIssue = (trustId: number) => {
    const current = data[trustId] || []
    onChange({
      ...data,
      [trustId]: [...current, { trust_id: trustId, issue_id: 0, count: 0 }],
    })
  }

  const updateIssue = (trustId: number, index: number, field: 'issue_id' | 'count', value: number) => {
    const current = [...(data[trustId] || [])]
    current[index] = { ...current[index], [field]: value }
    onChange({ ...data, [trustId]: current })
  }

  const removeIssue = (trustId: number, index: number) => {
    const current = [...(data[trustId] || [])]
    current.splice(index, 1)
    onChange({ ...data, [trustId]: current })
  }

  if (activeTrusts.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Trust Issue Breakdown</CardTitle>
          <CardDescription>No trusts have tickets &gt; 0. Go back and enter trust ticket counts first.</CardDescription>
        </CardHeader>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Trust Issue Breakdown</CardTitle>
        <CardDescription>For each trust with tickets, add the issue breakdown.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {activeTrusts.map((trust) => {
          const entries = data[trust.trust_id] || []
          return (
            <div key={trust.trust_id} className="border rounded-lg p-4">
              <div className="flex items-center justify-between mb-3">
                <h3 className="font-medium text-sm">
                  {trust.trust_name} <span className="text-muted-foreground">({trust.ticket_count} tickets)</span>
                </h3>
                <Button size="sm" variant="outline" onClick={() => addIssue(trust.trust_id)}>
                  + Add Issue
                </Button>
              </div>
              {entries.length === 0 ? (
                <p className="text-sm text-muted-foreground">No issues added yet.</p>
              ) : (
                <div className="space-y-2">
                  {entries.map((entry, idx) => (
                    <div key={idx} className="flex items-center gap-2">
                      <select
                        value={entry.issue_id || ''}
                        onChange={(e) => updateIssue(trust.trust_id, idx, 'issue_id', Number(e.target.value))}
                        className="flex-1 h-9 rounded-md border border-input bg-transparent px-3 py-1 text-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                      >
                        <option value="">Select issue...</option>
                        {parents.map((parent) => {
                          const children = getChildren(parent.id)
                          return [
                            <option key={parent.id} value={parent.id}>
                              {parent.name}
                            </option>,
                            ...children.map((child) => (
                              <option key={child.id} value={child.id}>
                                &nbsp;&nbsp;└ {child.name}
                              </option>
                            )),
                          ]
                        })}
                      </select>
                      <Input
                        type="number"
                        min={0}
                        value={entry.count || ''}
                        onChange={(e) => updateIssue(trust.trust_id, idx, 'count', Number(e.target.value))}
                        className="w-20"
                        placeholder="0"
                      />
                      <Button size="sm" variant="ghost" onClick={() => removeIssue(trust.trust_id, idx)}>
                        ✕
                      </Button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )
        })}
      </CardContent>
    </Card>
  )
}
