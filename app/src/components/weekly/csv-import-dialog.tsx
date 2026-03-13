'use client'

import { useState, useRef, useEffect } from 'react'
import { toast } from 'sonner'
import { Upload, AlertTriangle, CheckCircle2, FileText, Plus, XCircle } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog'
import {
  parseCSV,
  fetchNameMaps,
  validateAndMap,
  checkExistingWeeks,
  collectNewEntities,
  newEntitiesCount,
  importWeeks,
  type ParsedWeek,
  type ValidatedWeek,
  type NewEntities,
} from '@/lib/csv-import'
import { parsePDFs, type PdfDateOverride } from '@/lib/pdf-import'

type Stage = 'upload' | 'preview' | 'importing' | 'done'
type DuplicateMode = 'overwrite' | 'skip'

interface CsvImportDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onComplete: () => void
}

function getFileType(files: FileList): 'csv' | 'pdf' | 'mixed' | null {
  if (files.length === 0) return null
  let hasCsv = false
  let hasPdf = false
  for (let i = 0; i < files.length; i++) {
    const name = files[i].name.toLowerCase()
    if (name.endsWith('.csv')) hasCsv = true
    else if (name.endsWith('.pdf')) hasPdf = true
  }
  if (hasCsv && hasPdf) return 'mixed'
  if (hasCsv) return 'csv'
  if (hasPdf) return 'pdf'
  return null
}

const currentYear = new Date().getFullYear()
const yearOptions = Array.from({ length: 5 }, (_, i) => currentYear - i)

export function CsvImportDialog({ open, onOpenChange, onComplete }: CsvImportDialogProps) {
  const [stage, setStage] = useState<Stage>('upload')
  const [validatedWeeks, setValidatedWeeks] = useState<ValidatedWeek[]>([])
  const [newEntities, setNewEntities] = useState<NewEntities>({ trusts: new Set(), issues: new Set(), products: new Set(), channels: new Set(), agents: new Set() })
  const [duplicateMode, setDuplicateMode] = useState<DuplicateMode>('overwrite')
  const [parseErrors, setParseErrors] = useState<string[]>([])
  const [progress, setProgress] = useState('')
  const [importResult, setImportResult] = useState<{ imported: number; skipped: number; entitiesCreated: number; errors: string[] } | null>(null)
  const [loading, setLoading] = useState(false)
  const [pdfYear, setPdfYear] = useState(currentYear)
  const [showPdfOptions, setShowPdfOptions] = useState(false)
  const [manualStart, setManualStart] = useState('')
  const [manualEnd, setManualEnd] = useState('')
  const fileRef = useRef<HTMLInputElement>(null)
  const doneButtonRef = useRef<HTMLButtonElement>(null)
  const previewRef = useRef<HTMLDivElement>(null)

  function reset() {
    setStage('upload')
    setValidatedWeeks([])
    setNewEntities({ trusts: new Set(), issues: new Set(), products: new Set(), channels: new Set(), agents: new Set() })
    setDuplicateMode('overwrite')
    setParseErrors([])
    setProgress('')
    setImportResult(null)
    setLoading(false)
    setShowPdfOptions(false)
    setManualStart('')
    setManualEnd('')
    if (fileRef.current) fileRef.current.value = ''
  }

  function handleOpenChange(open: boolean) {
    if (!open && stage === 'importing') return // block close during import
    if (!open) reset()
    onOpenChange(open)
  }

  function handleFileChange() {
    const files = fileRef.current?.files
    if (!files || files.length === 0) {
      setShowPdfOptions(false)
      return
    }
    const type = getFileType(files)
    setShowPdfOptions(type === 'pdf')
  }

  // Focus management between stages
  useEffect(() => {
    if (stage === 'preview') {
      previewRef.current?.focus()
    } else if (stage === 'done') {
      doneButtonRef.current?.focus()
    }
  }, [stage])

  async function handleUpload() {
    const files = fileRef.current?.files
    if (!files || files.length === 0) {
      toast.error('Please select a file')
      return
    }

    const fileType = getFileType(files)

    if (fileType === 'mixed') {
      toast.error('Cannot mix CSV and PDF files. Please upload one type at a time.')
      return
    }

    if (!fileType) {
      toast.error('Please select CSV or PDF files')
      return
    }

    setLoading(true)
    setParseErrors([])

    try {
      let weeks: ParsedWeek[] = []
      let errors: string[] = []

      if (fileType === 'csv') {
        const file = files[0]
        const text = await file.text()
        const result = parseCSV(text)
        weeks = result.weeks
        errors = result.errors
      } else {
        // PDF path
        setProgress(`Parsing PDF 1 of ${files.length}...`)
        const pdfFiles = Array.from(files)
        const dateOverride: PdfDateOverride | undefined =
          manualStart && manualEnd ? { week_start: manualStart, week_end: manualEnd } : undefined
        const result = await parsePDFs(pdfFiles, pdfYear, (current, total) => {
          setProgress(`Parsing PDF ${current} of ${total}...`)
        }, dateOverride)
        weeks = result.weeks
        errors = result.errors
      }

      if (weeks.length === 0) {
        setParseErrors(errors.length > 0 ? errors : ['No valid data found'])
        setLoading(false)
        setProgress('')
        return
      }

      const [maps, existingMap] = await Promise.all([
        fetchNameMaps(),
        checkExistingWeeks(weeks.map((w) => w.week_start)),
      ])

      const validated = validateAndMap(weeks, maps)
      for (const w of validated) {
        const existingId = existingMap.get(w.week_start)
        if (existingId) w.existingId = existingId
      }

      const ne = collectNewEntities(weeks, maps)
      setNewEntities(ne)
      setValidatedWeeks(validated)
      setParseErrors(errors)
      setStage('preview')
    } catch (err) {
      toast.error('Failed to parse file: ' + (err instanceof Error ? err.message : 'Unknown error'))
    } finally {
      setLoading(false)
      setProgress('')
    }
  }

  async function handleImport() {
    setStage('importing')
    const neCount = newEntitiesCount(newEntities)
    if (neCount > 0) {
      setProgress(`Creating ${neCount} new entities...`)
    } else {
      setProgress(`Importing week 1 of ${validatedWeeks.length}...`)
    }

    const result = await importWeeks(
      validatedWeeks,
      duplicateMode,
      newEntities,
      (current, total) => {
        if (current === 0) {
          setProgress(`Creating new entities...`)
        } else {
          setProgress(`Importing week ${current} of ${total}...`)
        }
      },
    )

    setImportResult(result)
    setStage('done')
    if (result.imported > 0) onComplete()
  }

  const totalWarnings = validatedWeeks.reduce((n, w) => n + w.warnings.length, 0)
  const totalNewEntities = newEntitiesCount(newEntities)
  const hasErrors = importResult && importResult.imported === 0 && importResult.errors.length > 0

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Import Data</DialogTitle>
          <DialogDescription>
            Upload weekly report data from CSV or PDF files.
          </DialogDescription>
        </DialogHeader>

        {/* Upload Stage */}
        {stage === 'upload' && (
          <div className="space-y-4">
            <div className="border-2 border-dashed rounded-lg p-6 text-center">
              <Upload className="mx-auto h-8 w-8 text-muted-foreground mb-2" aria-hidden="true" />
              <label htmlFor="import-file-input" className="sr-only">Select CSV or PDF files to import</label>
              <input
                id="import-file-input"
                ref={fileRef}
                type="file"
                accept=".csv,.pdf"
                multiple
                onChange={handleFileChange}
                aria-describedby="import-upload-hint"
                className="block w-full text-sm file:mr-4 file:py-1.5 file:px-3 file:rounded-md file:border-0 file:text-sm file:font-medium file:bg-primary file:text-primary-foreground hover:file:bg-primary/90 cursor-pointer"
              />
              <p id="import-upload-hint" className="text-xs text-muted-foreground mt-2">
                CSV: rows with section type, week_start, week_end, data columns.
                <br />
                PDF: weekly support report PDFs (select multiple for batch import).
              </p>
            </div>
            {showPdfOptions && (
              <div className="space-y-3 rounded-md border p-3">
                <div className="flex items-center gap-3">
                  <label htmlFor="pdf-year-select" className="text-sm font-medium whitespace-nowrap">
                    Report year:
                  </label>
                  <select
                    id="pdf-year-select"
                    value={pdfYear}
                    onChange={(e) => setPdfYear(Number(e.target.value))}
                    className="rounded-md border px-3 py-1.5 text-sm bg-background"
                  >
                    {yearOptions.map((y) => (
                      <option key={y} value={y}>{y}</option>
                    ))}
                  </select>
                  <span className="text-xs text-muted-foreground">
                    PDFs don&apos;t include the year
                  </span>
                </div>
                <div className="space-y-1.5">
                  <p className="text-sm font-medium">Manual date range <span className="font-normal text-muted-foreground">(optional — overrides auto-detection)</span></p>
                  <div className="flex items-center gap-2">
                    <label htmlFor="manual-start" className="sr-only">Week start</label>
                    <input
                      id="manual-start"
                      type="date"
                      value={manualStart}
                      onChange={(e) => setManualStart(e.target.value)}
                      className="rounded-md border px-3 py-1.5 text-sm bg-background"
                      placeholder="Week start"
                    />
                    <span className="text-sm text-muted-foreground">to</span>
                    <label htmlFor="manual-end" className="sr-only">Week end</label>
                    <input
                      id="manual-end"
                      type="date"
                      value={manualEnd}
                      onChange={(e) => setManualEnd(e.target.value)}
                      className="rounded-md border px-3 py-1.5 text-sm bg-background"
                      placeholder="Week end"
                    />
                  </div>
                </div>
              </div>
            )}
            {progress && (
              <p className="text-sm text-muted-foreground text-center">{progress}</p>
            )}
            {parseErrors.length > 0 && (
              <div className="rounded-md bg-destructive/10 p-3 text-sm text-destructive space-y-1" role="alert">
                {parseErrors.map((e, i) => (
                  <p key={i}>{e}</p>
                ))}
              </div>
            )}
            <DialogFooter>
              <Button onClick={handleUpload} disabled={loading}>
                {loading ? 'Validating...' : 'Upload & Validate'}
              </Button>
            </DialogFooter>
          </div>
        )}

        {/* Preview Stage */}
        {stage === 'preview' && (
          <div className="space-y-4" ref={previewRef} tabIndex={-1}>
            <div className="flex items-center gap-2 text-sm">
              <FileText className="h-4 w-4" aria-hidden="true" />
              <span className="font-medium">{validatedWeeks.length} week{validatedWeeks.length !== 1 ? 's' : ''} found</span>
              {totalWarnings > 0 && (
                <Badge variant="warning">{totalWarnings} warning{totalWarnings !== 1 ? 's' : ''}</Badge>
              )}
            </div>

            {totalNewEntities > 0 && (
              <div className="rounded-md border border-blue-200 bg-blue-50 p-3 text-sm space-y-1.5 dark:border-blue-800 dark:bg-blue-950">
                <p className="font-medium flex items-center gap-1.5 text-blue-700 dark:text-blue-300">
                  <Plus className="h-3.5 w-3.5" aria-hidden="true" />
                  {totalNewEntities} new {totalNewEntities === 1 ? 'entity' : 'entities'} will be created:
                </p>
                <div className="flex flex-wrap gap-1.5 max-h-32 overflow-y-auto">
                  {[...newEntities.trusts].map((n) => <Badge key={`t-${n}`} variant="secondary">Trust: {n}</Badge>)}
                  {[...newEntities.issues].map((n) => <Badge key={`i-${n}`} variant="secondary">Issue: {n}</Badge>)}
                  {[...newEntities.products].map((n) => <Badge key={`p-${n}`} variant="secondary">Product: {n}</Badge>)}
                  {[...newEntities.channels].map((n) => <Badge key={`c-${n}`} variant="secondary">Channel: {n}</Badge>)}
                  {[...newEntities.agents].map((n) => <Badge key={`a-${n}`} variant="secondary">Agent: {n}</Badge>)}
                </div>
              </div>
            )}

            <div className="max-h-80 overflow-y-auto space-y-2" tabIndex={0} role="region" aria-label="Week preview list">
              {validatedWeeks.map((week, i) => (
                <div key={i} className="rounded-md border p-3 text-sm space-y-1">
                  <div className="flex items-center justify-between">
                    <span className="font-medium">
                      <span aria-label={`${week.week_start} to ${week.week_end}`}>
                        {week.week_start} — {week.week_end}
                      </span>
                    </span>
                    {week.existingId ? (
                      <Badge variant="secondary">Exists</Badge>
                    ) : (
                      <Badge variant="success">New</Badge>
                    )}
                  </div>
                  {week.warnings.length > 0 && (
                    <div className="space-y-0.5 mt-1">
                      {week.warnings.map((w, j) => (
                        <p key={j} className="text-orange-700 dark:text-orange-400 flex items-start gap-1">
                          <AlertTriangle className="h-3.5 w-3.5 mt-0.5 shrink-0" aria-hidden="true" />
                          <span>{w.section}: {w.message}</span>
                        </p>
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </div>

            {parseErrors.length > 0 && (
              <div className="rounded-md bg-destructive/10 p-3 text-sm text-destructive space-y-1" role="alert">
                <p className="font-medium">Parse errors (files skipped):</p>
                {parseErrors.map((e, i) => (
                  <p key={i}>{e}</p>
                ))}
              </div>
            )}

            {validatedWeeks.some((w) => w.existingId) && (
              <fieldset className="space-y-2">
                <legend className="text-sm font-medium">Duplicate weeks:</legend>
                <div className="flex gap-3" role="radiogroup">
                  <label className="flex items-center gap-1.5 text-sm cursor-pointer">
                    <input
                      type="radio"
                      name="duplicateMode"
                      checked={duplicateMode === 'overwrite'}
                      onChange={() => setDuplicateMode('overwrite')}
                      className="accent-primary"
                    />
                    Overwrite
                  </label>
                  <label className="flex items-center gap-1.5 text-sm cursor-pointer">
                    <input
                      type="radio"
                      name="duplicateMode"
                      checked={duplicateMode === 'skip'}
                      onChange={() => setDuplicateMode('skip')}
                      className="accent-primary"
                    />
                    Skip
                  </label>
                </div>
              </fieldset>
            )}

            <DialogFooter>
              <Button variant="outline" onClick={() => setStage('upload')}>
                Back
              </Button>
              <Button onClick={handleImport}>Import</Button>
            </DialogFooter>
          </div>
        )}

        {/* Importing Stage */}
        {stage === 'importing' && (
          <div className="py-6 text-center space-y-2" role="status" aria-live="polite">
            <div className="animate-spin rounded-full h-8 w-8 border-2 border-primary border-t-transparent mx-auto" aria-hidden="true" />
            <p className="text-sm text-muted-foreground">{progress}</p>
          </div>
        )}

        {/* Done Stage */}
        {stage === 'done' && importResult && (
          <div className="space-y-4" role="status" aria-live="polite">
            <div className="flex items-center gap-2">
              {hasErrors ? (
                <>
                  <XCircle className="h-5 w-5 text-destructive" aria-hidden="true" />
                  <span className="font-medium">Import finished with errors</span>
                </>
              ) : (
                <>
                  <CheckCircle2 className="h-5 w-5 text-green-700 dark:text-green-400" aria-hidden="true" />
                  <span className="font-medium">Import complete</span>
                </>
              )}
            </div>
            <div className="text-sm space-y-2">
              <p>{importResult.imported} week{importResult.imported !== 1 ? 's' : ''} imported</p>
              {importResult.entitiesCreated > 0 && (
                <p className="text-muted-foreground">{importResult.entitiesCreated} new {importResult.entitiesCreated === 1 ? 'entity' : 'entities'} created</p>
              )}
              {importResult.skipped > 0 && (
                <p className="text-muted-foreground">{importResult.skipped} skipped</p>
              )}
              {importResult.errors.length > 0 && (
                <div className="rounded-md bg-destructive/10 p-3 text-destructive space-y-1 mt-2" role="alert">
                  {importResult.errors.map((e, i) => (
                    <p key={i}>{e}</p>
                  ))}
                </div>
              )}
              {importResult.imported > 0 && (
                <p className="text-muted-foreground text-xs mt-1">
                  To add screenshots for imported weeks, edit them from the weekly list.
                </p>
              )}
            </div>
            <DialogFooter>
              <Button ref={doneButtonRef} onClick={() => handleOpenChange(false)}>Done</Button>
            </DialogFooter>
          </div>
        )}
      </DialogContent>
    </Dialog>
  )
}
