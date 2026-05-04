'use server'

import { requireSession } from '@/features/auth/server/session'
import { createClient } from '@/server/supabase/server'

export async function getHistoryData(days = 30) {
  const { uid } = await requireSession()
  const supabase = createClient()

  const [scoresResult, mealsResult] = await Promise.all([
    supabase
      .from('daily_scores')
      .select('*')
      .eq('user_id', uid)
      .order('date', { ascending: false })
      .limit(days),
    supabase
      .from('meal_logs')
      .select('*')
      .eq('user_id', uid)
      .order('date', { ascending: false })
      .limit(days * 3),
  ])

  return { scores: scoresResult.data || [], meals: mealsResult.data || [] }
}
