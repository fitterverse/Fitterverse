import { eachDayOfInterval, format, parseISO } from 'date-fns'
import { createClient } from '@/server/supabase/server'
import type { BadgeSlug, DailyNutritionSummary, JournalEntry, JournalEntryAnalysis, UserStreak } from '@/shared/types'
import { getBadgesToAward } from '@/features/streaks/lib/streak'
import { JOURNAL_STREAK_THRESHOLD } from '@/features/journal/lib/constants'

export async function recomputeJournalDay(userId: string, date: string) {
  const supabase = createClient()
  const { data: entries } = await supabase
    .from('journal_entries')
    .select('*')
    .eq('user_id', userId)
    .eq('logged_for_date', date)
    .eq('status', 'ready')
    .is('deleted_at', null)
    .order('logged_at', { ascending: false })

  const typedEntries = (entries ?? []) as JournalEntry[]
  const analysisIds = typedEntries
    .map((entry) => entry.latest_analysis_id)
    .filter((value): value is string => Boolean(value))

  const { data: analyses } = analysisIds.length
    ? await supabase
        .from('journal_entry_analyses')
        .select('*')
        .in('id', analysisIds)
    : { data: [] as JournalEntryAnalysis[] }

  const summary = summarizeEntries(date, typedEntries, (analyses ?? []) as JournalEntryAnalysis[])

  await supabase.from('daily_nutrition_summaries').upsert(
    {
      user_id: userId,
      date,
      food_calories: summary.food_calories,
      exercise_calories: summary.exercise_calories,
      carbs_g: summary.carbs_g,
      protein_g: summary.protein_g,
      fat_g: summary.fat_g,
      entry_count: summary.entry_count,
      food_entry_count: summary.food_entry_count,
      workout_entry_count: summary.workout_entry_count,
      updated_at: new Date().toISOString(),
    },
    { onConflict: 'user_id,date' }
  )

  const totalPoints = calculateJournalPoints(summary)

  await supabase.from('daily_scores').upsert(
    {
      user_id: userId,
      date,
      total_points: totalPoints,
      meals_logged: summary.food_entry_count,
      is_streak_day: totalPoints >= JOURNAL_STREAK_THRESHOLD,
      updated_at: new Date().toISOString(),
    },
    { onConflict: 'user_id,date' }
  )

  const streak = await recomputeUserStreak(userId)
  await awardJournalBadges(userId, totalPoints, summary.entry_count > 0, streak.current_streak)

  return {
    summary,
    totalPoints,
    streak,
  }
}

export function calculateJournalPoints(summary: Pick<DailyNutritionSummary, 'food_entry_count' | 'workout_entry_count'>) {
  return (
    (summary.food_entry_count >= 1 ? 3 : 0) +
    (summary.food_entry_count >= 2 ? 2 : 0) +
    (summary.workout_entry_count >= 1 ? 3 : 0) +
    (summary.food_entry_count >= 1 && summary.workout_entry_count >= 1 ? 1 : 0)
  )
}

export async function recomputeUserStreak(userId: string): Promise<UserStreak> {
  const supabase = createClient()
  const { data: scores } = await supabase
    .from('daily_scores')
    .select('date,total_points')
    .eq('user_id', userId)
    .order('date', { ascending: true })

  const typedScores = (scores ?? []) as Array<{ date: string; total_points: number | null }>

  if (!typedScores.length) {
    const empty: UserStreak = {
      user_id: userId,
      current_streak: 0,
      longest_streak: 0,
      consecutive_bad_days: 0,
      last_updated: null,
      streak_start_date: null,
    }

    await supabase.from('user_streaks').upsert(
      { ...empty, updated_at: new Date().toISOString() },
      { onConflict: 'user_id' }
    )

    return empty
  }

  const today = format(new Date(), 'yyyy-MM-dd')
  const scoreMap = new Map(
    typedScores.map((score) => [score.date, score.total_points ?? 0] as const)
  )
  const firstDate = typedScores[0]!.date
  const days = eachDayOfInterval({
    start: parseISO(firstDate),
    end: parseISO(today),
  })

  let currentStreak = 0
  let longestStreak = 0
  let consecutiveBadDays = 0
  let streakStartDate: string | null = null

  for (const day of days) {
    const date = format(day, 'yyyy-MM-dd')
    const totalPoints = scoreMap.get(date) ?? 0

    if (totalPoints >= JOURNAL_STREAK_THRESHOLD) {
      currentStreak += 1
      longestStreak = Math.max(longestStreak, currentStreak)
      consecutiveBadDays = 0
      if (!streakStartDate) streakStartDate = date
    } else {
      consecutiveBadDays += 1
      if (consecutiveBadDays >= 3) {
        currentStreak = 0
        consecutiveBadDays = 0
        streakStartDate = null
      }
    }
  }

  const streak: UserStreak = {
    user_id: userId,
    current_streak: currentStreak,
    longest_streak: longestStreak,
    consecutive_bad_days: consecutiveBadDays,
    last_updated: today,
    streak_start_date: streakStartDate,
  }

  await supabase.from('user_streaks').upsert(
    { ...streak, updated_at: new Date().toISOString() },
    { onConflict: 'user_id' }
  )

  return streak
}

export function summarizeEntries(
  date: string,
  entries: JournalEntry[],
  analyses: JournalEntryAnalysis[]
): DailyNutritionSummary {
  const analysisMap = new Map(analyses.map((analysis) => [analysis.id, analysis]))
  const readyEntries = entries.filter((entry) => entry.status === 'ready' && !entry.deleted_at)

  const summary = readyEntries.reduce(
    (acc, entry) => {
      const analysis = entry.latest_analysis_id
        ? analysisMap.get(entry.latest_analysis_id)
        : null

      if (entry.entry_type === 'food') {
        acc.food_calories += Math.round(analysis?.calories ?? 0)
        acc.carbs_g += Number(analysis?.carbs_g ?? 0)
        acc.protein_g += Number(analysis?.protein_g ?? 0)
        acc.fat_g += Number(analysis?.fat_g ?? 0)
        acc.food_entry_count += 1
      } else if (entry.entry_type === 'workout') {
        acc.exercise_calories += Math.round(analysis?.calories ?? 0)
        acc.workout_entry_count += 1
      }

      acc.entry_count += 1
      return acc
    },
    {
      user_id: readyEntries[0]?.user_id ?? '',
      date,
      food_calories: 0,
      exercise_calories: 0,
      carbs_g: 0,
      protein_g: 0,
      fat_g: 0,
      entry_count: 0,
      food_entry_count: 0,
      workout_entry_count: 0,
      updated_at: new Date().toISOString(),
    } satisfies DailyNutritionSummary
  )

  summary.carbs_g = roundNumber(summary.carbs_g)
  summary.protein_g = roundNumber(summary.protein_g)
  summary.fat_g = roundNumber(summary.fat_g)

  return summary
}

async function awardJournalBadges(
  userId: string,
  totalPoints: number,
  hasAnyEntryToday: boolean,
  currentStreak: number
) {
  const supabase = createClient()

  const { data: earnedBadges } = await supabase
    .from('user_badges')
    .select('badge_slug')
    .eq('user_id', userId)

  const alreadyEarned = (earnedBadges ?? []).map(
    (badge) => badge.badge_slug as BadgeSlug
  )

  const { count } = await supabase
    .from('journal_entries')
    .select('*', { count: 'exact', head: true })
    .eq('user_id', userId)
    .neq('status', 'deleted')

  const newBadges = getBadgesToAward(
    currentStreak,
    alreadyEarned,
    totalPoints >= 9,
    hasAnyEntryToday && (count ?? 0) <= 1
  )

  if (newBadges.length > 0) {
    await supabase.from('user_badges').insert(
      newBadges.map((slug) => ({ user_id: userId, badge_slug: slug }))
    )
  }
}

function roundNumber(value: number) {
  return Math.round(value * 10) / 10
}
