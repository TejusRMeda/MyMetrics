'use client'

import { useEffect, useState, useCallback } from 'react'
import { supabase } from '@/lib/supabase'
import { toast } from 'sonner'
import type { Product } from '@/types/database'
import ConfigTable from '@/components/ui/config-table'

export default function ProductsPage() {
  const [products, setProducts] = useState<Product[]>([])
  const [loading, setLoading] = useState(true)

  const fetchProducts = useCallback(async () => {
    const { data } = await supabase.from('products').select('*').order('name')
    setProducts(data || [])
    setLoading(false)
  }, [])

  useEffect(() => { fetchProducts() }, [fetchProducts])

  const handleAdd = async (values: Record<string, string | boolean>) => {
    const { error } = await supabase.from('products').insert({ name: values.name as string })
    if (error) toast.error(error.message)
    else fetchProducts()
  }

  const handleUpdate = async (id: number, values: Record<string, string | boolean>) => {
    const { error } = await supabase.from('products').update({ name: values.name as string }).eq('id', id)
    if (error) toast.error(error.message)
    else fetchProducts()
  }

  const handleToggleActive = async (id: number, isActive: boolean) => {
    const { error } = await supabase.from('products').update({ is_active: isActive }).eq('id', id)
    if (error) toast.error(error.message)
    else fetchProducts()
  }

  return (
    <ConfigTable
      title="Products"
      description="Manage the list of products that tickets are categorised by."
      columns={[{ key: 'name', label: 'Product Name' }]}
      data={products}
      onAdd={handleAdd}
      onUpdate={handleUpdate}
      onToggleActive={handleToggleActive}
      addFields={[{ key: 'name', label: 'Product Name', placeholder: 'e.g. MyPreOp+' }]}
      loading={loading}
    />
  )
}
