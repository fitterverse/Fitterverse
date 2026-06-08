'use client'

import { useEffect, useState, startTransition } from 'react'
import { useRouter } from 'next/navigation'
import { Camera, Loader2, PencilLine, Trash2 } from 'lucide-react'
import { toast } from 'sonner'
import { deleteJournalEntry, updateJournalEntry } from '@/features/journal/server/actions'
import { cn } from '@/shared/lib/utils'
import type { JournalFeedItem, NutritionTargets } from '@/shared/types'

interface JournalFeedProps {
  feed: JournalFeedItem[]
  targets: NutritionTargets
  selectedDate: string
}

export function JournalFeed({ feed, targets, selectedDate }: JournalFeedProps) {
  if (!feed.length) {
    return (
      <div className="rounded-[1.75rem] border border-dashed border-slate-200 bg-white px-6 py-8 text-center text-[1rem] leading-8 text-slate-500 shadow-sm">
        Your day is empty. Log food or a workout to start building the feed.
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {feed.map((item) => (
        <JournalEntryCard
          key={item.entry.id}
          item={item}
          targets={targets}
          selectedDate={selectedDate}
        />
      ))}
    </div>
  )
}

function JournalEntryCard({
  item,
  targets,
  selectedDate,
}: {
  item: JournalFeedItem
  targets: NutritionTargets
  selectedDate: string
}) {
  const router = useRouter()
  const [editing, setEditing] = useState(false)
  const [text, setText] = useState(item.entry.raw_input_text ?? item.entry.display_title ?? '')
  const [saving, setSaving] = useState(false)
  const [file, setFile] = useState<File | null>(null)
  const [mounted, setMounted] = useState(false)

  const title = item.analysis?.display_title ?? item.entry.display_title ?? 'Untitled entry'
  const summary = item.analysis?.summary_text ?? 'AI estimate unavailable.'
  const calories = Math.round(item.analysis?.calories ?? 0)
  const loggedAt = new Date(item.entry.logged_at)
  const detailHref = `/entry/${item.entry.id}`

  useEffect(() => {
    setMounted(true)
  }, [])

  async function handleUpdate() {
    setSaving(true)
    const formData = new FormData()
    formData.set('entryId', item.entry.id)
    formData.set('date', selectedDate)
    formData.set('text', text)
    formData.set('sourceType', file ? 'text_image' : item.entry.source_type ?? 'text')
    if (file) formData.set('image', file)

    const result = await updateJournalEntry(formData)
    setSaving(false)

    if (result.error) {
      toast.error(result.error)
      return
    }

    setEditing(false)
    setFile(null)
    toast.success('Entry updated.')
    startTransition(() => router.refresh())
  }

  async function handleDelete() {
    if (!confirm('Delete this entry?')) return
    setSaving(true)
    const result = await deleteJournalEntry(item.entry.id)
    setSaving(false)

    if (result.error) {
      toast.error(result.error)
      return
    }

    toast.success('Entry deleted.')
    startTransition(() => router.refresh())
  }

  return (
    <article
      className={cn(
        'overflow-hidden rounded-[1.75rem] border border-slate-200 bg-white px-4 py-4 shadow-sm transition-shadow',
        !editing && 'cursor-pointer hover:shadow-md focus-within:shadow-md'
      )}
      onClick={editing ? undefined : () => router.push(detailHref)}
      onKeyDown={
        editing
          ? undefined
          : (event) => {
              if (event.key === 'Enter' || event.key === ' ') {
                event.preventDefault()
                router.push(detailHref)
              }
            }
      }
      role={editing ? undefined : 'link'}
      tabIndex={editing ? undefined : 0}
    >
      {!editing ? (
        <>
          <div className="space-y-1">
            {item.entry.raw_input_text && (
              <p className="truncate text-[0.9rem] text-slate-400">{item.entry.raw_input_text}</p>
            )}
            <h3 className="truncate text-[1.6rem] font-semibold leading-tight tracking-tight text-slate-900">
              {title}
            </h3>
          </div>

          <div className="my-4 h-px bg-slate-200" />

          {item.entry.entry_type === 'food' ? (
            <div className="grid grid-cols-4 gap-2.5">
              <FoodMetric label="Calories" value={calories} pct={pct(calories, targets.calorie_target)} />
              <FoodMetric label="Carbs" value={item.analysis?.carbs_g ?? 0} unit="g" pct={pct(item.analysis?.carbs_g ?? 0, targets.carbs_g)} />
              <FoodMetric label="Protein" value={item.analysis?.protein_g ?? 0} unit="g" pct={pct(item.analysis?.protein_g ?? 0, targets.protein_g)} />
              <FoodMetric label="Fat" value={item.analysis?.fat_g ?? 0} unit="g" pct={pct(item.analysis?.fat_g ?? 0, targets.fat_g)} />
            </div>
          ) : (
            <div className="space-y-2.5">
              <div>
                <p className="text-[0.98rem] font-medium text-slate-500">Calories</p>
                <p className="mt-1 text-[1.7rem] font-semibold leading-none tracking-tight text-slate-900 tabular-nums">{calories.toLocaleString()}</p>
              </div>
              <p className="text-[0.98rem] leading-7 text-slate-700">{summary}</p>
            </div>
          )}

          <div className="mt-5 flex items-center justify-between">
            <p className="text-[0.95rem] text-slate-600">
              <time suppressHydrationWarning dateTime={item.entry.logged_at}>
                {mounted ? formatLocalTime(loggedAt) : '--:--'}
              </time>
            </p>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={(event) => {
                  event.stopPropagation()
                  setEditing(true)
                }}
                className="inline-flex h-8.5 w-8.5 items-center justify-center rounded-xl text-slate-600 transition-colors hover:bg-slate-100"
                aria-label="Edit entry"
              >
                <PencilLine className="h-4 w-4" />
              </button>
              <button
                type="button"
                onClick={(event) => {
                  event.stopPropagation()
                  void handleDelete()
                }}
                disabled={saving}
                className="inline-flex h-8.5 w-8.5 items-center justify-center rounded-xl text-slate-600 transition-colors hover:bg-slate-100 disabled:opacity-50"
                aria-label="Delete entry"
              >
                {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Trash2 className="h-4 w-4" />}
              </button>
            </div>
          </div>
        </>
      ) : (
        <div className="space-y-4">
          <textarea
            value={text}
            onChange={(event) => setText(event.target.value)}
            onClick={(event) => event.stopPropagation()}
            className="min-h-28 w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-[0.98rem] text-slate-900 outline-none"
            placeholder="Describe the food or workout"
          />

          <label
            onClick={(event) => event.stopPropagation()}
            className="inline-flex cursor-pointer items-center gap-2 rounded-full border border-slate-200 px-4 py-2 text-sm font-medium text-slate-700"
          >
            <Camera className="h-4 w-4" />
            {file ? file.name : 'Replace photo'}
            <input
              type="file"
              accept="image/*"
              className="hidden"
              onClick={(event) => event.stopPropagation()}
              onChange={(event) => setFile(event.target.files?.[0] ?? null)}
            />
          </label>

          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={handleUpdate}
              disabled={saving || (!text.trim() && !file && item.entry.image_count === 0)}
              className="inline-flex items-center rounded-full bg-slate-900 px-5 py-2.5 text-sm font-semibold text-white disabled:opacity-50"
            >
              {saving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
              Re-analyze
            </button>
            <button
              type="button"
              onClick={() => {
                setEditing(false)
                setFile(null)
                setText(item.entry.raw_input_text ?? item.entry.display_title ?? '')
              }}
              className="inline-flex items-center rounded-full border border-slate-200 px-5 py-2.5 text-sm font-semibold text-slate-700"
            >
              Cancel
            </button>
          </div>
        </div>
      )}
    </article>
  )
}

function FoodMetric({
  label,
  value,
  pct,
  unit = '',
}: {
  label: string
  value: number
  pct: number
  unit?: string
}) {
  return (
    <div className="min-w-0 space-y-1.5">
      <p className="text-[0.8rem] font-medium text-slate-600">{label}</p>
      <p className="truncate text-[clamp(1.1rem,4vw,1.35rem)] font-semibold leading-none tracking-tight text-slate-900 tabular-nums">
        {formatValue(value)}
        {unit}
      </p>
      <div className="h-1.5 rounded-full bg-slate-200">
        <div className="h-1.5 rounded-full bg-sky-500" style={{ width: `${pct}%` }} />
      </div>
      <p className="text-[0.8rem] text-slate-600">{Math.round(pct)}%</p>
    </div>
  )
}

function formatValue(value: number) {
  const rounded = Math.round(value * 10) / 10
  return Number.isInteger(rounded) ? rounded.toFixed(0) : rounded.toFixed(1)
}

function pct(value: number, total: number) {
  if (!total) return 0
  return Math.max(0, Math.min(100, (value / total) * 100))
}

function formatLocalTime(date: Date) {
  return new Intl.DateTimeFormat([], {
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  }).format(date)
}
