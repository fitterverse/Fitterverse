import { redirect } from 'next/navigation'
import { getSession } from '@/server/session'
import { createClient } from '@/server/supabase/server'
import { getTodayData } from '@/features/dashboard/server/queries'
import { getHistoryData } from '@/features/history/server/queries'
import { MealCard } from '@/features/meals/components/meal-card'
import { MealType, MealLog, DailyScore, MEAL_LABELS, RATING_COLORS } from '@/shared/types'
import { format, parseISO, startOfMonth, endOfMonth, eachDayOfInterval, isSameDay, getDay } from 'date-fns'

function getDotColor(score: DailyScore | undefined): string {
  if (!score || score.meals_logged === 0) return 'bg-secondary'
  if (score.total_points >= 9) return 'bg-green-400'
  if (score.is_streak_day) return 'bg-primary'
  if (score.total_points >= 3) return 'bg-amber-500'
  return 'bg-red-500'
}

export default async function DietPage() {
  const session = await getSession()
  if (!session) redirect('/login')

  const supabase = createClient()
  const [todayData, profileResult, historyData] = await Promise.all([
    getTodayData(),
    supabase.from('profiles').select('calorie_limit_per_meal').eq('id', session.uid).single(),
    getHistoryData(90),
  ])

  const calorieLimit = profileResult.data?.calorie_limit_per_meal || 650
  const today = format(new Date(), 'yyyy-MM-dd')
  const meals = (todayData?.meals || []) as MealLog[]
  const scores = (historyData?.scores || []) as DailyScore[]
  const historyMeals = (historyData?.meals || []) as MealLog[]

  const mealTypes: MealType[] = ['breakfast', 'lunch', 'dinner']
  function getMealLog(type: MealType): MealLog | null {
    return (meals.find(m => m.meal_type === type) as MealLog) || null
  }

  // Calendar heatmap
  const now = new Date()
  const monthStart = startOfMonth(now)
  const monthEnd = endOfMonth(now)
  const daysInMonth = eachDayOfInterval({ start: monthStart, end: monthEnd })
  const firstDayOfWeek = getDay(monthStart)

  function getScoreForDate(date: Date): DailyScore | undefined {
    return scores.find(s => s.date === format(date, 'yyyy-MM-dd'))
  }
  function getMealsForDate(dateStr: string): MealLog[] {
    return historyMeals.filter(m => m.date === dateStr)
  }

  // Last 7 days
  const last7Days = Array.from({ length: 7 }, (_, i) => {
    const d = new Date(now)
    d.setDate(d.getDate() - i)
    return d
  }).reverse()

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Diet</h1>
        <p className="text-sm text-muted-foreground">Your meals, history, and future plan</p>
      </div>

      {/* Today's meals */}
      <div>
        <h2 className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-2">
          Today — {format(now, 'EEE, MMM d')}
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

      {/* Calendar heatmap */}
      <div className="bg-card border border-border rounded-xl p-4 space-y-3">
        <h2 className="font-semibold text-sm">{format(now, 'MMMM yyyy')} — meal consistency</h2>
        <div className="grid grid-cols-7 gap-1 text-center">
          {['S', 'M', 'T', 'W', 'T', 'F', 'S'].map((d, i) => (
            <div key={i} className="text-[10px] text-muted-foreground font-medium py-1">{d}</div>
          ))}
        </div>
        <div className="grid grid-cols-7 gap-1">
          {Array.from({ length: firstDayOfWeek }).map((_, i) => <div key={`e-${i}`} />)}
          {daysInMonth.map(day => {
            const score = getScoreForDate(day)
            const isToday = isSameDay(day, now)
            const isFuture = day > now
            return (
              <div
                key={day.toISOString()}
                className={`aspect-square rounded-md flex items-center justify-center text-[11px] font-medium relative ${isToday ? 'ring-1 ring-primary ring-offset-1 ring-offset-background' : ''} ${isFuture ? 'opacity-20' : ''}`}
              >
                <div
                  className={`absolute inset-0 rounded-md ${getDotColor(score)}`}
                  style={{ opacity: score && score.meals_logged > 0 ? 0.4 : 0.08 }}
                />
                <span className={`relative z-10 ${isToday ? 'text-primary font-bold' : 'text-foreground'}`}>
                  {format(day, 'd')}
                </span>
              </div>
            )
          })}
        </div>
        <div className="flex gap-4 text-xs text-muted-foreground flex-wrap">
          <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-green-400 inline-block" />9/9</span>
          <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-primary inline-block" />≥6 pts</span>
          <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-amber-500 inline-block" />&lt;6 pts</span>
        </div>
      </div>

      {/* Last 7 days detail */}
      <div>
        <h2 className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-3">
          Last 7 Days
        </h2>
        <div className="space-y-2">
          {last7Days.map(day => {
            const dateStr = format(day, 'yyyy-MM-dd')
            const score = getScoreForDate(day)
            const dayMeals = getMealsForDate(dateStr)
            const isToday = isSameDay(day, now)
            return (
              <div key={dateStr} className="bg-card border border-border rounded-xl p-3">
                <div className="flex items-center justify-between mb-2">
                  <span className="font-medium text-sm">
                    {isToday ? 'Today' : format(day, 'EEE, MMM d')}
                  </span>
                  <div className="flex items-center gap-2">
                    {score?.is_streak_day && <span className="text-xs text-primary">🔥</span>}
                    <span className={`text-sm font-bold ${
                      !score ? 'text-muted-foreground' :
                      score.total_points >= 7 ? 'text-green-400' :
                      score.is_streak_day ? 'text-primary' : 'text-amber-500'
                    }`}>
                      {score ? `${score.total_points}/9` : '—'}
                    </span>
                  </div>
                </div>
                {dayMeals.length > 0 ? (
                  <div className="space-y-1">
                    {(['breakfast', 'lunch', 'dinner'] as MealType[]).map(type => {
                      const meal = dayMeals.find(m => m.meal_type === type) as MealLog | undefined
                      if (!meal) return (
                        <div key={type} className="flex items-center gap-2 text-xs text-muted-foreground/50">
                          <span className="w-16 shrink-0 capitalize">{type}</span>
                          <span>—</span>
                        </div>
                      )
                      return (
                        <div key={type} className="flex items-center gap-2 text-xs">
                          <span className="w-16 shrink-0 text-muted-foreground capitalize">{type}</span>
                          <span className="font-medium capitalize" style={{ color: meal.rating ? RATING_COLORS[meal.rating] : undefined }}>
                            {meal.rating}
                          </span>
                          {meal.calories && <span className="text-muted-foreground">{meal.calories} kcal</span>}
                          {meal.note && <span className="text-muted-foreground truncate">· {meal.note}</span>}
                        </div>
                      )
                    })}
                  </div>
                ) : (
                  <p className="text-xs text-muted-foreground">No meals logged</p>
                )}
              </div>
            )
          })}
        </div>
      </div>

      {/* Meal plan placeholder */}
      <div className="rounded-xl border border-dashed border-white/15 bg-white/[0.02] p-5 text-center space-y-2">
        <p className="text-sm font-semibold text-foreground/60">Your Meal Plan</p>
        <p className="text-xs text-foreground/40 max-w-xs mx-auto leading-relaxed">
          Your nutritionist will assign a personalised meal plan here. Coming soon.
        </p>
      </div>
    </div>
  )
}
