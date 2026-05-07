import { createClient } from '@/server/supabase'

export async function getUserMealPlans(userId: string) {
  const supabase = createClient()
  const { data } = await supabase
    .from('meal_plans')
    .select('id, title, week_start, status, created_at')
    .eq('user_id', userId)
    .order('week_start', { ascending: false })
    .limit(20)
  return data ?? []
}

export async function getUserWorkoutPlans(userId: string) {
  const supabase = createClient()
  const { data } = await supabase
    .from('workout_plans')
    .select('id, title, week_start, status, created_at')
    .eq('user_id', userId)
    .order('week_start', { ascending: false })
    .limit(20)
  return data ?? []
}
