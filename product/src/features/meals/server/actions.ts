'use server'

import { requireSession } from '@/features/auth/server/session'
import { createClient } from '@/server/supabase/server'
import { calculateNewStreak, getBadgesToAward } from '@/features/streaks/lib/streak'
import {
  BadgeSlug,
  MealRating,
  MealType,
  POINTS,
} from '@/shared/types'
import { revalidatePath } from 'next/cache'
import { format } from 'date-fns'

interface SaveMealInput {
  meal_type: MealType
  rating: MealRating
  calories?: number | null
  note?: string | null
  date?: string
}

export async function saveMeal({
  meal_type,
  rating,
  calories,
  note,
  date,
}: SaveMealInput) {
  const { uid } = await requireSession()
  const supabase = createClient()
  const mealDate = date || format(new Date(), 'yyyy-MM-dd')
  const points = POINTS[rating]

  const { error } = await supabase.from('meal_logs').upsert(
    {
      user_id: uid,
      date: mealDate,
      meal_type,
      rating,
      calories: calories || null,
      note: note || null,
      points,
      updated_at: new Date().toISOString(),
    },
    { onConflict: 'user_id,date,meal_type' }
  )

  if (error) return { error: error.message }

  await recomputeDailyScore(uid, mealDate)
  revalidatePath('/dashboard')
  revalidatePath('/history')
  return { success: true }
}

async function recomputeDailyScore(userId: string, date: string) {
  const supabase = createClient()
  const { data: meals } = await supabase
    .from('meal_logs')
    .select('points')
    .eq('user_id', userId)
    .eq('date', date)

  if (!meals) return

  const totalPoints = meals.reduce((sum, meal) => sum + (meal.points || 0), 0)
  const mealsLogged = meals.length
  const isStreakDay = totalPoints >= 6

  await supabase.from('daily_scores').upsert(
    {
      user_id: userId,
      date,
      total_points: totalPoints,
      meals_logged: mealsLogged,
      is_streak_day: isStreakDay,
      updated_at: new Date().toISOString(),
    },
    { onConflict: 'user_id,date' }
  )

  const today = format(new Date(), 'yyyy-MM-dd')
  if (date === today) {
    await updateStreak(userId, date, totalPoints)
  }
}

async function updateStreak(userId: string, date: string, totalPoints: number) {
  const supabase = createClient()
  const { data: streakData } = await supabase
    .from('user_streaks')
    .select('*')
    .eq('user_id', userId)
    .single()

  if (!streakData || streakData.last_updated === date) return

  const newStreak = calculateNewStreak(streakData, totalPoints, date)

  await supabase
    .from('user_streaks')
    .update({ ...newStreak, updated_at: new Date().toISOString() })
    .eq('user_id', userId)

  const { data: earnedBadges } = await supabase
    .from('user_badges')
    .select('badge_slug')
    .eq('user_id', userId)

  const alreadyEarned = (earnedBadges || []).map((badge) => badge.badge_slug as BadgeSlug)

  const { count } = await supabase
    .from('meal_logs')
    .select('*', { count: 'exact', head: true })
    .eq('user_id', userId)

  const isFirstMeal = (count || 0) <= 1
  const isPerfectDay = totalPoints === 9

  const newBadges = getBadgesToAward(
    newStreak.current_streak,
    alreadyEarned,
    isPerfectDay,
    isFirstMeal
  )

  if (newBadges.length > 0) {
    await supabase.from('user_badges').insert(
      newBadges.map((slug) => ({ user_id: userId, badge_slug: slug }))
    )
  }

  revalidatePath('/badges')
}
