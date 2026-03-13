import Link from 'next/link'
import {
  BarChart3,
  TrendingUp,
  ClipboardList,
  MessageSquareText,
  Building2,
  Package,
  ArrowRight,
  Activity,
  Shield,
  ChevronRight,
} from 'lucide-react'

const features = [
  {
    icon: BarChart3,
    title: 'Weekly Overview',
    desc: 'KPI cards with RAG status, channel breakdowns, and Zendesk snapshots at a glance.',
  },
  {
    icon: TrendingUp,
    title: 'Trend Analysis',
    desc: 'Track tickets, satisfaction, and call volumes over weeks with interactive charts.',
  },
  {
    icon: Building2,
    title: 'Trust Breakdown',
    desc: 'Compare ticket volumes across trusts and drill into per-trust issue patterns.',
  },
  {
    icon: Package,
    title: 'Product Insights',
    desc: 'See which products generate the most tickets with distribution analysis.',
  },
  {
    icon: ClipboardList,
    title: 'Issue Tracking',
    desc: 'Hierarchical issue categories with parent-child breakdowns and counts.',
  },
  {
    icon: MessageSquareText,
    title: 'Agent Feedback',
    desc: 'Collated agent comments grouped by person for qualitative insights.',
  },
]

const stats = [
  { label: 'Dashboard Views', value: '6' },
  { label: 'Data Points per Week', value: '50+' },
  { label: 'One-click Entry', value: '8 steps' },
]

export default function Home() {
  return (
    <div className="min-h-screen bg-background">
      {/* Minimal top bar */}
      <header className="fixed top-0 inset-x-0 z-50 backdrop-blur-md bg-background/80 border-b border-border/50">
        <div className="max-w-6xl mx-auto px-6 h-14 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-[#0d9488] flex items-center justify-center">
              <Activity className="w-4 h-4 text-white" strokeWidth={2.5} />
            </div>
            <span className="font-semibold text-foreground tracking-tight">Support Insights</span>
          </div>
          <nav className="flex items-center gap-1">
            <Link
              href="/dashboard"
              className="text-sm text-muted-foreground hover:text-foreground px-3 py-1.5 rounded-md transition-colors"
            >
              Dashboard
            </Link>
            <Link
              href="/admin"
              className="text-sm text-muted-foreground hover:text-foreground px-3 py-1.5 rounded-md transition-colors"
            >
              Admin
            </Link>
          </nav>
        </div>
      </header>

      {/* Hero */}
      <section className="relative pt-32 pb-20 px-6 overflow-hidden">
        {/* Decorative background elements */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute top-20 -right-32 w-[500px] h-[500px] rounded-full bg-[#0d9488]/[0.04] blur-3xl" />
          <div className="absolute -bottom-20 -left-32 w-[400px] h-[400px] rounded-full bg-[#0d9488]/[0.03] blur-3xl" />
          {/* Grid pattern */}
          <div
            className="absolute inset-0 opacity-[0.03]"
            style={{
              backgroundImage: `linear-gradient(to right, currentColor 1px, transparent 1px), linear-gradient(to bottom, currentColor 1px, transparent 1px)`,
              backgroundSize: '40px 40px',
            }}
          />
          {/* Pulse line — vitals monitor inspired */}
          <svg
            aria-hidden="true"
            className="absolute top-1/2 left-0 w-full h-24 -translate-y-1/2 opacity-[0.06]"
            viewBox="0 0 1200 100"
            preserveAspectRatio="none"
          >
            <polyline
              fill="none"
              stroke="#0d9488"
              strokeWidth="2"
              points="0,50 200,50 220,50 240,20 260,80 280,35 300,65 320,50 400,50 600,50 620,50 640,15 660,85 680,30 700,70 720,50 900,50 1000,50 1020,50 1040,20 1060,80 1080,35 1100,65 1120,50 1200,50"
            />
          </svg>
        </div>

        <div className="max-w-6xl mx-auto relative">
          <div className="max-w-2xl">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-[#0d9488]/20 bg-[#0d9488]/5 text-[#0d9488] text-xs font-medium mb-6 tracking-wide uppercase">
              <Shield className="w-3 h-3" />
              Internal Reporting Tool
            </div>

            <h1 className="text-4xl sm:text-5xl font-bold text-foreground tracking-tight leading-[1.1] mb-4">
              Support data,{' '}
              <span className="text-[#0d9488]">
                clearly seen.
              </span>
            </h1>

            <p className="text-lg text-muted-foreground leading-relaxed mb-8 max-w-lg">
              Replace weekly PDF reports with a centralised dashboard.
              Enter data once, visualise trends instantly, share insights across leadership and sales.
            </p>

            <div className="flex flex-col sm:flex-row gap-3">
              <Link
                href="/dashboard"
                className="inline-flex items-center justify-center gap-2 rounded-lg bg-[#0d9488] px-6 py-3 text-sm font-semibold text-white hover:bg-[#0f766e] transition-colors shadow-sm shadow-[#0d9488]/20"
              >
                View Dashboard
                <ArrowRight className="w-4 h-4" />
              </Link>
              <Link
                href="/admin"
                className="inline-flex items-center justify-center gap-2 rounded-lg border border-border bg-card px-6 py-3 text-sm font-semibold text-foreground hover:bg-accent transition-colors"
              >
                Supervisor Admin
                <ChevronRight className="w-4 h-4 text-muted-foreground" />
              </Link>
            </div>
          </div>

          {/* Stats strip */}
          <div className="mt-16 flex flex-wrap gap-8 border-t border-border/60 pt-8">
            {stats.map((s) => (
              <div key={s.label}>
                <div className="text-2xl font-bold text-foreground">{s.value}</div>
                <div className="text-xs text-muted-foreground mt-0.5 uppercase tracking-wider">{s.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Features grid */}
      <section className="px-6 pb-20">
        <div className="max-w-6xl mx-auto">
          <div className="mb-10">
            <h2 className="text-2xl font-bold text-foreground tracking-tight">Everything in one place</h2>
            <p className="text-muted-foreground mt-1">Six focused views built for weekly support review.</p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {features.map((f) => (
              <div
                key={f.title}
                className="group relative rounded-xl border border-border/60 bg-card p-5 transition-all hover:border-[#0d9488]/30 hover:shadow-sm"
              >
                <div className="w-9 h-9 rounded-lg bg-[#0d9488]/10 flex items-center justify-center mb-3">
                  <f.icon className="w-4.5 h-4.5 text-[#0d9488]" strokeWidth={2} />
                </div>
                <h3 className="font-semibold text-foreground text-sm mb-1">{f.title}</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Workflow section */}
      <section className="px-6 pb-20">
        <div className="max-w-6xl mx-auto">
          <div className="rounded-2xl border border-border/60 bg-muted/30 p-8 sm:p-10">
            <div className="grid sm:grid-cols-3 gap-8">
              {[
                { step: '01', title: 'Enter weekly data', desc: 'Supervisor fills in an 8-step guided form with tickets, issues, feedback, and screenshots.' },
                { step: '02', title: 'Auto-generate views', desc: 'Dashboard instantly updates with KPIs, charts, breakdowns, and trend lines.' },
                { step: '03', title: 'Share with the team', desc: 'Leadership and sales access the read-only dashboard — no PDFs, no delays.' },
              ].map((item) => (
                <div key={item.step}>
                  <div className="text-xs font-bold text-[#0d9488] tracking-widest mb-2">{item.step}</div>
                  <h3 className="font-semibold text-foreground mb-1">{item.title}</h3>
                  <p className="text-sm text-muted-foreground leading-relaxed">{item.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Footer CTA */}
      <section className="px-6 pb-16">
        <div className="max-w-6xl mx-auto text-center">
          <p className="text-sm text-muted-foreground mb-4">Ready to get started?</p>
          <div className="flex justify-center gap-3">
            <Link
              href="/dashboard"
              className="inline-flex items-center gap-2 rounded-lg bg-foreground px-5 py-2.5 text-sm font-semibold text-background hover:bg-foreground/90 transition-colors"
            >
              Open Dashboard
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
            <Link
              href="/admin/weekly/new"
              className="inline-flex items-center gap-2 rounded-lg border border-border px-5 py-2.5 text-sm font-medium text-foreground hover:bg-accent transition-colors"
            >
              Enter This Week&apos;s Data
            </Link>
          </div>
        </div>
      </section>

      {/* Minimal footer */}
      <footer className="border-t border-border/50 px-6 py-6">
        <div className="max-w-6xl mx-auto flex items-center justify-between text-xs text-muted-foreground">
          <span>Support Insights</span>
          <span>Internal use only</span>
        </div>
      </footer>
    </div>
  )
}
