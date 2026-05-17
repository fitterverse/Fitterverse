import { redirect } from 'next/navigation'
import Link from 'next/link'
import { getSession } from '@/server/session'
import { createClient } from '@/server/supabase/server'
import { getTodayData } from '@/features/dashboard/server/queries'
import { getActiveMealPlan } from '@/features/plans/server/queries'
import { TodayPlanSnippet } from '@/features/plans/components/today-plan-snippet'
import { MealPlanView } from '@/features/plans/components/meal-plan-view'
import { MealCard } from '@/features/meals/components/meal-card'
import { ExpandableSection } from '@/components/expandable-section'
import { MealType, MealLog, type MealPlanItem, type DayOfWeek } from '@/shared/types'
import { format, isThisWeek, parseISO } from 'date-fns'
import { TrendingUp } from 'lucide-react'

export default async function DietPage() {
  const session = await getSession()
  if (!session) redirect('/login')

  const supabase = createClient()
  const [todayData, profileResult, activePlan] = await Promise.all([
    getTodayData(),
    supabase.from('profiles').select('calorie_limit_per_meal').eq('id', session.uid).single(),
    getActiveMealPlan(),
  ])

  const calorieLimit = profileResult.data?.calorie_limit_per_meal || 650
  const today        = format(new Date(), 'yyyy-MM-dd')
  const now          = new Date()
  const meals        = (todayData?.meals || []) as MealLog[]
  const mealTypes: MealType[] = ['breakfast', 'lunch', 'dinner']

  function getMealLog(type: MealType): MealLog | null {
    return (meals.find(m => m.meal_type === type) as MealLog) || null
  }

  // Today's plan items
  const todayDow = ((now.getDay() + 6) % 7) as DayOfWeek
  const isCurrentWeekPlan = activePlan
    ? isThisWeek(parseISO(activePlan.plan.week_start), { weekStartsOn: 1 })
    : false
  const todayPlanItems: MealPlanItem[] = isCurrentWeekPlan
    ? activePlan!.items.filter(item => item.day_of_week === todayDow)
    : []

  const todayScore   = todayData?.score
  const totalPoints  = todayScore?.total_points ?? 0
  const mealsLogged  = todayScore?.meals_logged ?? 0

  const scoreColor =
    totalPoints >= 7 ? 'text-primary' :
    totalPoints >= 6 ? 'text-primary' :
    totalPoints >  0 ? 'text-amber-400' :
                       'text-muted-foreground'

  return (
    <div className="space-y-4">

      {/* ── Header ──────────────────────────────────────── */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Diet</h1>
          <p className="text-xs text-muted-foreground mt-0.5">
            {format(now, 'EEEE, MMMM d')}
          </p>
        </div>
        <div className="text-right">
          <div className={`text-3xl font-bold tabular-nums leading-none ${scoreColor}`}>
            {totalPoints}
            <span className="text-base text-muted-foreground font-normal">/9</span>
          </div>
          <div className="text-[10px] text-muted-foreground mt-0.5">
            {mealsLogged}/3 meals
          </div>
        </div>
      </div>

      {/* ── Today's plan guide (if assigned) ────────────── */}
      {todayPlanItems.length > 0 && (
        <TodayPlanSnippet items={todayPlanItems} />
      )}

      {/* ── Primary: Meal logging ────────────────────────── */}
      <div>
        <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-widest mb-2.5">
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

      {/* ── Secondary: History ───────────────────────────── */}
      <Link
        href="/progress"
        className="flex items-center justify-center gap-2 w-full rounded-2xl border border-border bg-card px-4 py-3.5 text-sm font-medium text-muted-foreground hover:text-foreground hover:border-border/70 transition-colors"
      >
        <TrendingUp size={15} />
        History &amp; Streaks
      </Link>

      {/* ── Tertiary: Full week plan (collapsible) ───────── */}
      {activePlan ? (
        <ExpandableSection trigger="Full week plan">
          <MealPlanView plan={activePlan.plan} items={activePlan.items} />
        </ExpandableSection>
      ) : (
        <div className="rounded-2xl border border-dashed border-border px-4 py-4 text-center">
          <p className="text-xs text-muted-foreground">No meal plan assigned this week</p>
        </div>
      )}

    </div>
  )
}
