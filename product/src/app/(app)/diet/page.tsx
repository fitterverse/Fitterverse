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
  const today = format(new Date(), 'yyyy-MM-dd')
  const meals = (todayData?.meals || []) as MealLog[]
  const mealTypes: MealType[] = ['breakfast', 'lunch', 'dinner']

  function getMealLog(type: MealType): MealLog | null {
    return (meals.find(m => m.meal_type === type) as MealLog) || null
  }

  // Today's plan items
  const now = new Date()
  const todayDow = ((now.getDay() + 6) % 7) as DayOfWeek
  const isCurrentWeekPlan = activePlan
    ? isThisWeek(parseISO(activePlan.plan.week_start), { weekStartsOn: 1 })
    : false
  const todayPlanItems: MealPlanItem[] = isCurrentWeekPlan
    ? activePlan!.items.filter(item => item.day_of_week === todayDow)
    : []

  // Today's score
  const todayScore = todayData?.score

  return (
    <div className="space-y-4">

      {/* ── Header row ─────────────────────────────────── */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold">Diet</h1>
          <p className="text-xs text-muted-foreground mt-0.5">{format(now, 'EEEE, MMMM d')}</p>
        </div>
        {todayScore && (
          <div className="text-right">
            <div className={`text-2xl font-bold tabular-nums ${
              todayScore.total_points >= 7 ? 'text-green-400' :
              todayScore.is_streak_day ? 'text-primary' : 'text-amber-400'
            }`}>
              {todayScore.total_points}<span className="text-sm text-muted-foreground font-normal">/9</span>
            </div>
            <div className="text-[10px] text-muted-foreground">today</div>
          </div>
        )}
      </div>

      {/* ── Today's plan (guide) ─────────────────────── */}
      {todayPlanItems.length > 0 && (
        <TodayPlanSnippet items={todayPlanItems} />
      )}

      {/* ── Log Today (action) ──────────────────────── */}
      <div>
        <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-widest mb-2">
          Log Today
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

      {/* ── Bottom actions ──────────────────────────── */}
      <div className="grid grid-cols-2 gap-2 pt-1">
        <Link
          href="/progress"
          className="flex items-center justify-center gap-2 text-xs font-medium text-muted-foreground hover:text-foreground bg-card border border-border rounded-xl py-3 transition-colors"
        >
          <TrendingUp size={14} />
          History & Streaks
        </Link>

        {activePlan ? (
          <ExpandableSection trigger="Full week plan">
            {/* Pre-rendered server component passed as children — zero client JS for the plan data */}
            <MealPlanView plan={activePlan.plan} items={activePlan.items} />
          </ExpandableSection>
        ) : (
          <div className="flex items-center justify-center text-xs text-muted-foreground/40 bg-card border border-dashed border-border rounded-xl py-3">
            No plan assigned
          </div>
        )}
      </div>

    </div>
  )
}
