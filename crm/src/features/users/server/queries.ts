import { createClient } from '@/server/supabase'

export async function getUsers(q?: string) {
  const supabase = createClient()

  let query = supabase
    .from('profiles')
    .select('id, email, full_name, created_at, onboarding_completed')
    .order('created_at', { ascending: false })
    .limit(100)

  if (q) {
    query = query.or(`full_name.ilike.%${q}%,email.ilike.%${q}%`)
  }

  const { data: profiles } = await query

  if (!profiles?.length) return []

  const ids = profiles.map((profile) => profile.id)
  const { data: streaks } = await supabase
    .from('user_streaks')
    .select('user_id, current_streak, last_updated')
    .in('user_id', ids)

  const streakMap = Object.fromEntries((streaks ?? []).map((streak) => [streak.user_id, streak]))

  return profiles.map((profile) => ({
    ...profile,
    streak: streakMap[profile.id] ?? null,
  }))
}

export async function getUserDetail(id: string) {
  const supabase = createClient()

  const [
    { data: profile },
    { data: streak },
    { data: badges },
    { data: recentMeals },
    { data: dailyScores },
  ] = await Promise.all([
    supabase.from('profiles').select('*').eq('id', id).single(),
    supabase.from('user_streaks').select('*').eq('user_id', id).single(),
    supabase.from('user_badges').select('badge_slug, earned_at').eq('user_id', id),
    supabase
      .from('meal_logs')
      .select('date, meal_type, rating, note, points')
      .eq('user_id', id)
      .order('date', { ascending: false })
      .limit(30),
    supabase
      .from('daily_scores')
      .select('date, total_points, is_streak_day')
      .eq('user_id', id)
      .order('date', { ascending: false })
      .limit(14),
  ])

  return { profile, streak, badges, recentMeals, dailyScores }
}
