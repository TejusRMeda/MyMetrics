'use client'

import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'

interface IssueOption {
  id: number
  name: string
  parent_id: number | null
}

interface IssueEntry {
  issue_id: number
  count: number
}

interface Props {
  issues: IssueOption[]
  data: IssueEntry[]
  onChange: (data: IssueEntry[]) => void
}

export default function TopIssuesStep({ issues, data, onChange }: Props) {
  const updateCount = (issueId: number, count: number) => {
    const existing = data.find((d) => d.issue_id === issueId)
    if (existing) {
      onChange(data.map((d) => (d.issue_id === issueId ? { ...d, count } : d)))
    } else {
      onChange([...data, { issue_id: issueId, count }])
    }
  }

  const getCount = (issueId: number) => data.find((d) => d.issue_id === issueId)?.count ?? 0

  const parents = issues.filter((i) => i.parent_id === null)
  const getChildren = (parentId: number) => issues.filter((i) => i.parent_id === parentId)

  return (
    <Card>
      <CardHeader>
        <CardTitle>Top Issues (Global)</CardTitle>
        <CardDescription>Enter the global issue breakdown for this week.</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-1">
          {parents.map((parent) => {
            const children = getChildren(parent.id)
            return (
              <div key={parent.id}>
                <div className="flex items-center gap-4 py-2">
                  <Label className="flex-1 text-sm font-medium">{parent.name}</Label>
                  <Input
                    type="number"
                    min={0}
                    value={getCount(parent.id) || ''}
                    onChange={(e) => updateCount(parent.id, Number(e.target.value))}
                    className="w-24"
                    placeholder="0"
                  />
                </div>
                {children.map((child) => (
                  <div key={child.id} className="flex items-center gap-4 py-1.5 pl-6">
                    <Label className="flex-1 text-sm text-muted-foreground">
                      └ {child.name}
                    </Label>
                    <Input
                      type="number"
                      min={0}
                      value={getCount(child.id) || ''}
                      onChange={(e) => updateCount(child.id, Number(e.target.value))}
                      className="w-24"
                      placeholder="0"
                    />
                  </div>
                ))}
              </div>
            )
          })}
        </div>
      </CardContent>
    </Card>
  )
}
