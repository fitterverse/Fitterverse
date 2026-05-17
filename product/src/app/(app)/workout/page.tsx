import { redirect } from 'next/navigation'
import Link from 'next/link'
import { getSession } from '@/server/session'
import { createClient } from '@/server/supabase/server'
import { format, isThisWeek, parseISO } from 'date-fns'
import { getTodayWorkouts, getTodayCaloriesConsumed } from '@/features/workouts/server/queries'
import { getActiveWorkoutPlan } from '@/features/plans/server/queries'
import { TodayWorkoutSnippet } from '@/features/plans/components/today-workout-snippet'
import { WorkoutPlanView } from '@/features/plans/components/workout-plan-view'
import { WorkoutLogger } from '@/features/workouts/components/workout-logger'
import { WorkoutList } from '@/features/workouts/components/workout-list'
import { ExpandableSection } from '@/components/expandable-section'
import { calculateBMR, calculateTDEE } from '@/features/workouts/lib/calorie-math'
import { type DayOfWeek, type WorkoutPlanDay, type WorkoutPlanExercise } from '@/shared/types'
import { TrendingUp } from 'lucide-react'

export default async function WorkoutPage() {
  const session = await getSession()
  if (!session) redirect('/login')

  const supabase = createClient()
  const [todayWorkouts, profileResult, activeWorkoutPlan] = await Promise.all([
    getTodayWorkouts(),
    supabase.from('profiles').select('weight_kg, height_cm, age, activity_level').eq('id', session.uid).single(),
    getActiveWorkoutPlan(),
  ])

  const profile = profileResult.data
  const weightKg = Number(profile?.weight_kg ?? 70)
  const caloriesConsumed = await getTodayCaloriesConsumed(session.uid)
  const totalCaloriesBurned = todayWorkouts.reduce((sum, w) => sum + (w.calories_burned ?? 0), 0)

  const now = new Date()

  const hasBioData = profile?.weight_kg && profile?.height_cm && profile?.age
  const bmr  = hasBioData ? calculateBMR(Number(profile!.weight_kg), Number(profile!.height_cm), Number(profile!.age)) : null
  const tdee = bmr ? calculateTDEE(bmr, profile?.activity_level ?? 'sedentary') : null
  const totalBurn = tdee ? tdee + totalCaloriesBurned : null

  // Today's assigned workout from plan
  const todayDow = ((now.getDay() + 6) % 7) as DayOfWeek
  const isCurrentWeekPlan = activeWorkoutPlan
    ? isThisWeek(parseISO(activeWorkoutPlan.plan.week_start), { weekStartsOn: 1 })
    : false

  type DayWithExercises = WorkoutPlanDay & { exercises: WorkoutPlanExercise[] }
  const todayPlanDay = isCurrentWeekPlan
    ? (activeWorkoutPlan!.days as DayWithExercises[]).find(d => d.day_of_week === todayDow) ?? null
    : null

  return (
    <div className="space-y-4">

      {/* ── Header ─────────────────────────────────────── */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Workout</h1>
          <p className="text-xs text-muted-foreground mt-0.5">{format(now, 'EEEE, MMMM d')}</p>
        </div>
        {totalCaloriesBurned > 0 && (
          <div className="text-right">
            <div className="text-3xl font-bold text-primary tabular-nums leading-none">{totalCaloriesBurned}</div>
            <div className="text-[10px] text-muted-foreground mt-0.5">kcal burned</div>
          </div>
        )}
      </div>

      {/* ── Today's workout from plan ───────────────────── */}
      {todayPlanDay && (
        <TodayWorkoutSnippet day={todayPlanDay} />
      )}

      {/* ── Primary: Log session ────────────────────────── */}
      <div>
        <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-widest mb-2.5">
          Log session
        </p>
        <WorkoutLogger weightKg={weightKg} />
      </div>

      {/* ── Logged today ────────────────────────────────── */}
      {todayWorkouts.length > 0 && (
        <div>
          <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-widest mb-2.5">
            Logged today
          </p>
          <WorkoutList workouts={todayWorkouts} />
        </div>
      )}

      {/* ── Energy snapshot ─────────────────────────────── */}
      {totalBurn !== null && (
        <div className="rounded-2xl border border-border bg-card px-4 py-3.5">
          <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-widest mb-3">
            Energy today
          </p>
          <div className="grid grid-cols-3 divide-x divide-border">
            <div className="pr-4">
              <p className="text-[10px] text-muted-foreground mb-0.5">BMR</p>
              <p className="text-base font-bold tabular-nums">{bmr!.toLocaleString()}</p>
              <p className="text-[10px] text-muted-foreground">kcal</p>
            </div>
            <div className="px-4">
              <p className="text-[10px] text-muted-foreground mb-0.5">TDEE</p>
              <p className="text-base font-bold tabular-nums">{tdee!.toLocaleString()}</p>
              <p className="text-[10px] text-muted-foreground">kcal</p>
            </div>
            <div className="pl-4">
              <p className="text-[10px] text-muted-foreground mb-0.5">Burned</p>
              <p className="text-base font-bold tabular-nums text-primary">
                {totalCaloriesBurned > 0 ? `+${totalCaloriesBurned.toLocaleString()}` : '—'}
              </p>
              <p className="text-[10px] text-muted-foreground">kcal</p>
            </div>
          </div>
          {caloriesConsumed > 0 && totalBurn > 0 && (
            <div className="mt-3 pt-3 border-t border-border flex items-center justify-between">
              <span className="text-xs text-muted-foreground">Consumed today</span>
              <span
                className="text-sm font-bold tabular-nums"
                style={{ color: caloriesConsumed <= totalBurn ? '#3FD17A' : '#D8462E' }}
              >
                {caloriesConsumed.toLocaleString()} / {totalBurn.toLocaleString()} kcal
              </span>
            </div>
          )}
        </div>
      )}

      {/* ── Secondary: History ──────────────────────────── */}
      <Link
        href="/progress"
        className="flex items-center justify-center gap-2 w-full rounded-2xl border border-border bg-card px-4 py-3.5 text-sm font-medium text-muted-foreground hover:text-foreground hover:border-border/70 transition-colors"
      >
        <TrendingUp size={15} />
        History &amp; Progress
      </Link>

      {/* ── Tertiary: Full week plan (collapsible) ───────── */}
      {activeWorkoutPlan ? (
        <ExpandableSection trigger="Full week plan">
          <WorkoutPlanView plan={activeWorkoutPlan.plan} days={activeWorkoutPlan.days} />
        </ExpandableSection>
      ) : (
        <div className="rounded-2xl border border-dashed border-border px-4 py-4 text-center">
          <p className="text-xs text-muted-foreground">No workout plan assigned this week</p>
        </div>
      )}

    </div>
  )
}
