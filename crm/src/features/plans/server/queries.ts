import { createClient } from '@/server/supabase'

export async function getMealPlanWithItems(planId: string) {
  const supabase = createClient()
  const { data: plan } = await supabase
    .from('meal_plans')
    .select('id, user_id, title, week_start, status, notes')
    .eq('id', planId)
    .single()
  if (!plan) return null
  const { data: items } = await supabase
    .from('meal_plan_items')
    .select('*')
    .eq('meal_plan_id', planId)
    .order('display_order')
  return { plan, items: items ?? [] }
}

export async function getWorkoutPlanWithDays(planId: string) {
  const supabase = createClient()
  const { data: plan } = await supabase
    .from('workout_plans')
    .select('id, user_id, title, week_start, status, notes')
    .eq('id', planId)
    .single()
  if (!plan) return null
  const { data: days } = await supabase
    .from('workout_plan_days')
    .select('id, day_of_week, label, is_rest_day, display_order')
    .eq('workout_plan_id', planId)
    .order('day_of_week')
  if (!days?.length) return { plan, days: [] }
  const dayIds = days.map(d => d.id)
  const { data: exercises } = await supabase
    .from('workout_plan_exercises')
    .select('id, workout_plan_day_id, exercise_name, sets, reps, duration_minutes, rest_seconds, notes, display_order')
    .in('workout_plan_day_id', dayIds)
    .order('display_order')
  const exByDay: Record<string, typeof exercises> = {}
  ;(exercises ?? []).forEach(ex => {
    if (!exByDay[ex.workout_plan_day_id]) exByDay[ex.workout_plan_day_id] = []
    exByDay[ex.workout_plan_day_id]!.push(ex)
  })
  return { plan, days: days.map(d => ({ ...d, exercises: exByDay[d.id] ?? [] })) }
}

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
