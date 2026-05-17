import { redirect } from 'next/navigation'
import { createClient } from '@/server/supabase/server'
import { getSession } from '@/server/session'
import { getTodayData } from '@/features/dashboard/server/queries'
import { ScoreRing } from '@/features/dashboard/components/score-ring'
import { MealCard } from '@/features/meals/components/meal-card'
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
  const calorieLimit  = profile?.calorie_limit_per_meal || 650
  const firstName     = profile?.full_name?.split(' ')[0] || 'there'

  const hasBioData = profile?.weight_kg && profile?.height_cm && profile?.age
  const bmr  = hasBioData ? calculateBMR(Number(profile.weight_kg), Number(profile.height_cm), Number(profile.age)) : null
  const tdee = bmr ? calculateTDEE(bmr, profile?.activity_level ?? 'sedentary') : null

  const [caloriesConsumed] = await Promise.all([getTodayCaloriesConsumed(session.uid)])
  const workoutCaloriesBurned = todayWorkouts.reduce((sum, w) => sum + (w.calories_burned ?? 0), 0)

  const today         = format(new Date(), 'yyyy-MM-dd')
  const todayFormatted = format(new Date(), 'EEEE, MMMM d')

  const meals       = todayData?.meals || []
  const score       = todayData?.score
  const streak      = todayData?.streak
  const totalPoints = score?.total_points || 0
  const mealsLogged = score?.meals_logged || 0

  const mealTypes: MealType[] = ['breakfast', 'lunch', 'dinner']
  function getMealLog(type: MealType): MealLog | null {
    return (meals.find(m => m.meal_type === type) as MealLog) || null
  }

  const hour = new Date().getHours()
  const greeting =
    hour < 12 ? 'Good morning' :
    hour < 17 ? 'Good afternoon' :
                'Good evening'

  // Score state
  const isStreakDay   = totalPoints >= 6
  const isPerfectDay  = totalPoints === 9
  const scoreColor    =
    totalPoints >= 7 ? '#3FD17A' :
    totalPoints >= 5 ? '#E8A95B' :
    totalPoints >  0 ? '#D8462E' :
                       'var(--muted-foreground)'

  const scoreLabel =
    isPerfectDay  ? '🌟 Perfect day!' :
    isStreakDay   ? '✅ Streak day'   :
    totalPoints > 0 ? 'Keep going…'   :
                    'Start logging'

  const currentStreak     = streak?.current_streak      ?? 0
  const longestStreak     = streak?.longest_streak      ?? 0
  const consecutiveBadDays = streak?.consecutive_bad_days ?? 0
  const graceLeft         = 3 - consecutiveBadDays

  const streakEmoji =
    consecutiveBadDays > 0 ? '⚠️' :
    currentStreak > 0       ? '🔥' :
                              '💤'

  const energyTarget = tdee ? tdee + workoutCaloriesBurned : null
  const energyPct    = energyTarget && caloriesConsumed > 0
    ? Math.min(100, (caloriesConsumed / energyTarget) * 100)
    : 0
  const energyBalance = energyTarget && caloriesConsumed > 0
    ? energyTarget - caloriesConsumed
    : null

  return (
    <div className="space-y-4">

      {/* ── Header ──────────────────────────────────────────── */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">
            {greeting}, {firstName}
          </h1>
          <p className="text-sm text-muted-foreground mt-0.5">{todayFormatted}</p>
        </div>

        {currentStreak > 0 && (
          <div className="flex items-center gap-1.5 rounded-full border border-primary/25 bg-primary/10 px-3 py-1.5">
            <span className="text-base leading-none">🔥</span>
            <span className="text-sm font-bold text-primary tabular-nums">{currentStreak}</span>
          </div>
        )}
      </div>

      {/* ── Hero: Score + Streak ────────────────────────────── */}
      <div className="rounded-2xl border border-border bg-card p-5">
        <div className="flex items-center gap-5">

          {/* Score ring */}
          <ScoreRing score={totalPoints} maxScore={9} size={128} strokeWidth={10} />

          {/* Score + streak info */}
          <div className="flex-1 min-w-0">
            <div className="flex items-baseline gap-1.5">
              <span className="text-5xl font-bold tabular-nums leading-none" style={{ color: scoreColor }}>
                {totalPoints}
              </span>
              <span className="text-lg text-muted-foreground">/&thinsp;9</span>
            </div>
            <p className="mt-1.5 text-sm font-semibold" style={{ color: scoreColor }}>
              {scoreLabel}
            </p>

            {/* Divider + streak row */}
            <div className="mt-3.5 pt-3.5 border-t border-border">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-1.5">
                  <span className="text-base leading-none">{streakEmoji}</span>
                  <span className="text-sm font-semibold text-foreground">
                    {currentStreak} day{currentStreak !== 1 ? 's' : ''}
                  </span>
                </div>
                <span className="text-xs text-muted-foreground">
                  Best&nbsp;
                  <span className="font-semibold text-foreground">{longestStreak}</span>
                </span>
              </div>

              {/* Grace period — subtle dots, no full banner */}
              {consecutiveBadDays > 0 && (
                <div className="mt-2 flex items-center gap-2">
                  <div className="flex gap-1">
                    {Array.from({ length: 3 }).map((_, i) => (
                      <span
                        key={i}
                        className="inline-block h-2 w-2 rounded-full"
                        style={{
                          background: i < consecutiveBadDays ? '#E8A95B' : 'var(--border)',
                        }}
                      />
                    ))}
                  </div>
                  <span className="text-[11px] font-medium" style={{ color: '#E8A95B' }}>
                    {graceLeft} grace day{graceLeft !== 1 ? 's' : ''} left
                  </span>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Meal progress dots */}
        <div className="mt-4 pt-4 border-t border-border flex items-center justify-between">
          <div className="flex items-center gap-3">
            {mealTypes.map(type => {
              const meal = getMealLog(type)
              const logged = !!meal
              return (
                <div key={type} className="flex items-center gap-1.5">
                  <span
                    className="inline-block h-2.5 w-2.5 rounded-full transition-colors"
                    style={{ background: logged ? '#3FD17A' : 'var(--border)' }}
                  />
                  <span className="text-xs text-muted-foreground capitalize">
                    {type === 'breakfast' ? 'Bfast' : type.charAt(0).toUpperCase() + type.slice(1)}
                  </span>
                </div>
              )
            })}
          </div>
          <span className="text-xs font-medium text-muted-foreground">
            {mealsLogged} / 3 logged
          </span>
        </div>
      </div>

      {/* ── Energy balance ──────────────────────────────────── */}
      {energyTarget && (
        <div className="rounded-2xl border border-border bg-card px-5 py-4">
          <div className="flex items-center justify-between mb-3">
            <p className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">
              Energy balance
            </p>
            {workoutCaloriesBurned > 0 && (
              <span className="rounded-full bg-primary/10 px-2 py-0.5 text-[10px] font-semibold text-primary">
                +{workoutCaloriesBurned} burned
              </span>
            )}
          </div>

          <div className="flex items-baseline justify-between mb-2.5">
            <div>
              <span className="text-3xl font-bold tabular-nums">
                {caloriesConsumed > 0 ? caloriesConsumed.toLocaleString() : '—'}
              </span>
              <span className="ml-1.5 text-sm text-muted-foreground">
                / {energyTarget.toLocaleString()} kcal
              </span>
            </div>
            {energyBalance !== null && (
              <span
                className="text-sm font-semibold tabular-nums"
                style={{ color: energyBalance >= 0 ? '#3FD17A' : '#D8462E' }}
              >
                {energyBalance >= 0 ? '−' : '+'}{Math.abs(energyBalance)} kcal
              </span>
            )}
          </div>

          {/* Progress bar */}
          <div className="h-1.5 rounded-full bg-border overflow-hidden">
            <div
              className="h-full rounded-full transition-all duration-700"
              style={{
                width: `${energyPct}%`,
                background: caloriesConsumed > energyTarget ? '#D8462E' : '#3FD17A',
              }}
            />
          </div>

          {caloriesConsumed === 0 && (
            <p className="mt-2 text-xs text-muted-foreground">
              Log meals with calorie info to track your balance.
            </p>
          )}
          {energyBalance !== null && (
            <p className="mt-2 text-xs text-muted-foreground">
              {energyBalance >= 0
                ? `${energyBalance.toLocaleString()} kcal remaining in your budget`
                : `${Math.abs(energyBalance).toLocaleString()} kcal over your TDEE today`}
            </p>
          )}
        </div>
      )}

      {/* ── Today's meals ────────────────────────────────────── */}
      <div>
        <p className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground mb-2.5">
          Today's meals
        </p>
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

      {/* ── Today's workout ──────────────────────────────────── */}
      <div>
        <p className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground mb-2.5">
          Today's workout
        </p>
        <TodayWorkoutCard workouts={todayWorkouts} weightKg={Number(profile?.weight_kg ?? 70)} />
      </div>

    </div>
  )
}
