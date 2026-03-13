'use client'

import { createContext, useContext, useState, useEffect, useCallback, type ReactNode } from 'react'
import { getWeeksList } from '@/lib/dashboard-data'

interface WeekOption {
  id: number
  week_start: string
  week_end: string
}

type Preset = 'this_week' | 'last_4' | 'last_8' | 'last_12' | 'all_time'

interface DateRangeState {
  weekIds: number[]
  weeks: WeekOption[]
  allWeeks: WeekOption[]
  preset: Preset
  rangeLabel: string
  isMultiWeek: boolean
  setPreset: (p: Preset) => void
  loading: boolean
}

const PRESET_LABELS: Record<Preset, string> = {
  this_week: 'This week',
  last_4: 'Last 4 weeks',
  last_8: 'Last 8 weeks',
  last_12: 'Last 12 weeks',
  all_time: 'All time',
}

const DateRangeContext = createContext<DateRangeState | null>(null)

function formatDate(d: string) {
  return new Date(d + 'T00:00:00').toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })
}

function getWeeksForPreset(allWeeks: WeekOption[], preset: Preset): WeekOption[] {
  if (allWeeks.length === 0) return []
  switch (preset) {
    case 'this_week': return allWeeks.slice(0, 1)
    case 'last_4': return allWeeks.slice(0, 4)
    case 'last_8': return allWeeks.slice(0, 8)
    case 'last_12': return allWeeks.slice(0, 12)
    case 'all_time': return allWeeks
  }
}

function buildRangeLabel(weeks: WeekOption[]): string {
  if (weeks.length === 0) return ''
  if (weeks.length === 1) {
    return `${formatDate(weeks[0].week_start)} — ${formatDate(weeks[0].week_end)}`
  }
  // weeks are sorted desc (newest first), so last element is earliest
  const earliest = weeks[weeks.length - 1]
  const latest = weeks[0]
  return `${formatDate(earliest.week_start)} — ${formatDate(latest.week_end)}`
}

export function DateRangeProvider({ children }: { children: ReactNode }) {
  const [allWeeks, setAllWeeks] = useState<WeekOption[]>([])
  const [preset, setPresetState] = useState<Preset>('this_week')
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    getWeeksList().then((w) => {
      setAllWeeks(w)
      setLoading(false)
    })
  }, [])

  const setPreset = useCallback((p: Preset) => {
    setPresetState(p)
  }, [])

  const selectedWeeks = getWeeksForPreset(allWeeks, preset)
  const weekIds = selectedWeeks.map((w) => w.id)

  const value: DateRangeState = {
    weekIds,
    weeks: selectedWeeks,
    allWeeks,
    preset,
    rangeLabel: buildRangeLabel(selectedWeeks),
    isMultiWeek: selectedWeeks.length > 1,
    setPreset,
    loading,
  }

  return (
    <DateRangeContext.Provider value={value}>
      {children}
    </DateRangeContext.Provider>
  )
}

export function useDateRange() {
  const ctx = useContext(DateRangeContext)
  if (!ctx) throw new Error('useDateRange must be used within DateRangeProvider')
  return ctx
}

export const PRESETS: { value: Preset; label: string }[] = [
  { value: 'this_week', label: PRESET_LABELS.this_week },
  { value: 'last_4', label: PRESET_LABELS.last_4 },
  { value: 'last_8', label: PRESET_LABELS.last_8 },
  { value: 'last_12', label: PRESET_LABELS.last_12 },
  { value: 'all_time', label: PRESET_LABELS.all_time },
]
