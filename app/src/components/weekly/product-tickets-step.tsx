'use client'

import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'

interface ProductEntry {
  product_id: number
  product_name: string
  ticket_count: number
}

interface Props {
  data: ProductEntry[]
  onChange: (data: ProductEntry[]) => void
}

export default function ProductTicketsStep({ data, onChange }: Props) {
  const updateCount = (productId: number, count: number) => {
    onChange(data.map((p) => (p.product_id === productId ? { ...p, ticket_count: count } : p)))
  }

  const total = data.reduce((sum, p) => sum + p.ticket_count, 0)

  return (
    <Card>
      <CardHeader>
        <CardTitle>Product Tickets</CardTitle>
        <CardDescription>
          Enter ticket count per product. Total: <strong>{total}</strong>
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {data.map((product) => (
            <div key={product.product_id} className="flex items-center gap-4">
              <Label className="w-48 text-sm shrink-0">{product.product_name}</Label>
              <Input
                type="number"
                min={0}
                value={product.ticket_count || ''}
                onChange={(e) => updateCount(product.product_id, Number(e.target.value))}
                className="w-24"
                placeholder="0"
              />
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  )
}
