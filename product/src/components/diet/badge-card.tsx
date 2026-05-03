'use client'

import { motion } from 'framer-motion'
import { BadgeDefinition, UserBadge } from '@/types'
import { format } from 'date-fns'

interface BadgeCardProps {
  definition: BadgeDefinition
  earned?: UserBadge | null
  currentStreak?: number
}

export function BadgeCard({ definition, earned, currentStreak = 0 }: BadgeCardProps) {
  const isEarned = !!earned
  const progress = definition.requirement > 0
    ? Math.min(currentStreak / definition.requirement, 1)
    : isEarned ? 1 : 0

  return (
    <motion.div
      initial={{ scale: 0.9, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      whileHover={{ scale: 1.02 }}
      className={`relative rounded-xl border p-4 transition-all ${
        isEarned
          ? 'border-opacity-50 bg-card'
          : 'border-border bg-card/50 opacity-60'
      }`}
      style={isEarned ? { borderColor: definition.color + '50' } : {}}
    >
      {/* Glow for earned */}
      {isEarned && (
        <div
          className="absolute inset-0 rounded-xl opacity-5"
          style={{ background: `radial-gradient(circle at center, ${definition.color}, transparent)` }}
        />
      )}

      <div className="relative flex flex-col items-center text-center gap-2">
        <div
          className="text-4xl w-16 h-16 flex items-center justify-center rounded-full"
          style={isEarned ? { backgroundColor: definition.color + '20' } : { backgroundColor: '#ffffff10' }}
        >
          {isEarned ? definition.icon : '🔒'}
        </div>

        <div>
          <div className={`text-sm font-bold ${isEarned ? 'text-foreground' : 'text-muted-foreground'}`}>
            {definition.name}
          </div>
          <div className="text-xs text-muted-foreground mt-0.5">{definition.description}</div>
        </div>

        {isEarned ? (
          <div className="text-xs font-medium px-2 py-0.5 rounded-full" style={{ backgroundColor: definition.color + '20', color: definition.color }}>
            Earned {format(new Date(earned.earned_at), 'MMM d')}
          </div>
        ) : definition.requirement > 0 ? (
          <div className="w-full space-y-1">
            <div className="h-1 rounded-full bg-secondary overflow-hidden">
              <div
                className="h-full rounded-full transition-all duration-500"
                style={{ width: `${progress * 100}%`, backgroundColor: definition.color }}
              />
            </div>
            <div className="text-xs text-muted-foreground">
              {currentStreak}/{definition.requirement} days
            </div>
          </div>
        ) : (
          <div className="text-xs text-muted-foreground">Not yet earned</div>
        )}
      </div>
    </motion.div>
  )
}

export function NewBadgeToast({ definition }: { definition: BadgeDefinition }) {
  return (
    <div className="flex items-center gap-3 p-3 rounded-xl border" style={{ borderColor: definition.color + '50', backgroundColor: definition.color + '10' }}>
      <span className="text-3xl">{definition.icon}</span>
      <div>
        <div className="font-bold text-sm">Badge Unlocked!</div>
        <div className="text-sm">{definition.name}</div>
        <div className="text-xs text-muted-foreground">{definition.description}</div>
      </div>
    </div>
  )
}
