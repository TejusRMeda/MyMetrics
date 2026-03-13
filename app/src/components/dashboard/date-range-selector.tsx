'use client'

import { useDateRange, PRESETS } from './date-range-context'

export function DateRangeSelector() {
  const { preset, setPreset, rangeLabel } = useDateRange()

  return (
    <div className="flex items-center gap-3">
      <span className="text-xs text-muted-foreground hidden sm:block">{rangeLabel}</span>
      <select
        aria-label="Select date range"
        value={preset}
        onChange={(e) => setPreset(e.target.value as typeof preset)}
        className="h-9 rounded-md border border-input bg-transparent px-3 text-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
      >
        {PRESETS.map((p) => (
          <option key={p.value} value={p.value}>{p.label}</option>
        ))}
      </select>
    </div>
  )
}
