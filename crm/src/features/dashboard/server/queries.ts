import { createClient } from '@/server/supabase'
import { format } from 'date-fns'

export async function getDashboardStats() {
  const supabase = createClient()
  const today = format(new Date(), 'yyyy-MM-dd')

  const [
    { count: totalUsers },
    { count: activeToday },
    { count: totalMeals },
    { data: topStreaks },
  ] = await Promise.all([
    supabase.from('profiles').select('*', { count: 'exact', head: true }),
    supabase.from('daily_scores').select('*', { count: 'exact', head: true }).eq('date', today),
    supabase.from('meal_logs').select('*', { count: 'exact', head: true }),
    supabase
      .from('user_streaks')
      .select('user_id, current_streak')
      .order('current_streak', { ascending: false })
      .limit(5),
  ])

  return {
    totalUsers: totalUsers ?? 0,
    activeToday: activeToday ?? 0,
    totalMeals: totalMeals ?? 0,
    topStreaks: topStreaks ?? [],
  }
}
