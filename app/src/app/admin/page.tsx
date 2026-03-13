import Link from 'next/link'
import { Card, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { ClipboardList, Building2, Tag, Package, Phone, Users } from 'lucide-react'

const configItems = [
  { label: 'Weekly Entry', href: '/admin/weekly', icon: ClipboardList, desc: 'Enter weekly support data' },
  { label: 'Trusts', href: '/admin/config/trusts', icon: Building2, desc: 'Manage hospitals and trusts' },
  { label: 'Issue Categories', href: '/admin/config/issues', icon: Tag, desc: 'Manage issue tags and sub-tags' },
  { label: 'Products', href: '/admin/config/products', icon: Package, desc: 'Manage product list' },
  { label: 'Channels', href: '/admin/config/channels', icon: Phone, desc: 'Manage support channels' },
  { label: 'Agents', href: '/admin/config/agents', icon: Users, desc: 'Manage support agents' },
]

export default function AdminHome() {
  return (
    <div>
      <h1 className="text-2xl font-bold text-foreground tracking-tight mb-1">Admin Panel</h1>
      <p className="text-sm text-muted-foreground mb-8">Manage configuration and enter weekly support data.</p>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {configItems.map((item) => (
          <Link key={item.href} href={item.href}>
            <Card className="hover:border-[#0d9488]/30 hover:shadow-sm transition-all cursor-pointer h-full">
              <CardHeader>
                <div className="w-9 h-9 rounded-lg bg-[#0d9488]/10 flex items-center justify-center mb-2">
                  <item.icon className="w-4.5 h-4.5 text-[#0d9488]" strokeWidth={2} />
                </div>
                <CardTitle className="text-base">{item.label}</CardTitle>
                <CardDescription>{item.desc}</CardDescription>
              </CardHeader>
            </Card>
          </Link>
        ))}
      </div>
    </div>
  )
}
