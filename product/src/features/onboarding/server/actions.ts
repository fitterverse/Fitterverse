'use server'

import { requireSessionSafe } from '@/features/auth/server/session'
import { createClient } from '@/server/supabase/server'

export interface OnboardingInput {
  full_name: string
  age: number
  weight_kg: number
  height_cm: number
  goal_weight_kg: number
  activity_level: string
  practices_fasting: boolean
  meals_per_day: number
  breakfast_time: string
  lunch_time: string
  dinner_time: string
  calorie_limit_per_meal: number
  dietary_restrictions: string
  diet_goal: string
  biggest_challenge: string
  motivation: string
}

export async function saveOnboarding(data: OnboardingInput) {
  const session = await requireSessionSafe()
  if (!session) return { error: 'Session expired. Please log in again.' }

  const supabase = createClient()
  const { error } = await supabase.from('profiles').upsert({
    id: session.uid,
    ...data,
    onboarding_completed: true,
    updated_at: new Date().toISOString(),
  })

  if (error) return { error: error.message }
  return { success: true }
}
