import { redirect } from 'next/navigation'
import { createClient } from '@/server/supabase/server'
import { getSession } from '@/server/session'
import { getTodayData } from '@/features/dashboard/server/queries'
import { ScoreRing } from '@/features/dashboard/components/score-ring'
import { MealCard } from '@/features/meals/components/meal-card'
import { StreakDisplay, StreakGraceDots } from '@/features/streaks/components/streak-display'
import { TodayWorkoutCard } from '@/features/workouts/components/today-workout-card'
import { getTodayWorkouts, getTodayCaloriesConsumed } from '@/features/workouts/server/queries'
import { calculateBMR, calculateTDEE } from '@/features/workouts/lib/calorie-math'
import { MealType, MealLog } from '@/shared/types'
import { format } from 'date-fns'

export default async function DashboardPage() {
  const session = await getSession()
  if (!session) redirect('/login')

  const supabase = createClient()
  const [todayData, profileResult, todayWorkouts] = await Promise.all([
    getTodayData(),
    supabase
      .from('profiles')
      .select('calorie_limit_per_meal, full_name, weight_kg, height_cm, age, activity_level')
      .eq('id', session.uid)
      .single(),
    getTodayWorkouts(),
  ])

  const profile = profileResult.data
  const calorieLimit = profile?.calorie_limit_per_meal || 650
  const firstName = profile?.full_name?.split(' ')[0] || 'there'
  const weightKg = Number(profile?.weight_kg ?? 70)

  const hasBioData = profile?.weight_kg && profile?.height_cm && profile?.age
  const bmr = hasBioData
    ? calculateBMR(Number(profile.weight_kg), Number(profile.height_cm), Number(profile.age))
    : null
  const tdee = bmr ? calculateTDEE(bmr, profile?.activity_level ?? 'sedentary') : null

  const caloriesConsumed = await getTodayCaloriesConsumed(session.uid)
  const workoutCaloriesBurned = todayWorkouts.reduce((sum, w) => sum + (w.calories_burned ?? 0), 0)

  const today = format(new Date(), 'yyyy-MM-dd')
  const todayFormatted = format(new Date(), 'EEEE, MMM d')

  const meals = todayData?.meals || []
  const score = todayData?.score
  const streak = todayData?.streak
  const totalPoints = score?.total_points || 0
  const mealsLogged = score?.meals_logged || 0

  const mealTypes: MealType[] = ['breakfast', 'lunch', 'dinner']
  function getMealLog(type: MealType): MealLog | null {
    return (meals.find(m => m.meal_type === type) as MealLog) || null
  }

  const hour = new Date().getHours()
  const greeting = hour < 12 ? 'Good morning' : hour < 17 ? 'Good afternoon' : 'Good evening'

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-xl font-bold">{greeting}, {firstName} 👋</h1>
          <p className="text-sm text-muted-foreground">{todayFormatted}</p>
        </div>
        <div className="text-right shrink-0">
          <div className="text-xs text-muted-foreground">Meals</div>
          <div className="text-sm font-semibold">{mealsLogged}/3 logged</div>
        </div>
      </div>

      {/* Score + Streak */}
      <div className="grid grid-cols-2 gap-3">
        <div className="bg-card border border-border rounded-xl p-4 flex flex-col items-center gap-2">
          <ScoreRing score={totalPoints} maxScore={9} size={96} strokeWidth={8} />
          <p className="text-xs text-muted-foreground text-center">
            {totalPoints >= 9 ? '🌟 Perfect day!' :
             totalPoints >= 6 ? '✅ Streak day' :
             totalPoints > 0 ? 'Keep going...' : 'Start logging'}
          </p>
        </div>
        <div className="bg-card border border-border rounded-xl p-4 flex flex-col justify-between gap-2">
          <StreakDisplay streak={streak} />
          {streak && streak.consecutive_bad_days > 0 && (
            <StreakGraceDots streak={streak} />
          )}
        </div>
      </div>

      {/* Calorie balance bar — shown when we have bio data */}
      {tdee && (
        <div className="bg-card border border-border rounded-xl p-3">
          <div className="flex items-center justify-between mb-2">
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
              Today&apos;s energy
            </p>
            {workoutCaloriesBurned > 0 && (
              <span className="text-xs text-primary font-semibold">+{workoutCaloriesBurned} kcal workout</span>
            )}
          </div>
          <div className="grid grid-cols-3 gap-2 text-center">
            <div>
              <p className="text-base font-bold">{tdee}</p>
              <p className="text-[10px] text-muted-foreground">TDEE target</p>
            </div>
            <div>
              <p className={`text-base font-bold ${caloriesConsumed > 0 ? 'text-foreground' : 'text-muted-foreground'}`}>
                {caloriesConsumed > 0 ? caloriesConsumed : '—'}
              </p>
              <p className="text-[10px] text-muted-foreground">consumed</p>
            </div>
            <div>
              {caloriesConsumed > 0 ? (
                <>
                  <p className={`text-base font-bold ${(tdee + workoutCaloriesBurned - caloriesConsumed) >= 0 ? 'text-primary' : 'text-rose-400'}`}>
                    {Math.abs(tdee + workoutCaloriesBurned - caloriesConsumed)}
                  </p>
                  <p className="text-[10px] text-muted-foreground">
                    {(tdee + workoutCaloriesBurned - caloriesConsumed) >= 0 ? 'deficit' : 'surplus'}
                  </p>
                </>
              ) : (
                <>
                  <p className="text-base font-bold text-muted-foreground">—</p>
                  <p className="text-[10px] text-muted-foreground">balance</p>
                </>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Grace period warning */}
      {streak && streak.consecutive_bad_days > 0 && (
        <div className="bg-amber-500/10 border border-amber-500/30 rounded-xl p-3 text-sm text-amber-400">
          <span className="font-medium">⚠️ Grace period</span>
          {' '}— {3 - streak.consecutive_bad_days} day{3 - streak.consecutive_bad_days !== 1 ? 's' : ''} left before your {streak.current_streak}-day streak resets.
        </div>
      )}

      {/* Today's meals */}
      <div>
        <h2 className="text-xs font-semibold text-muted-foreground mb-2 uppercase tracking-wide">
          Diet — Today
        </h2>
        <div className="space-y-2">
          {mealTypes.map(type => (
            <MealCard
              key={type}
              mealType={type}
              calorieLimit={calorieLimit}
              existing={getMealLog(type)}
              date={today}
            />
          ))}
        </div>
      </div>

      {/* Today's workout */}
      <div>
        <h2 className="text-xs font-semibold text-muted-foreground mb-2 uppercase tracking-wide">
          Workout — Today
        </h2>
        <TodayWorkoutCard workouts={todayWorkouts} weightKg={weightKg} />
      </div>

      {/* Motivation nudge */}
      {totalPoints === 0 && (
        <div className="bg-primary/5 border border-primary/20 rounded-xl p-4 text-center">
          <p className="text-sm text-muted-foreground">
            Log a meal to start. <span className="text-foreground font-semibold">6 points</span> keeps your streak alive.
          </p>
        </div>
      )}
    </div>
  )
}
