'use server'

import { requireSession } from '@/features/auth/server/session'
import { createClient } from '@/server/supabase/server'
import { format } from 'date-fns'

export async function getTodayData() {
  const { uid } = await requireSession()
  const supabase = createClient()
  const today = format(new Date(), 'yyyy-MM-dd')

  const [mealsResult, scoreResult, streakResult, recentBadgesResult] = await Promise.all([
    supabase.from('meal_logs').select('*').eq('user_id', uid).eq('date', today),
    supabase.from('daily_scores').select('*').eq('user_id', uid).eq('date', today).single(),
    supabase.from('user_streaks').select('*').eq('user_id', uid).single(),
    supabase
      .from('user_badges')
      .select('*')
      .eq('user_id', uid)
      .order('earned_at', { ascending: false })
      .limit(3),
  ])

  return {
    meals: mealsResult.data || [],
    score: scoreResult.data,
    streak: streakResult.data,
    recentBadges: recentBadgesResult.data || [],
    today,
  }
}
