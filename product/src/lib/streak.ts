import { UserStreak, BadgeSlug, BADGE_DEFINITIONS } from '@/types'

export const MIN_STREAK_POINTS = 6
export const STREAK_BREAK_DAYS = 3 // consecutive bad days before streak breaks

export function calculateNewStreak(
  streak: UserStreak,
  todayPoints: number,
  today: string
): UserStreak {
  const isGoodDay = todayPoints >= MIN_STREAK_POINTS

  if (isGoodDay) {
    const newStreak = streak.current_streak + 1
    return {
      ...streak,
      current_streak: newStreak,
      longest_streak: Math.max(newStreak, streak.longest_streak),
      consecutive_bad_days: 0,
      last_updated: today,
      streak_start_date: streak.streak_start_date || today,
    }
  } else {
    const newBadDays = streak.consecutive_bad_days + 1
    const streakBroken = newBadDays >= STREAK_BREAK_DAYS

    return {
      ...streak,
      current_streak: streakBroken ? 0 : streak.current_streak,
      consecutive_bad_days: streakBroken ? 0 : newBadDays,
      last_updated: today,
      streak_start_date: streakBroken ? null : streak.streak_start_date,
    }
  }
}

export function getBadgesToAward(
  currentStreak: number,
  alreadyEarned: BadgeSlug[],
  isPerfectDay: boolean,
  isFirstMeal: boolean
): BadgeSlug[] {
  const newBadges: BadgeSlug[] = []

  if (isFirstMeal && !alreadyEarned.includes('first_meal')) {
    newBadges.push('first_meal')
  }

  if (isPerfectDay && !alreadyEarned.includes('perfect_day')) {
    newBadges.push('perfect_day')
  }

  for (const badge of BADGE_DEFINITIONS) {
    if (
      badge.requirement > 0 &&
      currentStreak >= badge.requirement &&
      !alreadyEarned.includes(badge.slug)
    ) {
      newBadges.push(badge.slug)
    }
  }

  return newBadges
}

export function getStreakMessage(streak: number, consecutiveBadDays: number): string {
  if (consecutiveBadDays > 0) {
    const remaining = STREAK_BREAK_DAYS - consecutiveBadDays
    return `${remaining} more bad day${remaining === 1 ? '' : 's'} and your streak breaks`
  }
  if (streak === 0) return 'Start your streak today!'
  if (streak < 3) return `${streak} day streak — keep going!`
  if (streak < 7) return `${streak} day streak — you\'re building a habit!`
  if (streak < 21) return `${streak} day streak — solid consistency!`
  if (streak < 90) return `${streak} day streak — impressive commitment!`
  if (streak < 180) return `${streak} day streak — elite level!`
  if (streak < 365) return `${streak} day streak — you\'re a legend in the making!`
  return `${streak} day streak — ABSOLUTE LEGEND! 👑`
}
