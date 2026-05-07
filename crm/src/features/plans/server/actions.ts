'use server'

import { createClient } from '@/server/supabase'
import { getSession } from '@/server/session'
import { revalidatePath } from 'next/cache'

type MealSlot = 'breakfast' | 'morning_snack' | 'lunch' | 'afternoon_snack' | 'dinner' | 'evening_snack'

export interface SaveMealPlanInput {
  userId: string
  title: string
  weekStart: string // 'yyyy-MM-dd'
  status: 'draft' | 'published'
  items: Array<{
    day_of_week: number
    meal_slot: MealSlot
    food_item_id: number
    food_name: string
    quantity_g: number
    energy_kcal: number | null
    protein_g: number | null
    fat_g: number | null
    carbs_g: number | null
    fiber_g: number | null
    display_order: number
  }>
}

export async function saveMealPlanAction(input: SaveMealPlanInput) {
  const session = await getSession()
  if (!session) throw new Error('Unauthorized')

  const supabase = createClient()

  const { data: plan, error: planError } = await supabase
    .from('meal_plans')
    .insert({
      user_id: input.userId,
      created_by: session.id,
      title: input.title,
      week_start: input.weekStart,
      status: input.status,
    })
    .select('id')
    .single()

  if (planError || !plan) throw new Error(planError?.message ?? 'Failed to create plan')

  if (input.items.length > 0) {
    const { error: itemsError } = await supabase
      .from('meal_plan_items')
      .insert(input.items.map(item => ({ ...item, meal_plan_id: plan.id })))

    if (itemsError) throw new Error(itemsError.message)
  }

  revalidatePath(`/users/${input.userId}`)
}

// ── Update meal plan (edit mode) ──────────────────────────────────

export interface UpdateMealPlanInput extends SaveMealPlanInput {
  planId: string
  editableDays: number[]  // day_of_week values that are today or future
}

export async function updateMealPlanAction(input: UpdateMealPlanInput) {
  const session = await getSession()
  if (!session) throw new Error('Unauthorized')

  const supabase = createClient()

  // Update plan header
  const { error: planError } = await supabase
    .from('meal_plans')
    .update({ title: input.title, status: input.status, updated_at: new Date().toISOString() })
    .eq('id', input.planId)

  if (planError) throw new Error(planError.message)

  if (input.editableDays.length > 0) {
    // Delete existing items for editable days only
    const { error: delError } = await supabase
      .from('meal_plan_items')
      .delete()
      .eq('meal_plan_id', input.planId)
      .in('day_of_week', input.editableDays)

    if (delError) throw new Error(delError.message)

    // Re-insert items for editable days
    const newItems = input.items.filter(i => input.editableDays.includes(i.day_of_week))
    if (newItems.length > 0) {
      const { error: insError } = await supabase
        .from('meal_plan_items')
        .insert(newItems.map(item => ({ ...item, meal_plan_id: input.planId })))
      if (insError) throw new Error(insError.message)
    }
  }

  revalidatePath(`/users/${input.userId}`)
}

// ── Workout plan ──────────────────────────────────────────────────

export interface SaveWorkoutPlanInput {
  userId: string
  title: string
  weekStart: string
  status: 'draft' | 'published'
  days: Array<{
    day_of_week: number
    label: string
    is_rest_day: boolean
    exercises: Array<{
      exercise_name: string
      sets: number | null
      reps: string | null
      duration_minutes: number | null
      rest_seconds: number | null
      notes: string | null
      display_order: number
    }>
  }>
}

export async function saveWorkoutPlanAction(input: SaveWorkoutPlanInput) {
  const session = await getSession()
  if (!session) throw new Error('Unauthorized')

  const supabase = createClient()

  const { data: plan, error: planError } = await supabase
    .from('workout_plans')
    .insert({
      user_id: input.userId,
      created_by: session.id,
      title: input.title,
      week_start: input.weekStart,
      status: input.status,
    })
    .select('id')
    .single()

  if (planError || !plan) throw new Error(planError?.message ?? 'Failed to create workout plan')

  for (const day of input.days) {
    const { data: dayRow, error: dayError } = await supabase
      .from('workout_plan_days')
      .insert({
        workout_plan_id: plan.id,
        day_of_week: day.day_of_week,
        label: day.label || null,
        is_rest_day: day.is_rest_day,
        display_order: day.day_of_week,
      })
      .select('id')
      .single()

    if (dayError || !dayRow) throw new Error(dayError?.message ?? 'Failed to create day')

    if (!day.is_rest_day && day.exercises.length > 0) {
      const { error: exError } = await supabase
        .from('workout_plan_exercises')
        .insert(day.exercises.map(ex => ({ ...ex, workout_plan_day_id: dayRow.id })))

      if (exError) throw new Error(exError.message)
    }
  }

  revalidatePath(`/users/${input.userId}`)
}

// ── Update workout plan (edit mode) ──────────────────────────────

export interface UpdateWorkoutPlanInput extends SaveWorkoutPlanInput {
  planId: string
  editableDays: number[]
}

export async function updateWorkoutPlanAction(input: UpdateWorkoutPlanInput) {
  const session = await getSession()
  if (!session) throw new Error('Unauthorized')

  const supabase = createClient()

  const { error: planError } = await supabase
    .from('workout_plans')
    .update({ title: input.title, status: input.status, updated_at: new Date().toISOString() })
    .eq('id', input.planId)

  if (planError) throw new Error(planError.message)

  const { data: existingDays } = await supabase
    .from('workout_plan_days')
    .select('id, day_of_week')
    .eq('workout_plan_id', input.planId)
    .in('day_of_week', input.editableDays)

  if (existingDays?.length) {
    const ids = existingDays.map(d => d.id)
    await supabase.from('workout_plan_exercises').delete().in('workout_plan_day_id', ids)
    await supabase.from('workout_plan_days').delete().in('id', ids)
  }

  for (const day of input.days.filter(d => input.editableDays.includes(d.day_of_week))) {
    const { data: dayRow, error: dayError } = await supabase
      .from('workout_plan_days')
      .insert({ workout_plan_id: input.planId, day_of_week: day.day_of_week, label: day.label || null, is_rest_day: day.is_rest_day, display_order: day.day_of_week })
      .select('id').single()

    if (dayError || !dayRow) throw new Error(dayError?.message ?? 'Failed to update day')

    if (!day.is_rest_day && day.exercises.length > 0) {
      const { error: exError } = await supabase
        .from('workout_plan_exercises')
        .insert(day.exercises.map(ex => ({ ...ex, workout_plan_day_id: dayRow.id })))
      if (exError) throw new Error(exError.message)
    }
  }

  revalidatePath(`/users/${input.userId}`)
}
