import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { getSession } from '@/lib/session'
import { getTodayData } from '@/app/actions'
import { ScoreRing } from '@/components/diet/score-ring'
import { MealCard } from '@/components/diet/meal-card'
import { StreakDisplay, StreakGraceDots } from '@/components/diet/streak-display'
import { BadgeCard } from '@/components/diet/badge-card'
import { BADGE_DEFINITIONS, MealType, MealLog } from '@/types'
import { format } from 'date-fns'

export default async function DashboardPage() {
  const session = await getSession()
  if (!session) redirect('/login')

  const supabase = createClient()
  const [todayData, profileResult] = await Promise.all([
    getTodayData(),
    supabase.from('profiles').select('calorie_limit_per_meal, full_name').eq('id', session.uid).single(),
  ])

  const profile = profileResult.data
  const calorieLimit = profile?.calorie_limit_per_meal || 650
  const firstName = profile?.full_name?.split(' ')[0] || 'there'

  const today = format(new Date(), 'yyyy-MM-dd')
  const todayFormatted = format(new Date(), 'EEEE, MMM d')

  const meals = todayData?.meals || []
  const score = todayData?.score
  const streak = todayData?.streak
  const recentBadges = todayData?.recentBadges || []

  const mealTypes: MealType[] = ['breakfast', 'lunch', 'dinner']

  function getMealLog(type: MealType): MealLog | null {
    return (meals.find(m => m.meal_type === type) as MealLog) || null
  }

  const totalPoints = score?.total_points || 0
  const mealsLogged = score?.meals_logged || 0

  const hour = new Date().getHours()
  const greeting = hour < 12 ? 'Good morning' : hour < 17 ? 'Good afternoon' : 'Good evening'

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold">{greeting}, {firstName} 👋</h1>
          <p className="text-sm text-muted-foreground">{todayFormatted}</p>
        </div>
        <div className="text-right">
          <div className="text-xs text-muted-foreground">Today</div>
          <div className="text-sm font-semibold text-foreground">{mealsLogged}/3 logged</div>
        </div>
      </div>

      {/* Score + Streak row */}
      <div className="grid grid-cols-2 gap-3">
        <div className="bg-card border border-border rounded-xl p-4 flex flex-col items-center gap-2">
          <ScoreRing score={totalPoints} maxScore={9} size={100} strokeWidth={8} />
          <p className="text-xs text-muted-foreground text-center">
            {totalPoints >= 9 ? '🌟 Perfect day!' :
             totalPoints >= 6 ? '✅ Streak day!' :
             totalPoints > 0 ? 'Keep going...' :
             'Start logging'}
          </p>
        </div>
        <div className="bg-card border border-border rounded-xl p-4 flex flex-col justify-between">
          <StreakDisplay streak={streak} />
          {streak && streak.consecutive_bad_days > 0 && (
            <StreakGraceDots streak={streak} />
          )}
        </div>
      </div>

      {/* Grace period warning */}
      {streak && streak.consecutive_bad_days > 0 && (
        <div className="bg-amber-500/10 border border-amber-500/30 rounded-xl p-3 text-sm text-amber-400">
          <span className="font-medium">⚠️ Grace period active</span> — {3 - streak.consecutive_bad_days} day{3 - streak.consecutive_bad_days !== 1 ? 's' : ''} left before your {streak.current_streak}-day streak resets.
        </div>
      )}

      {/* Meal cards */}
      <div>
        <h2 className="text-sm font-semibold text-muted-foreground mb-2 uppercase tracking-wide">Today's Meals</h2>
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

      {/* Recent badges */}
      {recentBadges.length > 0 && (
        <div>
          <h2 className="text-sm font-semibold text-muted-foreground mb-2 uppercase tracking-wide">Recent Badges</h2>
          <div className="grid grid-cols-3 gap-2">
            {recentBadges.map(badge => {
              const def = BADGE_DEFINITIONS.find(d => d.slug === badge.badge_slug)
              if (!def) return null
              return (
                <BadgeCard
                  key={badge.id}
                  definition={def}
                  earned={badge}
                  currentStreak={streak?.current_streak || 0}
                />
              )
            })}
          </div>
        </div>
      )}

      {/* Motivation */}
      {totalPoints === 0 && (
        <div className="bg-primary/5 border border-primary/20 rounded-xl p-4 text-center">
          <p className="text-sm text-muted-foreground">Minimum <span className="text-foreground font-semibold">6 points</span> today keeps your streak alive. You've got this! 💪</p>
        </div>
      )}
    </div>
  )
}
