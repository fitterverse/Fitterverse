import { redirect } from 'next/navigation'
import Link from 'next/link'
import { getSession } from '@/server/session'
import { createClient } from '@/server/supabase/server'
import { format } from 'date-fns'
import { isThisWeek, parseISO } from 'date-fns'
import { getTodayWorkouts, getTodayCaloriesConsumed, getWorkoutHistory } from '@/features/workouts/server/queries'
import { getActiveWorkoutPlan } from '@/features/plans/server/queries'
import { TodayWorkoutSnippet } from '@/features/plans/components/today-workout-snippet'
import { WorkoutPlanView } from '@/features/plans/components/workout-plan-view'
import { WorkoutLogger } from '@/features/workouts/components/workout-logger'
import { WorkoutList } from '@/features/workouts/components/workout-list'
import { CalorieBalanceCard } from '@/features/workouts/components/calorie-balance-card'
import { ExpandableSection } from '@/components/expandable-section'
import { WORKOUT_EMOJIS, WORKOUT_LABELS, type DayOfWeek, type WorkoutPlanDay, type WorkoutPlanExercise } from '@/shared/types'
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
  const today = format(now, 'yyyy-MM-dd')

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

      {/* ── Header row ─────────────────────────────────── */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold">Workout</h1>
          <p className="text-xs text-muted-foreground mt-0.5">{format(now, 'EEEE, MMMM d')}</p>
        </div>
        {totalCaloriesBurned > 0 && (
          <div className="text-right">
            <div className="text-2xl font-bold text-primary tabular-nums">{totalCaloriesBurned}</div>
            <div className="text-[10px] text-muted-foreground">kcal burned</div>
          </div>
        )}
      </div>

      {/* ── Today's workout from plan ─────────────────── */}
      {todayPlanDay && (
        <TodayWorkoutSnippet day={todayPlanDay} />
      )}

      {/* ── Log session ──────────────────────────────── */}
      <div>
        <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-widest mb-2">
          Log Session
        </p>
        <WorkoutLogger weightKg={weightKg} />
      </div>

      {/* ── Today's logged sessions ───────────────────── */}
      {todayWorkouts.length > 0 && (
        <div>
          <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-widest mb-2">
            Logged Today
          </p>
          <WorkoutList workouts={todayWorkouts} />
        </div>
      )}

      {/* ── Calorie balance (compact) ─────────────────── */}
      <CalorieBalanceCard
        weight_kg={profile?.weight_kg ?? null}
        height_cm={profile?.height_cm ?? null}
        age={profile?.age ?? null}
        activity_level={profile?.activity_level ?? null}
        caloriesConsumed={caloriesConsumed}
        calorisBurned={totalCaloriesBurned}
      />

      {/* ── Bottom actions ──────────────────────────── */}
      <div className="grid grid-cols-2 gap-2 pt-1">
        <Link
          href="/progress"
          className="flex items-center justify-center gap-2 text-xs font-medium text-muted-foreground hover:text-foreground bg-card border border-border rounded-xl py-3 transition-colors"
        >
          <TrendingUp size={14} />
          History & Progress
        </Link>

        {activeWorkoutPlan ? (
          <ExpandableSection trigger="Full week plan">
            <WorkoutPlanView plan={activeWorkoutPlan.plan} days={activeWorkoutPlan.days} />
          </ExpandableSection>
        ) : (
          <div className="flex items-center justify-center text-xs text-muted-foreground/40 bg-card border border-dashed border-border rounded-xl py-3">
            No plan assigned
          </div>
        )}
      </div>

      <p className="text-xs text-muted-foreground text-center pb-2">
        Calorie estimates use MET values and are approximate.
      </p>
    </div>
  )
}
