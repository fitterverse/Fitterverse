'use server'

import { revalidatePath } from 'next/cache'
import { format } from 'date-fns'
import { requireSession } from '@/features/auth/server/session'
import { createClient } from '@/server/supabase/server'
import { buildLoggedAt, normalizeDateParam } from '@/features/journal/lib/date'
import {
  AI_BURST_LIMIT,
  AI_BURST_WINDOW_MS,
  AI_DAILY_LIMIT,
  JOURNAL_MEDIA_RETENTION_DAYS,
} from '@/features/journal/lib/constants'
import { analyzeJournalEntry } from '@/features/journal/server/ai'
import { recomputeJournalDay } from '@/features/journal/server/recompute'
import type { JournalEntry, JournalSourceType } from '@/shared/types'

interface JournalActionResult {
  success?: boolean
  error?: string
  entryId?: string
}

export async function createJournalEntry(formData: FormData): Promise<JournalActionResult> {
  const session = await requireSession()
  const supabase = createClient()

  const text = stringValue(formData.get('text'))
  const sourceType = normalizeSourceType(stringValue(formData.get('sourceType')))
  const date = normalizeDateParam(stringValue(formData.get('date')))
  const imageFile = fileValue(formData.get('image'))

  if (!text && !imageFile) {
    return { error: 'Add a description or a photo first.' }
  }

  const usageError = await checkAiUsage(session.uid, Boolean(imageFile))
  if (usageError) return { error: usageError }

  const entryId = crypto.randomUUID()
  const loggedAt = buildLoggedAt(date)

  const { error: insertError } = await supabase.from('journal_entries').insert({
    id: entryId,
    user_id: session.uid,
    entry_type: null,
    source_type: sourceType,
    status: 'processing',
    logged_for_date: date,
    logged_at: loggedAt,
    display_title: text ? text.slice(0, 120) : null,
    raw_input_text: text,
    latest_analysis_id: null,
    image_count: imageFile ? 1 : 0,
    is_edited: false,
    edit_count: 0,
  })

  if (insertError) {
    return { error: insertError.message }
  }

  try {
    const image = imageFile ? await uploadJournalMedia(entryId, session.uid, imageFile) : null
    const analysis = await analyzeJournalEntry({
      text,
      image,
    })
    const analysisId = crypto.randomUUID()

    await supabase.from('journal_entry_analyses').insert({
      id: analysisId,
      entry_id: entryId,
      user_id: session.uid,
      model_provider: 'google',
      model_name: analysis.model_name,
      analysis_kind: 'create',
      input_text: text,
      parsed_json: analysis.parsed_json,
      display_title: analysis.display_title,
      summary_text: analysis.summary_text,
      calories: toNullableInteger(analysis.calories),
      carbs_g: analysis.carbs_g,
      protein_g: analysis.protein_g,
      fat_g: analysis.fat_g,
      secondary_nutrients: analysis.secondary_nutrients,
      confidence_score: analysis.confidence_score,
      latency_ms: null,
      token_input: null,
      token_output: null,
      error_code: null,
    })

    await supabase
      .from('journal_entries')
      .update({
        entry_type: analysis.entry_type,
        status: 'ready',
        display_title: analysis.display_title,
        raw_input_text: text,
        latest_analysis_id: analysisId,
        image_count: image ? 1 : 0,
        updated_at: new Date().toISOString(),
      })
      .eq('id', entryId)
      .eq('user_id', session.uid)

    await recomputeJournalDay(session.uid, date)
    revalidateJournalRoutes(entryId)

    return { success: true, entryId }
  } catch (error) {
    await supabase
      .from('journal_entries')
      .update({
        status: 'failed',
        updated_at: new Date().toISOString(),
      })
      .eq('id', entryId)
      .eq('user_id', session.uid)

    return {
      error: error instanceof Error ? error.message : 'The AI analysis failed.',
      entryId,
    }
  }
}

export async function updateJournalEntry(formData: FormData): Promise<JournalActionResult> {
  const session = await requireSession()
  const supabase = createClient()
  const entryId = stringValue(formData.get('entryId'))

  if (!entryId) return { error: 'Missing entry id.' }

  const { data: existing } = await supabase
    .from('journal_entries')
    .select('*')
    .eq('id', entryId)
    .eq('user_id', session.uid)
    .maybeSingle()

  const entry = existing as JournalEntry | null
  if (!entry) return { error: 'Entry not found.' }
  if (entry.status === 'deleted') return { error: 'Entry was deleted.' }

  const text = stringValue(formData.get('text')) ?? entry.raw_input_text ?? ''
  const sourceType = normalizeSourceType(stringValue(formData.get('sourceType'))) ?? entry.source_type ?? 'text'
  const date = normalizeDateParam(stringValue(formData.get('date')) ?? entry.logged_for_date)
  const imageFile = fileValue(formData.get('image'))

  if (!text && !imageFile && entry.image_count === 0) {
    return { error: 'Add a description or a photo first.' }
  }

  const usageError = await checkAiUsage(session.uid, Boolean(imageFile || entry.image_count > 0))
  if (usageError) return { error: usageError }

  await supabase
    .from('journal_entries')
    .update({
      status: 'processing',
      source_type: sourceType,
      raw_input_text: text,
      is_edited: true,
      edit_count: (entry.edit_count ?? 0) + 1,
      updated_at: new Date().toISOString(),
    })
    .eq('id', entryId)
    .eq('user_id', session.uid)

  try {
    const image = imageFile
      ? await uploadJournalMedia(entryId, session.uid, imageFile)
      : await loadLatestJournalMedia(entryId)

    const analysis = await analyzeJournalEntry({
      text,
      image,
    })
    const analysisId = crypto.randomUUID()

    await supabase.from('journal_entry_analyses').insert({
      id: analysisId,
      entry_id: entryId,
      user_id: session.uid,
      model_provider: 'google',
      model_name: analysis.model_name,
      analysis_kind: 'edit',
      input_text: text,
      parsed_json: analysis.parsed_json,
      display_title: analysis.display_title,
      summary_text: analysis.summary_text,
      calories: toNullableInteger(analysis.calories),
      carbs_g: analysis.carbs_g,
      protein_g: analysis.protein_g,
      fat_g: analysis.fat_g,
      secondary_nutrients: analysis.secondary_nutrients,
      confidence_score: analysis.confidence_score,
      latency_ms: null,
      token_input: null,
      token_output: null,
      error_code: null,
    })

    await supabase
      .from('journal_entries')
      .update({
        entry_type: analysis.entry_type,
        source_type: sourceType,
        status: 'ready',
        display_title: analysis.display_title,
        raw_input_text: text,
        latest_analysis_id: analysisId,
        image_count: image ? 1 : 0,
        logged_for_date: date,
        updated_at: new Date().toISOString(),
      })
      .eq('id', entryId)
      .eq('user_id', session.uid)

    await recomputeJournalDay(session.uid, entry.logged_for_date)
    if (entry.logged_for_date !== date) {
      await recomputeJournalDay(session.uid, date)
    }

    revalidateJournalRoutes(entryId)
    if (entry.logged_for_date !== date) {
      revalidateJournalRoutes(entryId)
    }

    return { success: true, entryId }
  } catch (error) {
    await supabase
      .from('journal_entries')
      .update({
        status: 'failed',
        updated_at: new Date().toISOString(),
      })
      .eq('id', entryId)
      .eq('user_id', session.uid)

    return {
      error: error instanceof Error ? error.message : 'The AI re-analysis failed.',
    }
  }
}

export async function deleteJournalEntry(entryId: string): Promise<JournalActionResult> {
  const session = await requireSession()
  const supabase = createClient()

  const { data: entry } = await supabase
    .from('journal_entries')
    .select('logged_for_date')
    .eq('id', entryId)
    .eq('user_id', session.uid)
    .maybeSingle()

  if (!entry) return { error: 'Entry not found.' }

  const { error } = await supabase
    .from('journal_entries')
    .update({
      status: 'deleted',
      deleted_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    })
    .eq('id', entryId)
    .eq('user_id', session.uid)

  if (error) return { error: error.message }

  await recomputeJournalDay(session.uid, entry.logged_for_date)
  revalidateJournalRoutes(entryId)

  return { success: true }
}

async function checkAiUsage(userId: string, usesImage: boolean) {
  const supabase = createClient()
  const today = format(new Date(), 'yyyy-MM-dd')

  const [{ data: usage }, { count: recentCount }] = await Promise.all([
    supabase
      .from('ai_usage_daily')
      .select('*')
      .eq('user_id', userId)
      .eq('date', today)
      .maybeSingle(),
    supabase
      .from('journal_entry_analyses')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', userId)
      .gte('created_at', new Date(Date.now() - AI_BURST_WINDOW_MS).toISOString()),
  ])

  if ((usage?.analysis_count ?? 0) >= AI_DAILY_LIMIT) {
    return `You have reached today's ${AI_DAILY_LIMIT} AI analysis limit.`
  }

  if ((recentCount ?? 0) >= AI_BURST_LIMIT) {
    return 'You are logging too quickly. Please wait a minute and try again.'
  }

  await supabase.from('ai_usage_daily').upsert(
    {
      user_id: userId,
      date: today,
      analysis_count: (usage?.analysis_count ?? 0) + 1,
      image_analysis_count: (usage?.image_analysis_count ?? 0) + (usesImage ? 1 : 0),
      detail_analysis_count: usage?.detail_analysis_count ?? 0,
      last_request_at: new Date().toISOString(),
    },
    { onConflict: 'user_id,date' }
  )

  return null
}

async function uploadJournalMedia(entryId: string, userId: string, file: File) {
  const supabase = createClient()
  const bytes = await file.arrayBuffer()
  const buffer = Buffer.from(bytes)
  const extension = inferExtension(file)
  const storagePath = `${userId}/${entryId}/${Date.now()}.${extension}`
  const retention = new Date()
  retention.setDate(retention.getDate() + JOURNAL_MEDIA_RETENTION_DAYS)

  const { error: uploadError } = await supabase.storage
    .from('journal-media')
    .upload(storagePath, buffer, {
      contentType: file.type || 'image/jpeg',
      upsert: true,
    })

  if (uploadError) {
    throw new Error(uploadError.message)
  }

  await supabase.from('journal_entry_media').insert({
    entry_id: entryId,
    user_id: userId,
    storage_path: storagePath,
    mime_type: file.type || 'image/jpeg',
    file_size_bytes: file.size,
    width: null,
    height: null,
    retention_expires_at: retention.toISOString(),
  })

  return {
    base64: buffer.toString('base64'),
    mimeType: file.type || 'image/jpeg',
  }
}

async function loadLatestJournalMedia(entryId: string) {
  const supabase = createClient()
  const { data: rows } = await supabase
    .from('journal_entry_media')
    .select('*')
    .eq('entry_id', entryId)
    .order('created_at', { ascending: false })
    .limit(1)

  const media = rows?.[0]
  if (!media) return null

  const { data, error } = await supabase.storage
    .from('journal-media')
    .download(media.storage_path)

  if (error || !data) {
    throw new Error(error?.message || 'Unable to load the existing photo.')
  }

  const buffer = Buffer.from(await data.arrayBuffer())
  return {
    base64: buffer.toString('base64'),
    mimeType: media.mime_type || 'image/jpeg',
  }
}

function revalidateJournalRoutes(entryId: string) {
  revalidatePath('/dashboard')
  revalidatePath(`/(app)/dashboard`)
  revalidatePath('/progress')
  revalidatePath(`/(app)/progress`)
  revalidatePath('/streak')
  revalidatePath(`/(app)/streak`)
  revalidatePath(`/entry/${entryId}`)
  revalidatePath(`/(app)/entry/${entryId}`)
}

function normalizeSourceType(value: string | null): JournalSourceType {
  switch (value) {
    case 'camera':
    case 'gallery':
    case 'text_image':
      return value
    default:
      return 'text'
  }
}

function inferExtension(file: File) {
  if (file.name.includes('.')) return file.name.split('.').pop() || 'jpg'
  const [type] = file.type.split('/')
  return type === 'image' ? file.type.split('/')[1] || 'jpg' : 'jpg'
}

function stringValue(value: FormDataEntryValue | null) {
  return typeof value === 'string' ? value.trim() : null
}

function fileValue(value: FormDataEntryValue | null) {
  return value instanceof File && value.size > 0 ? value : null
}

function toNullableInteger(value: number | null) {
  if (value === null || !Number.isFinite(value)) return null
  return Math.round(value)
}
