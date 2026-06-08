import { format } from 'date-fns'
import { requireSession } from '@/features/auth/server/session'
import { createClient } from '@/server/supabase/server'
import { getMonthWindow, getWeekBounds, getWeekStrip, normalizeDateParam } from '@/features/journal/lib/date'
import { getNutritionTargets } from '@/features/journal/lib/targets'
import { calculateJournalPoints, recomputeUserStreak } from '@/features/journal/server/recompute'
import type {
  DailyNutritionSummary,
  JournalEntry,
  JournalEntryAnalysis,
  JournalFeedItem,
  Profile,
} from '@/shared/types'

export async function getJournalDayData(date?: string | null) {
  const session = await requireSession()
  const supabase = createClient()
  const selectedDate = normalizeDateParam(date)
  const { monthStart, monthEnd } = getMonthWindow(selectedDate)
  const weekStrip = getWeekStrip(selectedDate)

  const [entriesResult, summaryResult, profileResult, streak] = await Promise.all([
    supabase
      .from('journal_entries')
      .select('*')
      .eq('user_id', session.uid)
      .eq('logged_for_date', selectedDate)
      .eq('status', 'ready')
      .order('logged_at', { ascending: false }),
    supabase
      .from('daily_nutrition_summaries')
      .select('*')
      .eq('user_id', session.uid)
      .eq('date', selectedDate)
      .maybeSingle(),
    supabase
      .from('profiles')
      .select('full_name, weight_kg, height_cm, age, activity_level')
      .eq('id', session.uid)
      .maybeSingle(),
    recomputeUserStreak(session.uid),
  ])

  const entries = (entriesResult.data ?? []) as JournalEntry[]
  const analysisIds = entries
    .map((entry) => entry.latest_analysis_id)
    .filter((value): value is string => Boolean(value))

  const [analysesResult, monthEntriesResult, stripEntriesResult] = await Promise.all([
    analysisIds.length
      ? supabase
          .from('journal_entry_analyses')
          .select('*')
          .in('id', analysisIds)
      : Promise.resolve({ data: [] as JournalEntryAnalysis[] }),
    supabase
      .from('journal_entries')
      .select('logged_for_date')
      .eq('user_id', session.uid)
      .gte('logged_for_date', format(monthStart, 'yyyy-MM-dd'))
      .lte('logged_for_date', format(monthEnd, 'yyyy-MM-dd'))
      .eq('status', 'ready'),
    supabase
      .from('journal_entries')
      .select('logged_for_date')
      .eq('user_id', session.uid)
      .gte('logged_for_date', format(weekStrip[0]!, 'yyyy-MM-dd'))
      .lte('logged_for_date', format(weekStrip[weekStrip.length - 1]!, 'yyyy-MM-dd'))
      .eq('status', 'ready'),
  ])

  const profile = (profileResult.data ?? null) as Partial<Profile> | null
  const targets = getNutritionTargets(profile)
  const summary = ((summaryResult.data as DailyNutritionSummary | null) ?? emptySummary(session.uid, selectedDate))
  const feed = mapFeed(entries, (analysesResult.data ?? []) as JournalEntryAnalysis[])

  return {
    selectedDate,
    profile,
    targets,
    streak,
    summary,
    totalPoints: calculateJournalPoints(summary),
    remainingCalories: targets.calorie_target - summary.food_calories + summary.exercise_calories,
    feed,
    monthLoggedDates: dedupeDates(monthEntriesResult.data ?? []),
    stripLoggedDates: dedupeDates(stripEntriesResult.data ?? []),
  }
}

export async function getJournalEntryDetail(id: string) {
  const session = await requireSession()
  const supabase = createClient()

  const { data: entry } = await supabase
    .from('journal_entries')
    .select('*')
    .eq('id', id)
    .eq('user_id', session.uid)
    .maybeSingle()

  if (!entry) return null

  const { data: analysis } = entry.latest_analysis_id
    ? await supabase
        .from('journal_entry_analyses')
        .select('*')
        .eq('id', entry.latest_analysis_id)
        .maybeSingle()
    : { data: null }

  return {
    entry: entry as JournalEntry,
    analysis: (analysis ?? null) as JournalEntryAnalysis | null,
  }
}

export async function getStreakPageData() {
  const session = await requireSession()
  const supabase = createClient()
  const streak = await recomputeUserStreak(session.uid)
  const { start, end } = getWeekBounds(format(new Date(), 'yyyy-MM-dd'))

  const [profileResult, summaryRowsResult, scoreRowsResult] = await Promise.all([
    supabase
      .from('profiles')
      .select('full_name, weight_kg, height_cm, age, activity_level')
      .eq('id', session.uid)
      .maybeSingle(),
    supabase
      .from('daily_nutrition_summaries')
      .select('*')
      .eq('user_id', session.uid)
      .gte('date', format(start, 'yyyy-MM-dd'))
      .lte('date', format(end, 'yyyy-MM-dd'))
      .order('date', { ascending: true }),
    supabase
      .from('daily_scores')
      .select('*')
      .eq('user_id', session.uid)
      .gte('date', format(start, 'yyyy-MM-dd'))
      .lte('date', format(end, 'yyyy-MM-dd'))
      .order('date', { ascending: true }),
  ])

  const profile = (profileResult.data ?? null) as Partial<Profile> | null
  const targets = getNutritionTargets(profile)
  const weekScores = (scoreRowsResult.data ?? []) as Array<{
    date: string
    total_points: number
    is_streak_day: boolean
  }>
  const weekSummaries = (summaryRowsResult.data ?? []) as DailyNutritionSummary[]

  const caloriesUnderBudget = weekSummaries.filter(
    (row) => row.food_calories <= targets.calorie_target + row.exercise_calories
  ).length

  const averageCalories = weekSummaries.length
    ? Math.round(
        weekSummaries.reduce((sum, row) => sum + row.food_calories, 0) / weekSummaries.length
      )
    : 0

  return {
    profile,
    targets,
    streak,
    weekScores,
    caloriesUnderBudget,
    averageCalories,
    weekDates: getWeekStrip(format(end, 'yyyy-MM-dd')),
  }
}

export function mapFeed(entries: JournalEntry[], analyses: JournalEntryAnalysis[]): JournalFeedItem[] {
  const analysisMap = new Map(analyses.map((analysis) => [analysis.id, analysis]))

  return entries
    .filter((entry) => entry.status !== 'deleted' && !entry.deleted_at)
    .map((entry) => ({
      entry,
      analysis: entry.latest_analysis_id
        ? analysisMap.get(entry.latest_analysis_id) ?? null
        : null,
    }))
}

function dedupeDates(rows: Array<{ logged_for_date: string }>) {
  return Array.from(new Set(rows.map((row) => row.logged_for_date)))
}

function emptySummary(userId: string, date: string): DailyNutritionSummary {
  return {
    user_id: userId,
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
  }
}
