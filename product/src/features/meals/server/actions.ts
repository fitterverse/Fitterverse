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
  const { data: existing } = await supabase
    .from('user_streaks')
    .select('*')
    .eq('user_id', userId)
    .single()

  const isGoodDay = totalPoints >= 6

  // Provide zero-state defaults for first-time users (no row yet)
  const streakData = existing ?? {
    user_id: userId,
    current_streak: 0,
    longest_streak: 0,
    consecutive_bad_days: 0,
    last_updated: null as unknown as string,
    streak_start_date: null,
  }

  const alreadyUpdatedToday = streakData.last_updated === date

  if (alreadyUpdatedToday) {
    // Only re-evaluate when today flips from bad → good (more meals logged)
    const todayWasBad = streakData.consecutive_bad_days > 0
    if (!todayWasBad || !isGoodDay) return

    // Roll back the bad-day increment that was recorded earlier today, then apply as good day
    const preToday = {
      ...streakData,
      consecutive_bad_days: Math.max(0, streakData.consecutive_bad_days - 1),
      last_updated: null as unknown as string,
    }
    const newStreak = calculateNewStreak(preToday, totalPoints, date)
    await supabase.from('user_streaks').upsert(
      { ...newStreak, user_id: userId, updated_at: new Date().toISOString() },
      { onConflict: 'user_id' }
    )
    return
  }

  const newStreak = calculateNewStreak(streakData, totalPoints, date)

  // upsert handles both new users (INSERT) and existing users (UPDATE)
  await supabase.from('user_streaks').upsert(
    { ...newStreak, user_id: userId, updated_at: new Date().toISOString() },
    { onConflict: 'user_id' }
  )

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
