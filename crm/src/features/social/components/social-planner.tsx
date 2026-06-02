'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { format } from 'date-fns'
import { CalendarClock, CheckCircle2, Pencil, Plus, RefreshCcw } from 'lucide-react'
import { toast } from 'sonner'
import {
  SOCIAL_PLATFORM_OPTIONS,
  SOCIAL_POST_STATUSES,
  SocialPlatform,
  SocialPostRecord,
  SocialPostStatus,
} from '@/features/social/social-shared'

interface SocialPlannerProps {
  posts: SocialPostRecord[]
  tableReady: boolean
  errorMessage: string | null
}

interface SocialFormState {
  title: string
  platforms: SocialPlatform[]
  caption: string
  hashtags: string
  asset_path: string
  planned_for: string
  status: SocialPostStatus
  notes: string
}

const EMPTY_FORM: SocialFormState = {
  title: '',
  platforms: ['instagram'],
  caption: '',
  hashtags: '',
  asset_path: '',
  planned_for: '',
  status: 'draft',
  notes: '',
}

export function SocialPlanner({ posts, tableReady, errorMessage }: SocialPlannerProps) {
  const router = useRouter()
  const [form, setForm] = useState<SocialFormState>(EMPTY_FORM)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editingForm, setEditingForm] = useState<SocialFormState>(EMPTY_FORM)
  const [saving, setSaving] = useState(false)
  const [updatingId, setUpdatingId] = useState<string | null>(null)

  function updateForm<K extends keyof SocialFormState>(key: K, value: SocialFormState[K]) {
    setForm(prev => ({ ...prev, [key]: value }))
  }

  function updateEditingForm<K extends keyof SocialFormState>(key: K, value: SocialFormState[K]) {
    setEditingForm(prev => ({ ...prev, [key]: value }))
  }

  function togglePlatform(
    current: SocialPlatform[],
    platform: SocialPlatform,
    setter: (platforms: SocialPlatform[]) => void
  ) {
    const next = current.includes(platform)
      ? current.filter(value => value !== platform)
      : [...current, platform]

    setter(next)
  }

  async function handleCreate(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setSaving(true)

    try {
      const res = await fetch('/api/social-posts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Failed to create post')

      toast.success('Social post draft created')
      setForm(EMPTY_FORM)
      router.refresh()
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to create post')
    } finally {
      setSaving(false)
    }
  }

  function startEditing(post: SocialPostRecord) {
    setEditingId(post.id)
    setEditingForm({
      title: post.title,
      platforms: post.platforms,
      caption: post.caption,
      hashtags: post.hashtags,
      asset_path: post.asset_path,
      planned_for: toDatetimeLocal(post.planned_for),
      status: post.status,
      notes: post.notes,
    })
  }

  async function handleEdit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    if (!editingId) return

    setUpdatingId(editingId)
    try {
      const res = await fetch(`/api/social-posts/${editingId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(editingForm),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Failed to update post')

      toast.success('Social post updated')
      setEditingId(null)
      router.refresh()
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to update post')
    } finally {
      setUpdatingId(null)
    }
  }

  async function markPosted(id: string) {
    setUpdatingId(id)
    try {
      const res = await fetch(`/api/social-posts/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'mark_posted' }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Failed to mark post as posted')

      toast.success('Marked as posted')
      if (editingId === id) setEditingId(null)
      router.refresh()
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to update post')
    } finally {
      setUpdatingId(null)
    }
  }

  return (
    <div className="space-y-6">
      <section className="rounded-3xl border border-gray-200 bg-white p-6 shadow-sm">
        <div className="mb-5 flex items-start justify-between gap-4">
          <div>
            <h2 className="text-lg font-semibold text-gray-900">New social post</h2>
            <p className="mt-1 text-sm text-gray-500">
              Save captions, local desktop asset paths, and planned publish times without uploading media anywhere.
            </p>
            <p className="mt-1 text-xs text-gray-400">
              Everyone with CRM access can see, update, and execute these plans.
            </p>
          </div>
          <div className="rounded-2xl border border-gray-200 bg-gray-50 px-3 py-2 text-xs text-gray-500">
            Assets stay local. CRM stores metadata only.
          </div>
        </div>

        {!tableReady && (
          <div className="mb-5 rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
            {errorMessage}
          </div>
        )}

        <form onSubmit={handleCreate} className="space-y-5">
          <SocialPostEditor
            form={form}
            disabled={!tableReady || saving}
            onFieldChange={updateForm}
            onPlatformToggle={platform =>
              togglePlatform(form.platforms, platform, platforms => updateForm('platforms', platforms))
            }
          />

          <div className="flex items-center gap-3">
            <button
              type="submit"
              disabled={!tableReady || saving}
              className="inline-flex items-center gap-2 rounded-2xl bg-[#0B0F0D] px-4 py-3 text-sm font-semibold text-white transition hover:bg-[#151b18] disabled:cursor-not-allowed disabled:opacity-60"
            >
              <Plus size={16} />
              {saving ? 'Saving...' : 'Create draft'}
            </button>
            <button
              type="button"
              onClick={() => setForm(EMPTY_FORM)}
              disabled={saving}
              className="rounded-2xl border border-gray-200 px-4 py-3 text-sm font-medium text-gray-600 transition hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-60"
            >
              Reset
            </button>
          </div>
        </form>
      </section>

      <section className="space-y-4">
        {posts.length === 0 ? (
          <div className="rounded-3xl border border-dashed border-gray-300 bg-white p-8 text-center text-sm text-gray-500">
            No social posts match the current filters yet.
          </div>
        ) : (
          posts.map(post => {
            const isEditing = editingId === post.id
            const isBusy = updatingId === post.id

            return (
              <article key={post.id} className="rounded-3xl border border-gray-200 bg-white p-6 shadow-sm">
                <div className="flex flex-wrap items-start justify-between gap-4">
                  <div className="space-y-3">
                    <div className="flex flex-wrap items-center gap-2">
                      <h3 className="text-lg font-semibold text-gray-900">{post.title}</h3>
                      <StatusBadge status={post.status} />
                      {post.platforms.map(platform => (
                        <span
                          key={platform}
                          className="rounded-full bg-gray-100 px-2.5 py-1 text-xs font-medium capitalize text-gray-600"
                        >
                          {platform}
                        </span>
                      ))}
                    </div>

                    <div className="flex flex-wrap gap-4 text-xs text-gray-500">
                      <MetaRow
                        icon={<CalendarClock size={14} />}
                        label={post.planned_for ? `Planned ${formatDate(post.planned_for)}` : 'No planned time'}
                      />
                      <MetaRow
                        icon={<CheckCircle2 size={14} />}
                        label={post.posted_at ? `Posted ${formatDate(post.posted_at)}` : 'Not posted yet'}
                      />
                    </div>
                    <div className="flex flex-wrap gap-4 text-xs text-gray-500">
                      <MetaRow
                        icon={<Pencil size={14} />}
                        label={`Created by ${post.created_by_name ?? 'Team member'}`}
                      />
                      <MetaRow
                        icon={<RefreshCcw size={14} />}
                        label={`Last updated by ${post.updated_by_name ?? post.created_by_name ?? 'Team member'}`}
                      />
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => (isEditing ? setEditingId(null) : startEditing(post))}
                      className="inline-flex items-center gap-2 rounded-2xl border border-gray-200 px-3 py-2 text-sm font-medium text-gray-600 transition hover:bg-gray-50"
                    >
                      <Pencil size={14} />
                      {isEditing ? 'Close' : 'Edit'}
                    </button>
                    {post.status !== 'posted' && (
                      <button
                        type="button"
                        onClick={() => markPosted(post.id)}
                        disabled={isBusy}
                        className="inline-flex items-center gap-2 rounded-2xl bg-green-500 px-3 py-2 text-sm font-medium text-white transition hover:bg-green-600 disabled:cursor-not-allowed disabled:opacity-60"
                      >
                        {isBusy ? <RefreshCcw size={14} className="animate-spin" /> : <CheckCircle2 size={14} />}
                        Mark posted
                      </button>
                    )}
                  </div>
                </div>

                <div className="mt-5 grid gap-4 lg:grid-cols-[1.2fr_0.8fr]">
                  <div className="space-y-4">
                    <ReadOnlyBlock label="Caption" value={post.caption || 'No caption yet'} preserveWhitespace />
                    <ReadOnlyBlock label="Hashtags" value={post.hashtags || 'No hashtags yet'} preserveWhitespace />
                    <ReadOnlyBlock label="Notes" value={post.notes || 'No internal notes yet'} preserveWhitespace />
                  </div>

                  <div className="space-y-4">
                    <ReadOnlyBlock label="Local asset path" value={post.asset_path || 'No asset path added'} />
                    <div className="rounded-2xl border border-gray-200 bg-gray-50 px-4 py-3">
                      <p className="text-xs font-semibold uppercase tracking-[0.18em] text-gray-400">Created</p>
                      <p className="mt-2 text-sm text-gray-700">{formatDate(post.created_at)}</p>
                      <p className="mt-1 text-xs text-gray-500">
                        {post.created_by_name ?? 'Team member'}
                      </p>
                    </div>
                    <div className="rounded-2xl border border-gray-200 bg-gray-50 px-4 py-3">
                      <p className="text-xs font-semibold uppercase tracking-[0.18em] text-gray-400">Last Updated</p>
                      <p className="mt-2 text-sm text-gray-700">{formatDate(post.updated_at)}</p>
                      <p className="mt-1 text-xs text-gray-500">
                        {post.updated_by_name ?? post.created_by_name ?? 'Team member'}
                      </p>
                    </div>
                  </div>
                </div>

                {isEditing && (
                  <form onSubmit={handleEdit} className="mt-6 rounded-3xl border border-gray-200 bg-gray-50 p-5">
                    <div className="mb-4">
                      <h4 className="text-sm font-semibold text-gray-900">Edit post</h4>
                      <p className="mt-1 text-xs text-gray-500">
                        Update text, paths, and planned times without touching the media files themselves.
                      </p>
                    </div>

                    <SocialPostEditor
                      form={editingForm}
                      disabled={isBusy}
                      onFieldChange={updateEditingForm}
                      onPlatformToggle={platform =>
                        togglePlatform(editingForm.platforms, platform, platforms => updateEditingForm('platforms', platforms))
                      }
                    />

                    <div className="mt-5 flex items-center gap-3">
                      <button
                        type="submit"
                        disabled={isBusy}
                        className="inline-flex items-center gap-2 rounded-2xl bg-[#0B0F0D] px-4 py-3 text-sm font-semibold text-white transition hover:bg-[#151b18] disabled:cursor-not-allowed disabled:opacity-60"
                      >
                        {isBusy ? <RefreshCcw size={14} className="animate-spin" /> : <Pencil size={14} />}
                        Save changes
                      </button>
                      <button
                        type="button"
                        onClick={() => setEditingId(null)}
                        className="rounded-2xl border border-gray-200 px-4 py-3 text-sm font-medium text-gray-600 transition hover:bg-white"
                      >
                        Cancel
                      </button>
                    </div>
                  </form>
                )}
              </article>
            )
          })
        )}
      </section>
    </div>
  )
}

function SocialPostEditor({
  form,
  disabled,
  onFieldChange,
  onPlatformToggle,
}: {
  form: SocialFormState
  disabled: boolean
  onFieldChange: <K extends keyof SocialFormState>(key: K, value: SocialFormState[K]) => void
  onPlatformToggle: (platform: SocialPlatform) => void
}) {
  return (
    <div className="grid gap-5 lg:grid-cols-2">
      <Field label="Post title">
        <input
          required
          value={form.title}
          onChange={e => onFieldChange('title', e.target.value)}
          placeholder="Example: 3 protein-packed breakfast swaps"
          disabled={disabled}
          className="w-full rounded-2xl border border-gray-200 bg-white px-4 py-3 text-sm text-gray-900 outline-none transition focus:border-green-500 focus:ring-2 focus:ring-green-100 disabled:cursor-not-allowed disabled:bg-gray-50"
        />
      </Field>

      <Field label="Planned date and time">
        <input
          type="datetime-local"
          value={form.planned_for}
          onChange={e => onFieldChange('planned_for', e.target.value)}
          disabled={disabled}
          className="w-full rounded-2xl border border-gray-200 bg-white px-4 py-3 text-sm text-gray-900 outline-none transition focus:border-green-500 focus:ring-2 focus:ring-green-100 disabled:cursor-not-allowed disabled:bg-gray-50"
        />
      </Field>

      <Field label="Platforms">
        <div className="flex flex-wrap gap-2">
          {SOCIAL_PLATFORM_OPTIONS.map(platform => {
            const active = form.platforms.includes(platform.value)
            return (
              <button
                key={platform.value}
                type="button"
                onClick={() => onPlatformToggle(platform.value)}
                disabled={disabled}
                className={`rounded-full border px-3 py-2 text-sm font-medium transition disabled:cursor-not-allowed disabled:opacity-60 ${
                  active
                    ? 'border-green-500 bg-green-50 text-green-700'
                    : 'border-gray-200 bg-white text-gray-600 hover:bg-gray-50'
                }`}
              >
                {platform.label}
              </button>
            )
          })}
        </div>
      </Field>

      <Field label="Status">
        <select
          value={form.status}
          onChange={e => onFieldChange('status', e.target.value as SocialPostStatus)}
          disabled={disabled}
          className="w-full rounded-2xl border border-gray-200 bg-white px-4 py-3 text-sm text-gray-900 outline-none transition focus:border-green-500 focus:ring-2 focus:ring-green-100 disabled:cursor-not-allowed disabled:bg-gray-50"
        >
          {SOCIAL_POST_STATUSES.map(status => (
            <option key={status} value={status}>
              {status[0]!.toUpperCase() + status.slice(1)}
            </option>
          ))}
        </select>
      </Field>

      <Field label="Caption">
        <textarea
          rows={6}
          value={form.caption}
          onChange={e => onFieldChange('caption', e.target.value)}
          placeholder="Write the post caption here..."
          disabled={disabled}
          className="w-full rounded-2xl border border-gray-200 bg-white px-4 py-3 text-sm text-gray-900 outline-none transition focus:border-green-500 focus:ring-2 focus:ring-green-100 disabled:cursor-not-allowed disabled:bg-gray-50"
        />
      </Field>

      <Field label="Hashtags / CTA">
        <textarea
          rows={6}
          value={form.hashtags}
          onChange={e => onFieldChange('hashtags', e.target.value)}
          placeholder="#fitterverse #indianfitness ..."
          disabled={disabled}
          className="w-full rounded-2xl border border-gray-200 bg-white px-4 py-3 text-sm text-gray-900 outline-none transition focus:border-green-500 focus:ring-2 focus:ring-green-100 disabled:cursor-not-allowed disabled:bg-gray-50"
        />
      </Field>

      <Field label="Local asset path">
        <input
          value={form.asset_path}
          onChange={e => onFieldChange('asset_path', e.target.value)}
          placeholder="/Users/rajsingh/Desktop/Fitterverse_Social_Assets/2026-06/post-001.mp4"
          disabled={disabled}
          className="w-full rounded-2xl border border-gray-200 bg-white px-4 py-3 text-sm text-gray-900 outline-none transition focus:border-green-500 focus:ring-2 focus:ring-green-100 disabled:cursor-not-allowed disabled:bg-gray-50"
        />
      </Field>

      <Field label="Notes / posting checklist">
        <textarea
          rows={4}
          value={form.notes}
          onChange={e => onFieldChange('notes', e.target.value)}
          placeholder="Add hook notes, reel cover text, comments to pin, or manual posting reminders."
          disabled={disabled}
          className="w-full rounded-2xl border border-gray-200 bg-white px-4 py-3 text-sm text-gray-900 outline-none transition focus:border-green-500 focus:ring-2 focus:ring-green-100 disabled:cursor-not-allowed disabled:bg-gray-50"
        />
      </Field>
    </div>
  )
}

function ReadOnlyBlock({
  label,
  value,
  preserveWhitespace = false,
}: {
  label: string
  value: string
  preserveWhitespace?: boolean
}) {
  return (
    <div className="rounded-2xl border border-gray-200 bg-gray-50 px-4 py-3">
      <p className="text-xs font-semibold uppercase tracking-[0.18em] text-gray-400">{label}</p>
      <p className={`mt-2 text-sm text-gray-700 ${preserveWhitespace ? 'whitespace-pre-wrap' : 'break-all'}`}>
        {value}
      </p>
    </div>
  )
}

function StatusBadge({ status }: { status: SocialPostStatus }) {
  const styles: Record<SocialPostStatus, string> = {
    idea: 'bg-sky-100 text-sky-700',
    draft: 'bg-amber-100 text-amber-700',
    ready: 'bg-violet-100 text-violet-700',
    posted: 'bg-green-100 text-green-700',
  }

  return (
    <span className={`rounded-full px-2.5 py-1 text-xs font-semibold capitalize ${styles[status]}`}>
      {status}
    </span>
  )
}

function MetaRow({ icon, label }: { icon: React.ReactNode; label: string }) {
  return (
    <div className="inline-flex items-center gap-1.5">
      <span className="text-gray-400">{icon}</span>
      <span>{label}</span>
    </div>
  )
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block space-y-2">
      <span className="text-sm font-medium text-gray-700">{label}</span>
      {children}
    </label>
  )
}

function toDatetimeLocal(value: string | null) {
  if (!value) return ''

  const date = new Date(value)
  const local = new Date(date.getTime() - date.getTimezoneOffset() * 60_000)
  return local.toISOString().slice(0, 16)
}

function formatDate(value: string) {
  return format(new Date(value), 'MMM d, yyyy • h:mm a')
}
