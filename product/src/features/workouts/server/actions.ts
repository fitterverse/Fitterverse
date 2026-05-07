'use server'

import { requireSession } from '@/features/auth/server/session'
import { createClient } from '@/server/supabase/server'
import { revalidatePath } from 'next/cache'
import { format } from 'date-fns'
import type { WorkoutType, WorkoutIntensity } from '@/shared/types'
import { calculateCaloriesBurned } from '@/features/workouts/lib/calorie-math'

interface SaveWorkoutInput {
  workout_type: WorkoutType
  intensity: WorkoutIntensity
  duration_minutes: number
  notes?: string | null
  date?: string
}

export async function saveWorkout(input: SaveWorkoutInput) {
  const { uid } = await requireSession()
  const supabase = createClient()
  const workoutDate = input.date || format(new Date(), 'yyyy-MM-dd')

  const { data: profileData } = await supabase
    .from('profiles')
    .select('weight_kg')
    .eq('id', uid)
    .single()

  const weight = profileData?.weight_kg ?? 70

  const calories_burned = calculateCaloriesBurned(
    input.workout_type,
    input.intensity,
    input.duration_minutes,
    Number(weight)
  )

  const { error } = await supabase.from('workout_logs').insert({
    user_id: uid,
    date: workoutDate,
    workout_type: input.workout_type,
    intensity: input.intensity,
    duration_minutes: input.duration_minutes,
    calories_burned,
    notes: input.notes || null,
  })

  if (error) return { error: error.message }

  revalidatePath('/workout')
  revalidatePath('/dashboard')
  return { success: true, calories_burned }
}

export async function deleteWorkout(id: string) {
  const { uid } = await requireSession()
  const supabase = createClient()

  const { error } = await supabase
    .from('workout_logs')
    .delete()
    .eq('id', id)
    .eq('user_id', uid)

  if (error) return { error: error.message }

  revalidatePath('/workout')
  revalidatePath('/dashboard')
  return { success: true }
}
