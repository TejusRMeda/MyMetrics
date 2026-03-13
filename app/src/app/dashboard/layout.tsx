'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Activity, BarChart3, TrendingUp, Building2, Package, AlertTriangle, MessageSquareText } from 'lucide-react'
import { DateRangeProvider } from '@/components/dashboard/date-range-context'
import { DateRangeSelector } from '@/components/dashboard/date-range-selector'

const navItems = [
  { label: 'Overview', href: '/dashboard', icon: BarChart3 },
  { label: 'Trends', href: '/dashboard/trends', icon: TrendingUp },
  { label: 'Trusts', href: '/dashboard/trusts', icon: Building2 },
  { label: 'Products', href: '/dashboard/products', icon: Package },
  { label: 'Issues', href: '/dashboard/issues', icon: AlertTriangle },
  { label: 'Feedback', href: '/dashboard/feedback', icon: MessageSquareText },
]

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()

  return (
    <DateRangeProvider>
      <div className="min-h-screen bg-background">
        <header className="sticky top-0 z-40 backdrop-blur-md bg-background/80 border-b border-border/50">
          <div className="max-w-7xl mx-auto px-4 sm:px-6">
            <div className="flex items-center justify-between h-14">
              <Link href="/" className="flex items-center gap-2.5">
                <div className="w-7 h-7 rounded-md bg-[#0d9488] flex items-center justify-center">
                  <Activity className="w-3.5 h-3.5 text-white" strokeWidth={2.5} />
                </div>
                <span className="font-semibold text-foreground tracking-tight">Support Insights</span>
              </Link>
              <div className="flex items-center gap-4">
                <DateRangeSelector />
                <Link
                  href="/admin"
                  className="text-sm text-muted-foreground hover:text-foreground transition-colors"
                >
                  Admin
                </Link>
              </div>
            </div>
            <nav aria-label="Dashboard navigation" className="flex gap-0.5 -mb-px overflow-x-auto scrollbar-none">
              {navItems.map((item) => {
                const isActive = item.href === '/dashboard'
                  ? pathname === '/dashboard'
                  : pathname.startsWith(item.href)
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={`flex items-center gap-1.5 px-3 py-2 text-sm font-medium border-b-2 transition-colors whitespace-nowrap ${
                      isActive
                        ? 'border-[#0d9488] text-[#0d9488]'
                        : 'border-transparent text-muted-foreground hover:text-foreground hover:border-border'
                    }`}
                  >
                    <item.icon className="w-3.5 h-3.5" />
                    {item.label}
                  </Link>
                )
              })}
            </nav>
          </div>
        </header>
        <main className="max-w-7xl mx-auto px-4 sm:px-6 py-6">
          {children}
        </main>
      </div>
    </DateRangeProvider>
  )
}
