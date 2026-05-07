'use server'

import { requireSession } from '@/features/auth/server/session'
import { createClient } from '@/server/supabase/server'
import { format, subDays } from 'date-fns'
import type { WorkoutLog } from '@/shared/types'

export async function getTodayWorkouts(): Promise<WorkoutLog[]> {
  const { uid } = await requireSession()
  const supabase = createClient()
  const today = format(new Date(), 'yyyy-MM-dd')

  const { data } = await supabase
    .from('workout_logs')
    .select('*')
    .eq('user_id', uid)
    .eq('date', today)
    .order('created_at', { ascending: true })

  return (data as WorkoutLog[]) || []
}

export async function getWorkoutHistory(days = 30): Promise<WorkoutLog[]> {
  const { uid } = await requireSession()
  const supabase = createClient()
  const today = format(new Date(), 'yyyy-MM-dd')
  const from = format(subDays(new Date(), days), 'yyyy-MM-dd')

  const { data } = await supabase
    .from('workout_logs')
    .select('*')
    .eq('user_id', uid)
    .gte('date', from)
    .lte('date', today)
    .order('date', { ascending: false })

  return (data as WorkoutLog[]) || []
}

export async function getTodayCaloriesConsumed(uid: string): Promise<number> {
  const supabase = createClient()
  const today = format(new Date(), 'yyyy-MM-dd')

  const { data } = await supabase
    .from('meal_logs')
    .select('calories')
    .eq('user_id', uid)
    .eq('date', today)

  if (!data) return 0
  return data.reduce((sum, row) => sum + (row.calories ?? 0), 0)
}
