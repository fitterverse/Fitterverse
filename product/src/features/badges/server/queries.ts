'use server'

import { requireSession } from '@/features/auth/server/session'
import { createClient } from '@/server/supabase/server'
import { BADGE_DEFINITIONS } from '@/shared/types'

export async function getBadgesData() {
  const { uid } = await requireSession()
  const supabase = createClient()

  const [earnedResult, streakResult] = await Promise.all([
    supabase
      .from('user_badges')
      .select('*')
      .eq('user_id', uid)
      .order('earned_at', { ascending: true }),
    supabase.from('user_streaks').select('*').eq('user_id', uid).single(),
  ])

  return {
    earned: earnedResult.data || [],
    streak: streakResult.data,
    definitions: BADGE_DEFINITIONS,
  }
}
