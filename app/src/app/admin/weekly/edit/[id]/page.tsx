'use client'

import { use } from 'react'
import WeeklyEntryForm from '@/components/weekly/weekly-entry-form'

export default function EditWeeklyEntryPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params)
  return <WeeklyEntryForm editWeekId={Number(id)} />
}
