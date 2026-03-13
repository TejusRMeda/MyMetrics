'use client'

import { useEffect, useState, useCallback } from 'react'
import { supabase } from '@/lib/supabase'
import { toast } from 'sonner'
import type { Agent } from '@/types/database'
import ConfigTable from '@/components/ui/config-table'

export default function AgentsPage() {
  const [agents, setAgents] = useState<Agent[]>([])
  const [loading, setLoading] = useState(true)

  const fetchAgents = useCallback(async () => {
    const { data } = await supabase.from('agents').select('*').order('name')
    setAgents(data || [])
    setLoading(false)
  }, [])

  useEffect(() => { fetchAgents() }, [fetchAgents])

  const handleAdd = async (values: Record<string, string | boolean>) => {
    const { error } = await supabase.from('agents').insert({ name: values.name as string })
    if (error) toast.error(error.message)
    else fetchAgents()
  }

  const handleUpdate = async (id: number, values: Record<string, string | boolean>) => {
    const { error } = await supabase.from('agents').update({ name: values.name as string }).eq('id', id)
    if (error) toast.error(error.message)
    else fetchAgents()
  }

  const handleToggleActive = async (id: number, isActive: boolean) => {
    const { error } = await supabase.from('agents').update({ is_active: isActive }).eq('id', id)
    if (error) toast.error(error.message)
    else fetchAgents()
  }

  return (
    <ConfigTable
      title="Support Agents"
      description="Manage the list of support agents who receive feedback."
      columns={[{ key: 'name', label: 'Agent Name' }]}
      data={agents}
      onAdd={handleAdd}
      onUpdate={handleUpdate}
      onToggleActive={handleToggleActive}
      addFields={[{ key: 'name', label: 'Agent Name', placeholder: 'e.g. Sarah' }]}
      loading={loading}
    />
  )
}
