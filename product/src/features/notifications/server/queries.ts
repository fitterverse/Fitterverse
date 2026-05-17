'use server'

import { requireSession } from '@/features/auth/server/session'
import { createClient } from '@/server/supabase/server'
import type { IntensityKey } from '../lib/constants'

export type NotificationPreferences = {
  enabled: boolean
  intensity: IntensityKey
  meal_reminders: boolean
  workout_reminders: boolean
  motivation_quotes: boolean
  streak_alerts: boolean
  quiet_start: string
  quiet_end: string
  timezone: string
}

const DEFAULTS: NotificationPreferences = {
  enabled:           false,
  intensity:         'standard',
  meal_reminders:    true,
  workout_reminders: true,
  motivation_quotes: true,
  streak_alerts:     true,
  quiet_start:       '22:00',
  quiet_end:         '07:00',
  timezone:          'Asia/Kolkata',
}

export async function getNotificationPreferences(): Promise<NotificationPreferences> {
  const { uid } = await requireSession()
  const supabase = createClient()
  const { data } = await supabase
    .from('notification_preferences')
    .select('*')
    .eq('user_id', uid)
    .single()

  if (!data) return DEFAULTS

  return {
    enabled:           data.enabled          ?? DEFAULTS.enabled,
    intensity:         (data.intensity       ?? DEFAULTS.intensity) as IntensityKey,
    meal_reminders:    data.meal_reminders   ?? DEFAULTS.meal_reminders,
    workout_reminders: data.workout_reminders ?? DEFAULTS.workout_reminders,
    motivation_quotes: data.motivation_quotes ?? DEFAULTS.motivation_quotes,
    streak_alerts:     data.streak_alerts    ?? DEFAULTS.streak_alerts,
    quiet_start:       data.quiet_start      ?? DEFAULTS.quiet_start,
    quiet_end:         data.quiet_end        ?? DEFAULTS.quiet_end,
    timezone:          data.timezone         ?? DEFAULTS.timezone,
  }
}
