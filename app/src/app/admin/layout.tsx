'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useEffect, useState } from 'react'
import { Button } from '@/components/ui/button'
import { Separator } from '@/components/ui/separator'
import {
  Activity,
  ClipboardList,
  Building2,
  Tag,
  Package,
  Phone,
  Users,
  BarChart3,
  Menu,
  X,
} from 'lucide-react'

const navItems = [
  { label: 'Weekly Entry', href: '/admin/weekly', icon: ClipboardList },
  { label: 'Trusts', href: '/admin/config/trusts', icon: Building2 },
  { label: 'Issues', href: '/admin/config/issues', icon: Tag },
  { label: 'Products', href: '/admin/config/products', icon: Package },
  { label: 'Channels', href: '/admin/config/channels', icon: Phone },
  { label: 'Agents', href: '/admin/config/agents', icon: Users },
]

function NavLinks({ pathname, onNavigate }: { pathname: string; onNavigate?: () => void }) {
  return (
    <nav className="p-3 space-y-0.5" aria-label="Admin navigation">
      {navItems.map((item) => {
        const isActive = pathname.startsWith(item.href)
        return (
          <Link
            key={item.href}
            href={item.href}
            onClick={onNavigate}
            aria-current={isActive ? 'page' : undefined}
            className={`flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
              isActive
                ? 'bg-[#0d9488]/10 text-[#0d9488]'
                : 'text-muted-foreground hover:bg-accent hover:text-accent-foreground'
            }`}
          >
            <item.icon className="w-4 h-4" aria-hidden="true" />
            {item.label}
          </Link>
        )
      })}
    </nav>
  )
}

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  const [sidebarOpen, setSidebarOpen] = useState(false)

  // Close sidebar on Escape key
  useEffect(() => {
    if (!sidebarOpen) return
    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === 'Escape') setSidebarOpen(false)
    }
    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [sidebarOpen])

  return (
    <div className="min-h-screen flex bg-background">
      {/* Mobile overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black/30 z-20 md:hidden"
          onClick={() => setSidebarOpen(false)}
          role="presentation"
        />
      )}

      {/* Sidebar */}
      <aside
        className={`fixed md:static z-30 inset-y-0 left-0 w-64 border-r border-border/60 bg-card transform transition-transform md:translate-x-0 ${
          sidebarOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
        role="navigation"
        aria-label="Main navigation"
      >
        <div className="p-4 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2.5">
            <div className="w-7 h-7 rounded-md bg-[#0d9488] flex items-center justify-center">
              <Activity className="w-3.5 h-3.5 text-white" strokeWidth={2.5} aria-hidden="true" />
            </div>
            <div>
              <span className="font-semibold text-foreground tracking-tight text-sm">Support Insights</span>
              <p className="text-[10px] text-muted-foreground uppercase tracking-widest">Admin</p>
            </div>
          </Link>
          <button
            className="md:hidden p-1 text-muted-foreground hover:text-foreground"
            aria-label="Close menu"
            onClick={() => setSidebarOpen(false)}
          >
            <X className="w-4 h-4" aria-hidden="true" />
          </button>
        </div>
        <Separator />
        <NavLinks pathname={pathname} onNavigate={() => setSidebarOpen(false)} />
        <div className="absolute bottom-0 w-full p-3">
          <Separator className="mb-3" />
          <Link
            href="/dashboard"
            className="flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium text-muted-foreground hover:bg-accent hover:text-accent-foreground"
          >
            <BarChart3 className="w-4 h-4" aria-hidden="true" />
            View Dashboard
          </Link>
        </div>
      </aside>

      {/* Main content */}
      <div className="flex-1 min-w-0">
        <header className="md:hidden border-b border-border/60 px-4 py-3 flex items-center gap-3 sticky top-0 z-10 bg-background/80 backdrop-blur-md">
          <Button variant="ghost" size="icon" aria-label="Open menu" onClick={() => setSidebarOpen(true)}>
            <Menu className="w-5 h-5" />
          </Button>
          <span className="font-semibold text-sm">Support Insights</span>
        </header>

        <main className="p-6 max-w-5xl">
          {children}
        </main>
      </div>
    </div>
  )
}
