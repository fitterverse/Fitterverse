import { redirect } from 'next/navigation'
import { getSession } from '@/lib/session'
import { getBadgesData } from '@/app/actions'
import { BadgeCard } from '@/components/diet/badge-card'
import { BADGE_DEFINITIONS, UserBadge, BadgeSlug } from '@/types'

export default async function BadgesPage() {
  const session = await getSession()
  if (!session) redirect('/login')

  const data = await getBadgesData()
  const earned = (data?.earned || []) as UserBadge[]
  const streak = data?.streak
  const currentStreak = streak?.current_streak || 0

  const earnedCount = earned.length
  const totalCount = BADGE_DEFINITIONS.length

  function getEarned(slug: BadgeSlug): UserBadge | null {
    return earned.find(b => b.badge_slug === slug) || null
  }

  const streakBadges = BADGE_DEFINITIONS.filter(d => d.requirement > 0)
  const specialBadges = BADGE_DEFINITIONS.filter(d => d.requirement === 0)

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Badges</h1>
        <p className="text-sm text-muted-foreground">
          {earnedCount}/{totalCount} earned · Keep that streak going!
        </p>
      </div>

      {/* Progress bar */}
      <div className="bg-card border border-border rounded-xl p-4 space-y-2">
        <div className="flex justify-between text-sm">
          <span className="font-medium">Collection Progress</span>
          <span className="text-primary font-bold">{Math.round((earnedCount / totalCount) * 100)}%</span>
        </div>
        <div className="h-2 rounded-full bg-secondary overflow-hidden">
          <div
            className="h-full rounded-full bg-primary transition-all duration-500"
            style={{ width: `${(earnedCount / totalCount) * 100}%` }}
          />
        </div>
        <div className="flex justify-between text-xs text-muted-foreground">
          <span>{earnedCount} earned</span>
          <span>{totalCount - earnedCount} to go</span>
        </div>
      </div>

      {/* Current streak context */}
      {currentStreak > 0 && (
        <div className="bg-primary/10 border border-primary/20 rounded-xl p-3 text-sm">
          <span className="font-medium text-primary">🔥 {currentStreak}-day streak</span>
          {(() => {
            const nextBadge = streakBadges
              .filter(b => !getEarned(b.slug) && b.requirement > currentStreak)
              .sort((a, b) => a.requirement - b.requirement)[0]
            if (!nextBadge) return <span className="text-muted-foreground"> — You've got them all! 👑</span>
            return (
              <span className="text-muted-foreground">
                {' '}— {nextBadge.requirement - currentStreak} day{nextBadge.requirement - currentStreak !== 1 ? 's' : ''} to{' '}
                <span className="text-foreground font-medium">{nextBadge.name}</span> {nextBadge.icon}
              </span>
            )
          })()}
        </div>
      )}

      {/* Special badges */}
      <div>
        <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide mb-3">Special</h2>
        <div className="grid grid-cols-2 gap-3">
          {specialBadges.map(def => (
            <BadgeCard
              key={def.slug}
              definition={def}
              earned={getEarned(def.slug)}
              currentStreak={currentStreak}
            />
          ))}
        </div>
      </div>

      {/* Streak badges */}
      <div>
        <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide mb-3">Streak Milestones</h2>
        <div className="grid grid-cols-2 gap-3">
          {streakBadges.map(def => (
            <BadgeCard
              key={def.slug}
              definition={def}
              earned={getEarned(def.slug)}
              currentStreak={currentStreak}
            />
          ))}
        </div>
      </div>
    </div>
  )
}
