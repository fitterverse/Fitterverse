import { redirect } from 'next/navigation'
import { getSession } from '@/server/session'
import { getHistoryData } from '@/features/history/server/queries'
import { ProgressCharts } from '@/features/progress/components/progress-charts'
import { DailyScore } from '@/shared/types'

export default async function ProgressPage() {
  const session = await getSession()
  if (!session) redirect('/login')

  const data = await getHistoryData(30)
  const scores = (data?.scores || []) as DailyScore[]

  // Stats
  const totalDays = scores.length
  const streakDays = scores.filter(s => s.is_streak_day).length
  const perfectDays = scores.filter(s => s.total_points === 9).length
  const avgScore = totalDays > 0
    ? (scores.reduce((sum, s) => sum + s.total_points, 0) / totalDays).toFixed(1)
    : '—'

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Progress</h1>
        <p className="text-sm text-muted-foreground">Last 30 days overview</p>
      </div>

      {/* Stats grid */}
      <div className="grid grid-cols-2 gap-3">
        <div className="bg-card border border-border rounded-xl p-4">
          <div className="text-2xl font-bold text-primary">{avgScore}</div>
          <div className="text-xs text-muted-foreground mt-1">Avg score / day</div>
        </div>
        <div className="bg-card border border-border rounded-xl p-4">
          <div className="text-2xl font-bold text-green-400">{streakDays}</div>
          <div className="text-xs text-muted-foreground mt-1">Streak days</div>
        </div>
        <div className="bg-card border border-border rounded-xl p-4">
          <div className="text-2xl font-bold text-amber-400">{perfectDays}</div>
          <div className="text-xs text-muted-foreground mt-1">Perfect days (9/9)</div>
        </div>
        <div className="bg-card border border-border rounded-xl p-4">
          <div className="text-2xl font-bold text-foreground">{totalDays}</div>
          <div className="text-xs text-muted-foreground mt-1">Days tracked</div>
        </div>
      </div>

      {/* Charts */}
      {scores.length > 0 ? (
        <ProgressCharts scores={scores} />
      ) : (
        <div className="bg-card border border-border rounded-xl p-8 text-center">
          <div className="text-4xl mb-3">📊</div>
          <p className="text-muted-foreground">Start logging meals to see your progress charts</p>
        </div>
      )}
    </div>
  )
}
