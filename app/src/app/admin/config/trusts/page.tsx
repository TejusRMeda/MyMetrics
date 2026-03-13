'use client'

import { useEffect, useState, useCallback } from 'react'
import { supabase } from '@/lib/supabase'
import { toast } from 'sonner'
import type { Trust } from '@/types/database'
import ConfigTable from '@/components/ui/config-table'

export default function TrustsPage() {
  const [trusts, setTrusts] = useState<Trust[]>([])
  const [loading, setLoading] = useState(true)

  const fetchTrusts = useCallback(async () => {
    const { data } = await supabase.from('trusts').select('*').order('name')
    setTrusts(data || [])
    setLoading(false)
  }, [])

  useEffect(() => { fetchTrusts() }, [fetchTrusts])

  const handleAdd = async (values: Record<string, string | boolean>) => {
    const { error } = await supabase.from('trusts').insert({ name: values.name as string })
    if (error) toast.error(error.message)
    else fetchTrusts()
  }

  const handleUpdate = async (id: number, values: Record<string, string | boolean>) => {
    const { error } = await supabase.from('trusts').update({ name: values.name as string }).eq('id', id)
    if (error) toast.error(error.message)
    else fetchTrusts()
  }

  const handleToggleActive = async (id: number, isActive: boolean) => {
    const { error } = await supabase.from('trusts').update({ is_active: isActive }).eq('id', id)
    if (error) toast.error(error.message)
    else fetchTrusts()
  }

  return (
    <ConfigTable
      title="Trusts / Hospitals"
      description="Manage the list of hospitals and trusts that tickets are tagged to."
      columns={[{ key: 'name', label: 'Trust Name' }]}
      data={trusts}
      onAdd={handleAdd}
      onUpdate={handleUpdate}
      onToggleActive={handleToggleActive}
      addFields={[{ key: 'name', label: 'Trust Name', placeholder: 'e.g. Royal Infirmary' }]}
      loading={loading}
    />
  )
}
