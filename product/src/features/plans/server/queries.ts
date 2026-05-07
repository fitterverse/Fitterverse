import { createClient } from '@/server/supabase/server'
import { getSession } from '@/server/session'
import type { MealPlanItem, WorkoutPlanDay, WorkoutPlanExercise } from '@/shared/types'

export async function getActiveMealPlan() {
  const session = await getSession()
  if (!session) return null

  const supabase = createClient()

  const { data: plan } = await supabase
    .from('meal_plans')
    .select('id, title, week_start, status')
    .eq('user_id', session.uid)
    .eq('status', 'published')
    .order('week_start', { ascending: false })
    .limit(1)
    .single()

  if (!plan) return null

  const { data: items } = await supabase
    .from('meal_plan_items')
    .select('id, day_of_week, meal_slot, food_name, quantity_g, energy_kcal, protein_g, fat_g, carbs_g, fiber_g, display_order')
    .eq('meal_plan_id', plan.id)
    .order('display_order')

  return { plan, items: (items ?? []) as MealPlanItem[] }
}

export async function getActiveWorkoutPlan() {
  const session = await getSession()
  if (!session) return null

  const supabase = createClient()

  const { data: plan } = await supabase
    .from('workout_plans')
    .select('id, title, week_start, status')
    .eq('user_id', session.uid)
    .eq('status', 'published')
    .order('week_start', { ascending: false })
    .limit(1)
    .single()

  if (!plan) return null

  const { data: days } = await supabase
    .from('workout_plan_days')
    .select('id, day_of_week, label, is_rest_day, display_order')
    .eq('workout_plan_id', plan.id)
    .order('day_of_week')

  if (!days?.length) return { plan, days: [] }

  const dayIds = days.map(d => d.id)
  const { data: exercises } = await supabase
    .from('workout_plan_exercises')
    .select('id, workout_plan_day_id, exercise_name, sets, reps, duration_minutes, rest_seconds, notes, display_order')
    .in('workout_plan_day_id', dayIds)
    .order('display_order')

  const exercisesByDay: Record<string, WorkoutPlanExercise[]> = {}
  ;(exercises ?? []).forEach(ex => {
    if (!exercisesByDay[ex.workout_plan_day_id]) exercisesByDay[ex.workout_plan_day_id] = []
    exercisesByDay[ex.workout_plan_day_id]!.push(ex as WorkoutPlanExercise)
  })

  return {
    plan,
    days: (days as WorkoutPlanDay[]).map(d => ({
      ...d,
      exercises: exercisesByDay[d.id] ?? [],
    })),
  }
}
