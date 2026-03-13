'use client'

import { useEffect, useState, useCallback } from 'react'
import { supabase } from '@/lib/supabase'
import { toast } from 'sonner'
import type { IssueCategory } from '@/types/database'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'

export default function IssueCategoriesPage() {
  const [categories, setCategories] = useState<IssueCategory[]>([])
  const [loading, setLoading] = useState(true)
  const [showAddDialog, setShowAddDialog] = useState(false)
  const [newName, setNewName] = useState('')
  const [newParentId, setNewParentId] = useState<string>('none')
  const [editingId, setEditingId] = useState<number | null>(null)
  const [editName, setEditName] = useState('')
  const [saving, setSaving] = useState(false)

  const fetchCategories = useCallback(async () => {
    const { data } = await supabase
      .from('issue_categories')
      .select('*')
      .order('name')
    setCategories(data || [])
    setLoading(false)
  }, [])

  useEffect(() => {
    fetchCategories()
  }, [fetchCategories])

  const parentCategories = categories.filter((c) => c.parent_id === null)
  const getChildren = (parentId: number) =>
    categories.filter((c) => c.parent_id === parentId)

  const handleAdd = async () => {
    if (!newName.trim()) return
    setSaving(true)
    const { error } = await supabase
      .from('issue_categories')
      .insert({
        name: newName.trim(),
        parent_id: newParentId === 'none' ? null : Number(newParentId),
      })
    if (error) {
      toast.error(error.message)
    } else {
      toast.success('Category added')
      setNewName('')
      setNewParentId('none')
      setShowAddDialog(false)
      fetchCategories()
    }
    setSaving(false)
  }

  const handleUpdate = async (id: number) => {
    if (!editName.trim()) return
    setSaving(true)
    const { error } = await supabase
      .from('issue_categories')
      .update({ name: editName.trim() })
      .eq('id', id)
    if (error) {
      toast.error(error.message)
    } else {
      toast.success('Category updated')
      setEditingId(null)
      setEditName('')
      fetchCategories()
    }
    setSaving(false)
  }

  const handleDelete = async (id: number, name: string) => {
    const children = getChildren(id)
    if (children.length > 0) {
      toast.error(`Cannot delete "${name}" — it has ${children.length} sub-categories. Remove them first.`)
      return
    }
    if (!confirm(`Delete "${name}"? This cannot be undone.`)) return
    const { error } = await supabase
      .from('issue_categories')
      .delete()
      .eq('id', id)
    if (error) {
      if (error.message.includes('violates foreign key')) {
        toast.error(`Cannot delete "${name}" — it has weekly data referencing it.`)
      } else {
        toast.error(error.message)
      }
    } else {
      toast.success('Category deleted')
      fetchCategories()
    }
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-semibold">Issue Categories</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Manage issue tags with parent/child hierarchy.
          </p>
        </div>
        <Button onClick={() => setShowAddDialog(true)}>+ Add Category</Button>
      </div>

      {/* Add dialog */}
      <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add Issue Category</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-2">
              <Label>Category Name</Label>
              <Input
                placeholder="e.g. Login Issue"
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label>Parent Category (optional)</Label>
              <Select value={newParentId} onValueChange={(val) => setNewParentId(val ?? 'none')}>
                <SelectTrigger>
                  <SelectValue placeholder="None (top-level)" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">None (top-level)</SelectItem>
                  {parentCategories.map((cat) => (
                    <SelectItem key={cat.id} value={String(cat.id)}>
                      {cat.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => { setShowAddDialog(false); setNewName(''); setNewParentId('none') }}>
              Cancel
            </Button>
            <Button onClick={handleAdd} disabled={saving || !newName.trim()}>
              {saving ? 'Saving...' : 'Save'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Issue tree */}
      <div className="border rounded-lg overflow-hidden">
        {loading ? (
          <div className="p-8 text-center text-muted-foreground">Loading...</div>
        ) : parentCategories.length === 0 ? (
          <div className="p-8 text-center text-muted-foreground">
            No categories yet. Click &quot;+ Add Category&quot; to get started.
          </div>
        ) : (
          <div className="divide-y">
            {parentCategories.map((parent) => {
              const children = getChildren(parent.id)
              return (
                <div key={parent.id}>
                  {/* Parent row */}
                  <div className="flex items-center justify-between px-4 py-3 hover:bg-muted/50">
                    <div className="flex items-center gap-2">
                      <span className="text-muted-foreground text-xs">
                        {children.length > 0 ? '▾' : '•'}
                      </span>
                      {editingId === parent.id ? (
                        <Input
                          value={editName}
                          onChange={(e) => setEditName(e.target.value)}
                          className="h-7 w-60"
                          autoFocus
                        />
                      ) : (
                        <span className="text-sm font-medium">{parent.name}</span>
                      )}
                      {children.length > 0 && (
                        <Badge variant="secondary" className="text-xs">
                          {children.length} sub
                        </Badge>
                      )}
                    </div>
                    <div className="flex items-center gap-1">
                      {editingId === parent.id ? (
                        <>
                          <Button size="sm" variant="ghost" onClick={() => handleUpdate(parent.id)} disabled={saving}>
                            Save
                          </Button>
                          <Button size="sm" variant="ghost" onClick={() => setEditingId(null)}>
                            Cancel
                          </Button>
                        </>
                      ) : (
                        <>
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => { setEditingId(parent.id); setEditName(parent.name) }}
                          >
                            Edit
                          </Button>
                          <Button
                            size="sm"
                            variant="ghost"
                            className="text-destructive hover:text-destructive"
                            onClick={() => handleDelete(parent.id, parent.name)}
                          >
                            Delete
                          </Button>
                        </>
                      )}
                    </div>
                  </div>

                  {/* Child rows */}
                  {children.map((child) => (
                    <div
                      key={child.id}
                      className="flex items-center justify-between px-4 py-2 pl-10 bg-muted/30 hover:bg-muted/50"
                    >
                      <div className="flex items-center gap-2">
                        <span className="text-muted-foreground/50">└</span>
                        {editingId === child.id ? (
                          <Input
                            value={editName}
                            onChange={(e) => setEditName(e.target.value)}
                            className="h-7 w-60"
                            autoFocus
                          />
                        ) : (
                          <span className="text-sm text-muted-foreground">{child.name}</span>
                        )}
                      </div>
                      <div className="flex items-center gap-1">
                        {editingId === child.id ? (
                          <>
                            <Button size="sm" variant="ghost" onClick={() => handleUpdate(child.id)} disabled={saving}>
                              Save
                            </Button>
                            <Button size="sm" variant="ghost" onClick={() => setEditingId(null)}>
                              Cancel
                            </Button>
                          </>
                        ) : (
                          <>
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => { setEditingId(child.id); setEditName(child.name) }}
                            >
                              Edit
                            </Button>
                            <Button
                              size="sm"
                              variant="ghost"
                              className="text-destructive hover:text-destructive"
                              onClick={() => handleDelete(child.id, child.name)}
                            >
                              Delete
                            </Button>
                          </>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}
