import { redirect } from 'next/navigation'
import { getSession } from '@/server/session'
import { getHistoryData } from '@/features/history/server/queries'
import { getBadgesData } from '@/features/badges/server/queries'
import { ProgressCharts } from '@/features/progress/components/progress-charts'
import { BadgeCard } from '@/features/badges/components/badge-card'
import { DailyScore, BADGE_DEFINITIONS, UserBadge, BadgeSlug } from '@/shared/types'
import { format, startOfMonth, endOfMonth, eachDayOfInterval, isSameDay, getDay } from 'date-fns'

function getDotColor(score: DailyScore | undefined): string {
  if (!score || score.meals_logged === 0) return 'bg-secondary'
  if (score.total_points >= 9 || score.is_streak_day) return 'bg-primary'  /* Vital Green */
  if (score.total_points >= 3) return 'bg-[#E8A95B]'   /* Saffron — decent */
  return 'bg-[#D8462E]'                                /* Crimson — at risk */
}

export default async function ProgressPage() {
  const session = await getSession()
  if (!session) redirect('/login')

  const [data, badgesData] = await Promise.all([
    getHistoryData(90),
    getBadgesData(),
  ])

  const scores = (data?.scores || []) as DailyScore[]
  const last30 = scores.slice(0, 30)

  const totalDays = last30.length
  const streakDays = last30.filter(s => s.is_streak_day).length
  const perfectDays = last30.filter(s => s.total_points === 9).length
  const avgScore = totalDays > 0
    ? (last30.reduce((sum, s) => sum + s.total_points, 0) / totalDays).toFixed(1)
    : '—'

  // Calendar heatmap
  const now = new Date()
  const monthStart = startOfMonth(now)
  const monthEnd = endOfMonth(now)
  const daysInMonth = eachDayOfInterval({ start: monthStart, end: monthEnd })
  const firstDayOfWeek = getDay(monthStart)

  function getScoreForDate(date: Date): DailyScore | undefined {
    return scores.find(s => s.date === format(date, 'yyyy-MM-dd'))
  }

  // Badges
  const earned = (badgesData?.earned || []) as UserBadge[]
  const streak = badgesData?.streak
  const currentStreak = streak?.current_streak || 0
  const earnedCount = earned.length
  const totalBadgeCount = BADGE_DEFINITIONS.length

  function getEarned(slug: BadgeSlug): UserBadge | null {
    return earned.find(b => b.badge_slug === slug) || null
  }

  const streakBadges = BADGE_DEFINITIONS.filter(d => d.requirement > 0)
  const specialBadges = BADGE_DEFINITIONS.filter(d => d.requirement === 0)

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Progress</h1>
        <p className="text-sm text-muted-foreground">Your stats, history, and milestones</p>
      </div>

      {/* Stats grid */}
      <div className="grid grid-cols-2 gap-3">
        <div className="bg-card border border-border rounded-xl p-4">
          <div className="text-2xl font-bold text-primary">{avgScore}</div>
          <div className="text-xs text-muted-foreground mt-1">Avg score / day (30d)</div>
        </div>
        <div className="bg-card border border-border rounded-xl p-4">
          <div className="text-2xl font-bold text-green-400">{streakDays}</div>
          <div className="text-xs text-muted-foreground mt-1">Streak days (30d)</div>
        </div>
        <div className="bg-card border border-border rounded-xl p-4">
          <div className="text-2xl font-bold text-amber-400">{perfectDays}</div>
          <div className="text-xs text-muted-foreground mt-1">Perfect days 9/9</div>
        </div>
        <div className="bg-card border border-border rounded-xl p-4">
          <div className="text-2xl font-bold">{totalDays}</div>
          <div className="text-xs text-muted-foreground mt-1">Days tracked</div>
        </div>
      </div>

      {/* Charts */}
      {last30.length > 0 ? (
        <ProgressCharts scores={last30} />
      ) : (
        <div className="bg-card border border-border rounded-xl p-8 text-center">
          <div className="text-4xl mb-3">📊</div>
          <p className="text-muted-foreground text-sm">Start logging meals to see your progress charts</p>
        </div>
      )}

      {/* Calendar heatmap */}
      <div className="bg-card border border-border rounded-xl p-4 space-y-3">
        <h2 className="font-semibold text-sm">{format(now, 'MMMM yyyy')} — consistency view</h2>
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

      {/* Badges section */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
            Badges
          </h2>
          <span className="text-xs text-muted-foreground">{earnedCount}/{totalBadgeCount} earned</span>
        </div>

        {/* Progress bar */}
        <div className="bg-card border border-border rounded-xl p-4 mb-3 space-y-2">
          <div className="flex justify-between text-xs">
            <span className="text-muted-foreground">Collection progress</span>
            <span className="text-primary font-bold">{Math.round((earnedCount / totalBadgeCount) * 100)}%</span>
          </div>
          <div className="h-1.5 rounded-full bg-secondary overflow-hidden">
            <div
              className="h-full rounded-full bg-primary transition-all duration-500"
              style={{ width: `${(earnedCount / totalBadgeCount) * 100}%` }}
            />
          </div>
          {currentStreak > 0 && (() => {
            const nextBadge = streakBadges
              .filter(b => !getEarned(b.slug) && b.requirement > currentStreak)
              .sort((a, b) => a.requirement - b.requirement)[0]
            if (!nextBadge) return (
              <p className="text-xs text-muted-foreground">🔥 {currentStreak}-day streak — all streak badges earned! 👑</p>
            )
            return (
              <p className="text-xs text-muted-foreground">
                🔥 {currentStreak}-day streak — {nextBadge.requirement - currentStreak} day{nextBadge.requirement - currentStreak !== 1 ? 's' : ''} to <span className="text-foreground font-medium">{nextBadge.name}</span> {nextBadge.icon}
              </p>
            )
          })()}
        </div>

        <div className="grid grid-cols-2 gap-3">
          {specialBadges.map(def => (
            <BadgeCard key={def.slug} definition={def} earned={getEarned(def.slug)} currentStreak={currentStreak} />
          ))}
          {streakBadges.map(def => (
            <BadgeCard key={def.slug} definition={def} earned={getEarned(def.slug)} currentStreak={currentStreak} />
          ))}
        </div>
      </div>
    </div>
  )
}
