'use client'

import { useEffect, useState, useCallback } from 'react'
import { supabase } from '@/lib/supabase'
import { toast } from 'sonner'
import type { Channel } from '@/types/database'
import ConfigTable from '@/components/ui/config-table'

export default function ChannelsPage() {
  const [channels, setChannels] = useState<Channel[]>([])
  const [loading, setLoading] = useState(true)

  const fetchChannels = useCallback(async () => {
    const { data } = await supabase.from('channels').select('*').order('name')
    setChannels(data || [])
    setLoading(false)
  }, [])

  useEffect(() => { fetchChannels() }, [fetchChannels])

  const handleAdd = async (values: Record<string, string | boolean>) => {
    const { error } = await supabase.from('channels').insert({ name: values.name as string })
    if (error) toast.error(error.message)
    else fetchChannels()
  }

  const handleUpdate = async (id: number, values: Record<string, string | boolean>) => {
    const { error } = await supabase.from('channels').update({ name: values.name as string }).eq('id', id)
    if (error) toast.error(error.message)
    else fetchChannels()
  }

  return (
    <ConfigTable
      title="Channels"
      description="Manage the support channels (Voice, Email, etc.)."
      columns={[{ key: 'name', label: 'Channel Name' }]}
      data={channels}
      onAdd={handleAdd}
      onUpdate={handleUpdate}
      addFields={[{ key: 'name', label: 'Channel Name', placeholder: 'e.g. Live Chat' }]}
      loading={loading}
      hasActiveToggle={false}
    />
  )
}
