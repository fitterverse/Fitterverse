'use server'

import { requireSession } from '@/features/auth/server/session'
import { createClient } from '@/server/supabase/server'
import type { NotificationPreferences } from './queries'

// ── Token management ──────────────────────────────────────────

export async function saveNotificationToken(token: string, deviceHint?: string) {
  const { uid } = await requireSession()
  const supabase = createClient()

  await supabase.from('notification_tokens').upsert(
    {
      user_id:     uid,
      token,
      device_hint: deviceHint ?? null,
      last_seen:   new Date().toISOString(),
    },
    { onConflict: 'token' }
  )
}

export async function deleteNotificationToken(token: string) {
  const { uid } = await requireSession()
  const supabase = createClient()
  await supabase
    .from('notification_tokens')
    .delete()
    .eq('user_id', uid)
    .eq('token', token)
}

// ── Preferences ───────────────────────────────────────────────

export async function saveNotificationPreferences(
  prefs: Partial<NotificationPreferences>
): Promise<{ ok: boolean; error?: string }> {
  const { uid } = await requireSession()
  const supabase = createClient()

  const { error } = await supabase.from('notification_preferences').upsert(
    {
      user_id:           uid,
      ...prefs,
      updated_at:        new Date().toISOString(),
    },
    { onConflict: 'user_id' }
  )

  if (error) return { ok: false, error: error.message }
  return { ok: true }
}
