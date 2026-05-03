import { redirect } from 'next/navigation'
import { getSession } from '@/lib/session'
import { getHistoryData } from '@/app/actions'
import { format, parseISO, startOfMonth, endOfMonth, eachDayOfInterval, isSameDay, getDay } from 'date-fns'
import { MealLog, DailyScore, MEAL_LABELS, MealType, RATING_COLORS } from '@/types'

export default async function HistoryPage() {
  const session = await getSession()
  if (!session) redirect('/login')

  const data = await getHistoryData(90)
  const scores = (data?.scores || []) as DailyScore[]
  const meals = (data?.meals || []) as MealLog[]

  const today = new Date()
  const monthStart = startOfMonth(today)
  const monthEnd = endOfMonth(today)
  const daysInMonth = eachDayOfInterval({ start: monthStart, end: monthEnd })

  function getScoreForDate(date: Date): DailyScore | undefined {
    return scores.find(s => s.date === format(date, 'yyyy-MM-dd'))
  }

  function getMealsForDate(dateStr: string): MealLog[] {
    return meals.filter(m => m.date === dateStr)
  }

  function getDotColor(score: DailyScore | undefined): string {
    if (!score || score.meals_logged === 0) return 'bg-secondary'
    if (score.total_points >= 9) return 'bg-green-400'
    if (score.is_streak_day) return 'bg-primary'
    if (score.total_points >= 3) return 'bg-amber-500'
    return 'bg-red-500'
  }

  // Last 7 days detail
  const last7Days = Array.from({ length: 7 }, (_, i) => {
    const d = new Date(today)
    d.setDate(d.getDate() - i)
    return d
  }).reverse()

  const firstDayOfWeek = getDay(monthStart) // 0=Sun

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">History</h1>
        <p className="text-sm text-muted-foreground">Your meal log over time</p>
      </div>

      {/* Calendar heatmap */}
      <div className="bg-card border border-border rounded-xl p-4 space-y-3">
        <h2 className="font-semibold">{format(today, 'MMMM yyyy')}</h2>

        {/* Day labels */}
        <div className="grid grid-cols-7 gap-1 text-center">
          {['S', 'M', 'T', 'W', 'T', 'F', 'S'].map((d, i) => (
            <div key={i} className="text-[10px] text-muted-foreground font-medium py-1">{d}</div>
          ))}
        </div>

        {/* Calendar grid */}
        <div className="grid grid-cols-7 gap-1">
          {/* Empty cells for first week */}
          {Array.from({ length: firstDayOfWeek }).map((_, i) => (
            <div key={`empty-${i}`} />
          ))}

          {daysInMonth.map(day => {
            const score = getScoreForDate(day)
            const isToday = isSameDay(day, today)
            const isFuture = day > today

            return (
              <div
                key={day.toISOString()}
                className={`aspect-square rounded-md flex items-center justify-center text-[11px] font-medium relative ${
                  isToday ? 'ring-1 ring-primary ring-offset-1 ring-offset-background' : ''
                } ${isFuture ? 'opacity-20' : ''}`}
              >
                <div
                  className={`absolute inset-0 rounded-md opacity-60 ${getDotColor(score)}`}
                  style={{ opacity: score && score.meals_logged > 0 ? 0.4 : 0.1 }}
                />
                <span className={`relative z-10 ${isToday ? 'text-primary font-bold' : 'text-foreground'}`}>
                  {format(day, 'd')}
                </span>
              </div>
            )
          })}
        </div>

        {/* Legend */}
        <div className="flex gap-4 text-xs text-muted-foreground flex-wrap">
          <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-green-400 inline-block" />9/9</span>
          <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-primary inline-block" />≥6 pts</span>
          <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-amber-500 inline-block" />&lt;6 pts</span>
          <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-red-500 inline-block" />Poor</span>
        </div>
      </div>

      {/* Last 7 days detail */}
      <div>
        <h2 className="font-semibold mb-3">Last 7 Days</h2>
        <div className="space-y-2">
          {last7Days.map(day => {
            const dateStr = format(day, 'yyyy-MM-dd')
            const score = getScoreForDate(day)
            const dayMeals = getMealsForDate(dateStr)
            const isToday = isSameDay(day, today)

            return (
              <div key={dateStr} className="bg-card border border-border rounded-xl p-3">
                <div className="flex items-center justify-between mb-2">
                  <div>
                    <span className="font-medium text-sm">
                      {isToday ? 'Today' : format(day, 'EEE, MMM d')}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    {score && score.is_streak_day && <span className="text-xs text-primary">🔥 streak</span>}
                    <span className={`text-sm font-bold ${
                      !score ? 'text-muted-foreground' :
                      score.total_points >= 7 ? 'text-green-400' :
                      score.is_streak_day ? 'text-primary' :
                      'text-amber-500'
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
                          <span
                            className="font-medium capitalize"
                            style={{ color: meal.rating ? RATING_COLORS[meal.rating] : undefined }}
                          >
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
    </div>
  )
}
