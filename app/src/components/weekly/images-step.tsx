'use client'

import { useRef } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'

interface ImageEntry {
  image_type: 'tickets_by_hour' | 'tickets_by_day'
  file: File | null
  existingUrl?: string
}

interface Props {
  data: ImageEntry[]
  onChange: (data: ImageEntry[]) => void
}

function ImageUpload({
  label,
  entry,
  onFileChange,
}: {
  label: string
  entry: ImageEntry
  onFileChange: (file: File | null) => void
}) {
  const inputRef = useRef<HTMLInputElement>(null)
  const previewUrl = entry.file ? URL.createObjectURL(entry.file) : entry.existingUrl

  return (
    <div className="border rounded-lg p-4">
      <h3 className="font-medium text-sm mb-3">{label}</h3>
      {previewUrl ? (
        <div className="space-y-2">
          <img
            src={previewUrl}
            alt={label}
            className="max-h-48 rounded border object-contain"
          />
          <div className="flex gap-2">
            <Button size="sm" variant="outline" onClick={() => inputRef.current?.click()}>
              Replace
            </Button>
            <Button size="sm" variant="ghost" onClick={() => onFileChange(null)}>
              Remove
            </Button>
          </div>
        </div>
      ) : (
        <div
          className="border-2 border-dashed rounded-lg p-8 text-center cursor-pointer hover:border-primary/50 transition-colors"
          onClick={() => inputRef.current?.click()}
        >
          <p className="text-sm text-muted-foreground">Click to upload screenshot</p>
          <p className="text-xs text-muted-foreground mt-1">PNG or JPG, max 5MB</p>
        </div>
      )}
      <input
        ref={inputRef}
        type="file"
        accept="image/png,image/jpeg"
        className="hidden"
        onChange={(e) => {
          const file = e.target.files?.[0]
          if (file && file.size > 5 * 1024 * 1024) {
            alert('File too large. Max 5MB.')
            return
          }
          onFileChange(file || null)
        }}
      />
    </div>
  )
}

export default function ImagesStep({ data, onChange }: Props) {
  const updateFile = (imageType: string, file: File | null) => {
    onChange(
      data.map((d) =>
        d.image_type === imageType ? { ...d, file } : d
      )
    )
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Zendesk Screenshots</CardTitle>
        <CardDescription>
          Upload screenshots from Zendesk for tickets by hour and tickets by day of week. Optional.
        </CardDescription>
      </CardHeader>
      <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {data.map((entry) => (
          <ImageUpload
            key={entry.image_type}
            label={entry.image_type === 'tickets_by_hour' ? 'Tickets by Hour' : 'Tickets by Day of Week'}
            entry={entry}
            onFileChange={(file) => updateFile(entry.image_type, file)}
          />
        ))}
      </CardContent>
    </Card>
  )
}
