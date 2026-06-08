'use server'

import { requireSession } from '@/features/auth/server/session'
import { createClient } from '@/server/supabase/server'

export async function getHistoryData(days = 30) {
  const { uid } = await requireSession()
  const supabase = createClient()

  const [scoresResult, summariesResult] = await Promise.all([
    supabase
      .from('daily_scores')
      .select('*')
      .eq('user_id', uid)
      .order('date', { ascending: false })
      .limit(days),
    supabase
      .from('daily_nutrition_summaries')
      .select('*')
      .eq('user_id', uid)
      .order('date', { ascending: false })
      .limit(days),
  ])

  return { scores: scoresResult.data || [], summaries: summariesResult.data || [] }
}
