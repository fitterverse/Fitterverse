import {
  eachDayOfInterval,
  endOfMonth,
  format,
  getDay,
  isSameDay,
  startOfMonth,
} from 'date-fns'
import { DrawerToggleButton } from '@/features/navigation/components/app-shell'
import { getHistoryData } from '@/features/history/server/queries'
import { ProgressCharts } from '@/features/progress/components/progress-charts'
import type { DailyNutritionSummary, DailyScore } from '@/shared/types'

function getDotColor(score: DailyScore | undefined): string {
  if (!score || score.total_points === 0) return 'bg-slate-200'
  if (score.total_points >= 9) return 'bg-emerald-500'
  if (score.total_points >= 3) return 'bg-emerald-300'
  return 'bg-amber-300'
}

export default async function ProgressPage() {
  const data = await getHistoryData(90)
  const scores = (data.scores || []) as DailyScore[]
  const summaries = (data.summaries || []) as DailyNutritionSummary[]
  const last30 = scores.slice(0, 30)

  const loggedDays = last30.filter((score) => score.total_points > 0).length
  const streakDays = last30.filter((score) => score.is_streak_day).length
  const avgScore = last30.length
    ? (last30.reduce((sum, score) => sum + score.total_points, 0) / last30.length).toFixed(1)
    : '0.0'
  const avgFoodCalories = summaries.length
    ? Math.round(summaries.reduce((sum, row) => sum + row.food_calories, 0) / summaries.length)
    : 0

  const now = new Date()
  const monthStart = startOfMonth(now)
  const monthEnd = endOfMonth(now)
  const daysInMonth = eachDayOfInterval({ start: monthStart, end: monthEnd })
  const firstDayOfWeek = getDay(monthStart)

  function getScoreForDate(date: Date) {
    return scores.find((score) => score.date === format(date, 'yyyy-MM-dd'))
  }

  return (
    <div className="space-y-6 pb-8">
      <div className="flex items-center gap-4">
        <DrawerToggleButton className="-ml-2 text-slate-900" />
        <div>
          <h1 className="text-4xl font-semibold text-slate-900">Progress</h1>
          <p className="mt-1 text-lg text-slate-500">History, patterns, and consistency.</p>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <StatCard value={avgScore} label="Avg score / day" />
        <StatCard value={loggedDays} label="Logged days (30d)" />
        <StatCard value={streakDays} label="Streak days (30d)" />
        <StatCard value={avgFoodCalories} label="Avg food calories" />
      </div>

      {last30.length > 0 ? (
        <ProgressCharts scores={last30} />
      ) : (
        <div className="rounded-[2rem] border border-slate-200 bg-white p-8 text-center text-slate-500 shadow-sm">
          Log a few days first. Your trends will appear here automatically.
        </div>
      )}

      <section className="rounded-[2rem] border border-slate-200 bg-white p-5 shadow-sm">
        <h2 className="text-xl font-semibold text-slate-900">{format(now, 'MMMM yyyy')} consistency</h2>

        <div className="mt-4 grid grid-cols-7 gap-1 text-center text-xs text-slate-500">
          {['S', 'M', 'T', 'W', 'T', 'F', 'S'].map((day, index) => (
            <div key={`${day}-${index}`} className="py-1">
              {day}
            </div>
          ))}
        </div>

        <div className="mt-2 grid grid-cols-7 gap-1">
          {Array.from({ length: firstDayOfWeek }).map((_, index) => (
            <div key={`empty-${index}`} />
          ))}

          {daysInMonth.map((day) => {
            const score = getScoreForDate(day)
            const isToday = isSameDay(day, now)

            return (
              <div
                key={day.toISOString()}
                className={`relative flex aspect-square items-center justify-center rounded-xl text-sm font-medium ${
                  isToday ? 'ring-1 ring-slate-300' : ''
                }`}
              >
                <div className={`absolute inset-0 rounded-xl ${getDotColor(score)} opacity-35`} />
                <span className={`relative z-10 ${isToday ? 'text-slate-900' : 'text-slate-700'}`}>
                  {format(day, 'd')}
                </span>
              </div>
            )
          })}
        </div>
      </section>
    </div>
  )
}

function StatCard({
  value,
  label,
}: {
  value: number | string
  label: string
}) {
  return (
    <div className="rounded-[1.6rem] border border-slate-200 bg-white p-4 shadow-sm">
      <p className="text-4xl font-semibold text-slate-900">{value}</p>
      <p className="mt-2 text-sm text-slate-500">{label}</p>
    </div>
  )
}
