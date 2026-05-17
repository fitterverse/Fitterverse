// Protected cron endpoint — called by GitHub Actions at 4 IST time slots.
// Requires Authorization: Bearer {CRON_SECRET} header.
//
// Query param:  ?slot=morning | lunch | workout | evening
//
// Slot → IST time → UTC cron:
//   morning  → 09:00 IST → 03:30 UTC
//   lunch    → 13:00 IST → 07:30 UTC
//   workout  → 18:00 IST → 12:30 UTC
//   evening  → 20:00 IST → 14:30 UTC

import { type NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/server/supabase/server'
import { adminMessaging } from '@/lib/firebase/admin'
import { getDailyQuote, NOTIFICATION_TEMPLATES, SLOT_INTENSITIES } from '@/features/notifications/lib/constants'
import type { MulticastMessage } from 'firebase-admin/messaging'

const VALID_SLOTS = ['morning', 'lunch', 'workout', 'evening'] as const
type Slot = (typeof VALID_SLOTS)[number]

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

export async function POST(req: NextRequest) {
  // Auth check
  const auth = req.headers.get('authorization') ?? ''
  if (!process.env.CRON_SECRET || auth !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const slot = req.nextUrl.searchParams.get('slot') as Slot | null
  if (!slot || !VALID_SLOTS.includes(slot)) {
    return NextResponse.json({ error: 'Invalid slot' }, { status: 400 })
  }

  const supabase = createClient()
  const allowedIntensities = SLOT_INTENSITIES[slot]

  // Which category filter applies to this slot?
  const categoryFilter = slotToCategoryFilter(slot)

  // Fetch users who should receive this slot's notification
  let query = supabase
    .from('notification_preferences')
    .select('user_id, intensity, streak_alerts, meal_reminders, workout_reminders, motivation_quotes')
    .eq('enabled', true)
    .in('intensity', allowedIntensities)

  if (categoryFilter) {
    query = query.eq(categoryFilter, true)
  }

  const { data: prefs, error: prefErr } = await query
  if (prefErr) return NextResponse.json({ error: prefErr.message }, { status: 500 })
  if (!prefs?.length) return NextResponse.json({ sent: 0 })

  const userIds = prefs.map((p) => p.user_id)

  // Fetch streak data for evening slot (used in title)
  const streakMap = new Map<string, number>()
  if (slot === 'evening') {
    const { data: streaks } = await supabase
      .from('user_streaks')
      .select('user_id, current_streak')
      .in('user_id', userIds)
    streaks?.forEach((s) => streakMap.set(s.user_id, s.current_streak ?? 0))
  }

  // Fetch all FCM tokens for these users
  const { data: tokenRows, error: tokErr } = await supabase
    .from('notification_tokens')
    .select('user_id, token')
    .in('user_id', userIds)
  if (tokErr) return NextResponse.json({ error: tokErr.message }, { status: 500 })
  if (!tokenRows?.length) return NextResponse.json({ sent: 0 })

  // Build per-token messages
  const { title, body, url } = buildPayload(slot, streakMap, tokenRows[0]?.user_id ?? '')

  const tokens = tokenRows.map((r) => r.token)
  const BATCH = 500 // FCM multicast limit

  let sentCount = 0
  const invalidTokens: string[] = []

  for (let i = 0; i < tokens.length; i += BATCH) {
    const batch = tokens.slice(i, i + BATCH)

    const message: MulticastMessage = {
      tokens: batch,
      notification: { title, body },
      webpush: {
        notification: {
          icon:  '/favicons/pwa-192.svg',
          badge: '/favicons/favicon-32.svg',
          data:  { url },
        },
        fcmOptions: { link: `https://fitterverse.in${url}` },
      },
      data: { type: slot, url },
    }

    const result = await adminMessaging.sendEachForMulticast(message)
    sentCount += result.successCount

    // Collect stale tokens for cleanup
    result.responses.forEach((resp, idx) => {
      if (!resp.success) {
        const code = resp.error?.code ?? ''
        if (
          code === 'messaging/registration-token-not-registered' ||
          code === 'messaging/invalid-registration-token'
        ) {
          invalidTokens.push(batch[idx])
        }
      }
    })
  }

  // Prune stale tokens in the background — don't block the response
  if (invalidTokens.length) {
    supabase
      .from('notification_tokens')
      .delete()
      .in('token', invalidTokens)
      .then(() => {})
  }

  return NextResponse.json({ sent: sentCount, pruned: invalidTokens.length })
}

// ── Helpers ───────────────────────────────────────────────────

function slotToCategoryFilter(slot: Slot): string | null {
  switch (slot) {
    case 'morning':  return 'motivation_quotes'
    case 'lunch':    return 'meal_reminders'
    case 'workout':  return 'workout_reminders'
    case 'evening':  return null // streak_alerts OR meal_reminders — both valid
  }
}

function buildPayload(
  slot: Slot,
  streakMap: Map<string, number>,
  representativeUserId: string
): { title: string; body: string; url: string } {
  switch (slot) {
    case 'morning': {
      const t = NOTIFICATION_TEMPLATES.morning
      return { title: t.title, body: t.body(getDailyQuote()), url: t.url }
    }
    case 'lunch': {
      const t = NOTIFICATION_TEMPLATES.lunch
      return { title: t.title, body: t.body(), url: t.url }
    }
    case 'workout': {
      const t = NOTIFICATION_TEMPLATES.workout
      return { title: t.title, body: t.body(), url: t.url }
    }
    case 'evening': {
      const streak = streakMap.get(representativeUserId) ?? 0
      if (streak > 0) {
        const t = NOTIFICATION_TEMPLATES.evening_streak
        return { title: t.title(streak), body: t.body(), url: t.url }
      }
      const t = NOTIFICATION_TEMPLATES.evening_default
      return { title: t.title, body: t.body(), url: t.url }
    }
  }
}
