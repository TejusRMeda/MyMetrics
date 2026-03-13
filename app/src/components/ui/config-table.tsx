'use client'

import { useState } from 'react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog'

interface Column<T> {
  key: keyof T
  label: string
  render?: (value: T[keyof T], row: T) => React.ReactNode
}

interface ConfigTableProps<T extends { id: number }> {
  title: string
  description: string
  columns: Column<T>[]
  data: T[]
  onAdd: (values: Record<string, string | boolean>) => Promise<void>
  onUpdate: (id: number, values: Record<string, string | boolean>) => Promise<void>
  onToggleActive?: (id: number, isActive: boolean) => Promise<void>
  addFields: { key: string; label: string; type?: string; placeholder?: string }[]
  loading: boolean
  hasActiveToggle?: boolean
}

export default function ConfigTable<T extends { id: number; is_active?: boolean }>({
  title,
  description,
  columns,
  data,
  onAdd,
  onUpdate,
  onToggleActive,
  addFields,
  loading,
  hasActiveToggle = true,
}: ConfigTableProps<T>) {
  const [showAddDialog, setShowAddDialog] = useState(false)
  const [formValues, setFormValues] = useState<Record<string, string>>({})
  const [editingId, setEditingId] = useState<number | null>(null)
  const [editValues, setEditValues] = useState<Record<string, string>>({})
  const [saving, setSaving] = useState(false)

  const handleAdd = async () => {
    setSaving(true)
    try {
      await onAdd(formValues)
      setFormValues({})
      setShowAddDialog(false)
      toast.success('Item added successfully')
    } catch {
      toast.error('Failed to add item')
    } finally {
      setSaving(false)
    }
  }

  const handleUpdate = async (id: number) => {
    setSaving(true)
    try {
      await onUpdate(id, editValues)
      setEditingId(null)
      setEditValues({})
      toast.success('Item updated successfully')
    } catch {
      toast.error('Failed to update item')
    } finally {
      setSaving(false)
    }
  }

  const startEdit = (row: T) => {
    setEditingId(row.id)
    const values: Record<string, string> = {}
    addFields.forEach((f) => {
      values[f.key] = String((row as Record<string, unknown>)[f.key] ?? '')
    })
    setEditValues(values)
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-semibold">{title}</h1>
          <p className="text-sm text-muted-foreground mt-1">{description}</p>
        </div>
        <Button onClick={() => setShowAddDialog(true)}>+ Add New</Button>
      </div>

      {/* Add dialog */}
      <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add New {title.replace(/s$/, '')}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            {addFields.map((field) => (
              <div key={field.key} className="space-y-2">
                <Label htmlFor={field.key}>{field.label}</Label>
                <Input
                  id={field.key}
                  type={field.type || 'text'}
                  placeholder={field.placeholder}
                  value={formValues[field.key] || ''}
                  onChange={(e) =>
                    setFormValues({ ...formValues, [field.key]: e.target.value })
                  }
                />
              </div>
            ))}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => { setShowAddDialog(false); setFormValues({}) }}>
              Cancel
            </Button>
            <Button onClick={handleAdd} disabled={saving}>
              {saving ? 'Saving...' : 'Save'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Table */}
      <div className="border rounded-lg">
        {loading ? (
          <div className="p-8 text-center text-muted-foreground">Loading...</div>
        ) : data.length === 0 ? (
          <div className="p-8 text-center text-muted-foreground">
            No items yet. Click &quot;+ Add New&quot; to get started.
          </div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                {columns.map((col) => (
                  <TableHead key={String(col.key)}>{col.label}</TableHead>
                ))}
                {hasActiveToggle && <TableHead>Status</TableHead>}
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {data.map((row) => (
                <TableRow key={row.id}>
                  {columns.map((col) => (
                    <TableCell key={String(col.key)}>
                      {editingId === row.id && addFields.find((f) => f.key === String(col.key)) ? (
                        <Input
                          value={editValues[String(col.key)] || ''}
                          onChange={(e) =>
                            setEditValues({
                              ...editValues,
                              [String(col.key)]: e.target.value,
                            })
                          }
                          className="h-8"
                        />
                      ) : col.render ? (
                        col.render(row[col.key], row)
                      ) : (
                        String(row[col.key] ?? '')
                      )}
                    </TableCell>
                  ))}
                  {hasActiveToggle && (
                    <TableCell>
                      <Badge
                        variant={row.is_active ? 'default' : 'secondary'}
                        className="cursor-pointer"
                        onClick={() => onToggleActive?.(row.id, !row.is_active)}
                      >
                        {row.is_active ? 'Active' : 'Inactive'}
                      </Badge>
                    </TableCell>
                  )}
                  <TableCell className="text-right">
                    {editingId === row.id ? (
                      <div className="flex justify-end gap-2">
                        <Button size="sm" variant="ghost" onClick={() => handleUpdate(row.id)} disabled={saving}>
                          Save
                        </Button>
                        <Button size="sm" variant="ghost" onClick={() => setEditingId(null)}>
                          Cancel
                        </Button>
                      </div>
                    ) : (
                      <Button size="sm" variant="ghost" onClick={() => startEdit(row)}>
                        Edit
                      </Button>
                    )}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </div>
    </div>
  )
}
