'use server'

import { createClient } from '@/lib/supabase/server'
import { getSession, deleteSession } from '@/lib/session'
import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { POINTS, MealType, MealRating, BadgeSlug, BADGE_DEFINITIONS } from '@/types'
import { calculateNewStreak, getBadgesToAward } from '@/lib/streak'
import { format } from 'date-fns'

// ─── Auth ─────────────────────────────────────────────────────
// Sign-in/sign-up happen client-side via Firebase Auth.
// After Firebase auth, the client calls POST /api/auth/session.

export async function signOut() {
  await deleteSession()
  redirect('/login')
}

async function requireSession() {
  const session = await getSession()
  if (!session) redirect('/login')
  return session
}

// ─── Onboarding ───────────────────────────────────────────────

export async function saveOnboarding(data: {
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
}) {
  const { uid } = await requireSession()
  const supabase = createClient()

  const { error } = await supabase
    .from('profiles')
    .upsert({ id: uid, ...data, onboarding_completed: true, updated_at: new Date().toISOString() })

  if (error) return { error: error.message }
  return { success: true }
}

// ─── Meal Logging ─────────────────────────────────────────────

export async function saveMeal({
  meal_type, rating, calories, note, date,
}: {
  meal_type: MealType
  rating: MealRating
  calories?: number | null
  note?: string | null
  date?: string
}) {
  const { uid } = await requireSession()
  const supabase = createClient()
  const mealDate = date || format(new Date(), 'yyyy-MM-dd')
  const points = POINTS[rating]

  const { error } = await supabase
    .from('meal_logs')
    .upsert(
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

  const totalPoints = meals.reduce((sum, m) => sum + (m.points || 0), 0)
  const mealsLogged = meals.length
  const isStreakDay = totalPoints >= 6

  await supabase
    .from('daily_scores')
    .upsert(
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

  // Check for new badges
  const { data: earnedBadges } = await supabase
    .from('user_badges')
    .select('badge_slug')
    .eq('user_id', userId)

  const alreadyEarned = (earnedBadges || []).map(b => b.badge_slug as BadgeSlug)

  const { count } = await supabase
    .from('meal_logs')
    .select('*', { count: 'exact', head: true })
    .eq('user_id', userId)

  const isFirstMeal = (count || 0) <= 1
  const isPerfectDay = totalPoints === 9

  const newBadges = getBadgesToAward(newStreak.current_streak, alreadyEarned, isPerfectDay, isFirstMeal)

  if (newBadges.length > 0) {
    await supabase.from('user_badges').insert(
      newBadges.map(slug => ({ user_id: userId, badge_slug: slug }))
    )
  }

  revalidatePath('/badges')
}

// ─── Data Fetching ────────────────────────────────────────────

export async function getTodayData() {
  const { uid } = await requireSession()
  const supabase = createClient()
  const today = format(new Date(), 'yyyy-MM-dd')

  const [mealsResult, scoreResult, streakResult, recentBadgesResult] = await Promise.all([
    supabase.from('meal_logs').select('*').eq('user_id', uid).eq('date', today),
    supabase.from('daily_scores').select('*').eq('user_id', uid).eq('date', today).single(),
    supabase.from('user_streaks').select('*').eq('user_id', uid).single(),
    supabase.from('user_badges').select('*').eq('user_id', uid).order('earned_at', { ascending: false }).limit(3),
  ])

  return {
    meals: mealsResult.data || [],
    score: scoreResult.data,
    streak: streakResult.data,
    recentBadges: recentBadgesResult.data || [],
    today,
  }
}

export async function getHistoryData(days = 30) {
  const { uid } = await requireSession()
  const supabase = createClient()

  const [scoresResult, mealsResult] = await Promise.all([
    supabase.from('daily_scores').select('*').eq('user_id', uid).order('date', { ascending: false }).limit(days),
    supabase.from('meal_logs').select('*').eq('user_id', uid).order('date', { ascending: false }).limit(days * 3),
  ])

  return { scores: scoresResult.data || [], meals: mealsResult.data || [] }
}

export async function getBadgesData() {
  const { uid } = await requireSession()
  const supabase = createClient()

  const [earnedResult, streakResult] = await Promise.all([
    supabase.from('user_badges').select('*').eq('user_id', uid).order('earned_at', { ascending: true }),
    supabase.from('user_streaks').select('*').eq('user_id', uid).single(),
  ])

  return {
    earned: earnedResult.data || [],
    streak: streakResult.data,
    definitions: BADGE_DEFINITIONS,
  }
}

export async function getProfile() {
  const { uid } = await requireSession()
  const supabase = createClient()
  const { data } = await supabase.from('profiles').select('*').eq('id', uid).single()
  return data
}
