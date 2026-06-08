'use client'

import { useRef, useState, startTransition } from 'react'
import { useRouter } from 'next/navigation'
import { Camera, ImagePlus, Loader2 } from 'lucide-react'
import { toast } from 'sonner'
import { createJournalEntry } from '@/features/journal/server/actions'
import { cn } from '@/shared/lib/utils'

interface TodayComposerProps {
  selectedDate: string
}

export function TodayComposer({ selectedDate }: TodayComposerProps) {
  const router = useRouter()
  const [text, setText] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const cameraInputRef = useRef<HTMLInputElement | null>(null)
  const galleryInputRef = useRef<HTMLInputElement | null>(null)

  async function submitTextOnly(event: React.FormEvent) {
    event.preventDefault()
    if (!text.trim()) return

    setSubmitting(true)
    const formData = new FormData()
    formData.set('text', text.trim())
    formData.set('date', selectedDate)
    formData.set('sourceType', 'text')

    const result = await createJournalEntry(formData)
    setSubmitting(false)

    if (result.error) {
      toast.error(result.error)
      return
    }

    setText('')
    toast.success('Entry logged.')
    startTransition(() => router.refresh())
  }

  async function handleFilePick(
    event: React.ChangeEvent<HTMLInputElement>,
    sourceType: 'camera' | 'gallery'
  ) {
    const file = event.target.files?.[0]
    if (!file) return

    setSubmitting(true)
    const formData = new FormData()
    formData.set('date', selectedDate)
    formData.set('sourceType', text.trim() ? 'text_image' : sourceType)
    if (text.trim()) {
      formData.set('text', text.trim())
    }
    formData.set('image', file)

    const result = await createJournalEntry(formData)
    setSubmitting(false)
    event.target.value = ''

    if (result.error) {
      toast.error(result.error)
      return
    }

    setText('')
    toast.success('Entry logged.')
    startTransition(() => router.refresh())
  }

  return (
    <div className="fixed inset-x-0 bottom-0 z-30 border-t border-slate-200 bg-white/95 px-4 pb-[calc(env(safe-area-inset-bottom)+10px)] pt-3 backdrop-blur">
      <div className="mx-auto flex max-w-[26.5rem] items-center gap-2">
        <form
          onSubmit={submitTextOnly}
          className="flex min-h-[3.3rem] flex-1 items-center rounded-full bg-slate-100 px-4 shadow-inner"
        >
          <input
            value={text}
            onChange={(event) => setText(event.target.value)}
            placeholder="What did you eat or exercise?"
            className="h-full min-w-0 flex-1 bg-transparent text-[0.98rem] text-slate-900 outline-none placeholder:text-slate-500"
            disabled={submitting}
          />
          <button
            type="submit"
            disabled={submitting || !text.trim()}
            className={cn(
              'inline-flex h-8 items-center rounded-full px-3 text-sm font-semibold transition-colors',
              text.trim()
                ? 'bg-slate-900 text-white'
                : 'bg-transparent text-slate-400'
            )}
          >
            {submitting ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Log'}
          </button>
        </form>

        <button
          type="button"
          onClick={() => galleryInputRef.current?.click()}
          className="inline-flex h-10.5 w-10.5 shrink-0 items-center justify-center rounded-2xl border border-slate-200 bg-white text-slate-700 shadow-sm"
          aria-label="Upload from gallery"
          disabled={submitting}
        >
          <ImagePlus className="h-4 w-4" />
        </button>

        <button
          type="button"
          onClick={() => cameraInputRef.current?.click()}
          className="inline-flex h-10.5 w-10.5 shrink-0 items-center justify-center rounded-2xl border border-slate-200 bg-white text-slate-700 shadow-sm"
          aria-label="Open camera"
          disabled={submitting}
        >
          <Camera className="h-4 w-4" />
        </button>

        <input
          ref={galleryInputRef}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={(event) => handleFilePick(event, 'gallery')}
        />
        <input
          ref={cameraInputRef}
          type="file"
          accept="image/*"
          capture="environment"
          className="hidden"
          onChange={(event) => handleFilePick(event, 'camera')}
        />
      </div>
    </div>
  )
}
