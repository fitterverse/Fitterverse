'use client'

import { motion } from 'framer-motion'
import { UserStreak } from '@/shared/types'
import { getStreakMessage, STREAK_BREAK_DAYS } from '@/features/streaks/lib/streak'

interface StreakDisplayProps {
  streak: UserStreak | null
}

export function StreakDisplay({ streak }: StreakDisplayProps) {
  if (!streak) return null

  const { current_streak, longest_streak, consecutive_bad_days } = streak
  const message = getStreakMessage(current_streak, consecutive_bad_days)
  const graceLeft = STREAK_BREAK_DAYS - consecutive_bad_days

  return (
    <div className="flex items-center justify-between">
      <div className="flex items-center gap-3">
        <motion.div
          className="text-3xl"
          animate={current_streak > 0 ? { scale: [1, 1.1, 1] } : {}}
          transition={{ duration: 1.5, repeat: Infinity, ease: 'easeInOut' }}
        >
          {consecutive_bad_days > 0 ? '⚠️' : current_streak === 0 ? '💤' : '🔥'}
        </motion.div>
        <div>
          <div className="flex items-baseline gap-1">
            <span className="fv-data text-2xl font-bold text-foreground">{current_streak}</span>
            <span className="text-sm text-muted-foreground">day streak</span>
          </div>
          <p className="text-xs text-muted-foreground">{message}</p>
        </div>
      </div>
      <div className="text-right">
        <div className="text-xs text-muted-foreground">Best</div>
        <div className="fv-data text-lg font-bold text-foreground">{longest_streak}</div>
      </div>
    </div>
  )
}

export function StreakGraceDots({ streak }: StreakDisplayProps) {
  if (!streak || streak.consecutive_bad_days === 0) return null

  return (
    <div className="flex items-center gap-2 py-2 px-3 rounded-lg" style={{ background: 'oklch(0.78 0.13 75 / 0.10)', border: '1px solid oklch(0.78 0.13 75 / 0.22)' }}>
      <span className="text-sm" style={{ color: '#E8A95B' }}>⚡</span>
      <div className="flex gap-1">
        {Array.from({ length: STREAK_BREAK_DAYS }).map((_, i) => (
          <div
            key={i}
            className="w-2.5 h-2.5 rounded-full"
            style={{ background: i < streak.consecutive_bad_days ? '#E8A95B' : 'var(--fv-slate, #2C322F)' }}
          />
        ))}
      </div>
      <span className="fv-data text-xs" style={{ color: '#E8A95B' }}>
        {STREAK_BREAK_DAYS - streak.consecutive_bad_days} day{STREAK_BREAK_DAYS - streak.consecutive_bad_days !== 1 ? 's' : ''} grace left
      </span>
    </div>
  )
}
