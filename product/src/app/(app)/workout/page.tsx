import { redirect } from 'next/navigation'
import { getSession } from '@/server/session'
import { createClient } from '@/server/supabase/server'
import { format, subDays } from 'date-fns'
import { getTodayWorkouts, getTodayCaloriesConsumed, getWorkoutHistory } from '@/features/workouts/server/queries'
import { getActiveWorkoutPlan } from '@/features/plans/server/queries'
import { WorkoutPlanView } from '@/features/plans/components/workout-plan-view'
import { WorkoutLogger } from '@/features/workouts/components/workout-logger'
import { WorkoutList } from '@/features/workouts/components/workout-list'
import { CalorieBalanceCard } from '@/features/workouts/components/calorie-balance-card'
import { WORKOUT_EMOJIS, WORKOUT_LABELS } from '@/shared/types'

export default async function WorkoutPage() {
  const session = await getSession()
  if (!session) redirect('/login')

  const supabase = createClient()
  const [todayWorkouts, profileResult, recentHistory, activeWorkoutPlan] = await Promise.all([
    getTodayWorkouts(),
    supabase
      .from('profiles')
      .select('weight_kg, height_cm, age, activity_level')
      .eq('id', session.uid)
      .single(),
    getWorkoutHistory(7),
    getActiveWorkoutPlan(),
  ])

  const profile = profileResult.data
  const weightKg = Number(profile?.weight_kg ?? 70)
  const caloriesConsumed = await getTodayCaloriesConsumed(session.uid)
  const totalCaloriesBurned = todayWorkouts.reduce((sum, w) => sum + (w.calories_burned ?? 0), 0)

  // Last 7 days workout summary (excluding today)
  const today = format(new Date(), 'yyyy-MM-dd')
  const pastWorkouts = recentHistory.filter(w => w.date !== today)
  const last7Dates = Array.from({ length: 7 }, (_, i) => {
    return format(subDays(new Date(), i + 1), 'yyyy-MM-dd')
  }).reverse()

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-2xl font-bold">Workout</h1>
        <p className="text-sm text-muted-foreground">Log sessions, track your burn, and see your plan</p>
      </div>

      {/* Today's stats */}
      {todayWorkouts.length > 0 && (
        <div className="grid grid-cols-2 gap-3">
          <div className="bg-primary/8 border border-primary/20 rounded-xl p-4 text-center">
            <p className="text-xs text-muted-foreground uppercase tracking-wide">Burned today</p>
            <p className="text-2xl font-bold text-primary mt-1">{totalCaloriesBurned}</p>
            <p className="text-xs text-muted-foreground">kcal</p>
          </div>
          <div className="bg-card border border-border rounded-xl p-4 text-center">
            <p className="text-xs text-muted-foreground uppercase tracking-wide">Sessions</p>
            <p className="text-2xl font-bold mt-1">{todayWorkouts.length}</p>
            <p className="text-xs text-muted-foreground">today</p>
          </div>
        </div>
      )}

      {/* Log workout */}
      <div>
        <h2 className="text-xs font-semibold text-muted-foreground mb-2 uppercase tracking-wide">
          Log Workout
        </h2>
        <WorkoutLogger weightKg={weightKg} />
      </div>

      {/* Today's sessions */}
      <div>
        <h2 className="text-xs font-semibold text-muted-foreground mb-2 uppercase tracking-wide">
          Today&apos;s Sessions
        </h2>
        <WorkoutList workouts={todayWorkouts} />
      </div>

      {/* Calorie balance */}
      <div>
        <h2 className="text-xs font-semibold text-muted-foreground mb-2 uppercase tracking-wide">
          Calorie Balance
        </h2>
        <CalorieBalanceCard
          weight_kg={profile?.weight_kg ?? null}
          height_cm={profile?.height_cm ?? null}
          age={profile?.age ?? null}
          activity_level={profile?.activity_level ?? null}
          caloriesConsumed={caloriesConsumed}
          calorisBurned={totalCaloriesBurned}
        />
      </div>

      {/* Last 7 days workout history */}
      <div>
        <h2 className="text-xs font-semibold text-muted-foreground mb-3 uppercase tracking-wide">
          Last 7 Days
        </h2>
        <div className="space-y-2">
          {last7Dates.map(dateStr => {
            const dayWorkouts = pastWorkouts.filter(w => w.date === dateStr)
            const dayBurn = dayWorkouts.reduce((s, w) => s + (w.calories_burned ?? 0), 0)
            const label = format(new Date(dateStr + 'T00:00:00'), 'EEE, MMM d')
            return (
              <div key={dateStr} className="bg-card border border-border rounded-xl p-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">{label}</span>
                  {dayBurn > 0 ? (
                    <span className="text-xs text-primary font-semibold">~{dayBurn} kcal</span>
                  ) : (
                    <span className="text-xs text-muted-foreground">Rest day</span>
                  )}
                </div>
                {dayWorkouts.length > 0 && (
                  <div className="mt-2 flex flex-wrap gap-1.5">
                    {dayWorkouts.map(w => (
                      <span
                        key={w.id}
                        className="inline-flex items-center gap-1 rounded-full bg-secondary/50 border border-border px-2.5 py-1 text-xs"
                      >
                        {WORKOUT_EMOJIS[w.workout_type]} {WORKOUT_LABELS[w.workout_type]} · {w.duration_minutes}m
                      </span>
                    ))}
                  </div>
                )}
              </div>
            )
          })}
        </div>
      </div>

      {/* Workout plan */}
      <div>
        <h2 className="text-xs font-semibold text-muted-foreground mb-3 uppercase tracking-wide">
          Your Workout Plan
        </h2>
        {activeWorkoutPlan ? (
          <WorkoutPlanView plan={activeWorkoutPlan.plan} days={activeWorkoutPlan.days} />
        ) : (
          <div className="rounded-xl border border-dashed border-white/15 bg-white/[0.02] p-5 text-center space-y-2">
            <p className="text-sm font-semibold text-foreground/60">No plan assigned yet</p>
            <p className="text-xs text-foreground/40 max-w-xs mx-auto leading-relaxed">
              Your trainer will assign a personalised workout plan here.
            </p>
          </div>
        )}
      </div>

      <p className="text-xs text-muted-foreground text-center pb-2">
        Calorie estimates use MET values and are approximate.
      </p>
    </div>
  )
}
