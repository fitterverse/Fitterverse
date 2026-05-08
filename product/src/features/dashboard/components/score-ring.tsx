'use client'

import { motion } from 'framer-motion'

interface ScoreRingProps {
  score: number
  maxScore?: number
  size?: number
  strokeWidth?: number
}

export function ScoreRing({ score, maxScore = 9, size = 120, strokeWidth = 10 }: ScoreRingProps) {
  const radius = (size - strokeWidth) / 2
  const circumference = 2 * Math.PI * radius
  const progress = Math.min(score / maxScore, 1)
  const offset = circumference * (1 - progress)

  const color =
    score >= 7 ? '#3FD17A' :   /* Vital Green — great day */
    score >= 5 ? '#E8A95B' :   /* Saffron — decent, keep going */
    score > 0  ? '#D8462E' :   /* Crimson — at risk */
                 '#2C322F'     /* Slate — nothing logged yet */

  return (
    <div className="relative flex items-center justify-center" style={{ width: size, height: size }}>
      <svg width={size} height={size} style={{ transform: 'rotate(-90deg)' }}>
        {/* Track */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke="currentColor"
          strokeWidth={strokeWidth}
          className="text-secondary"
        />
        {/* Progress */}
        <motion.circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke={color}
          strokeWidth={strokeWidth}
          strokeLinecap="round"
          strokeDasharray={circumference}
          initial={{ strokeDashoffset: circumference }}
          animate={{ strokeDashoffset: offset }}
          transition={{ duration: 0.8, ease: 'easeOut' }}
        />
      </svg>
      <div className="absolute text-center">
        <div className="fv-data text-2xl font-bold leading-none" style={{ color }}>{score}</div>
        <div className="fv-data text-xs text-muted-foreground">/ {maxScore}</div>
      </div>
    </div>
  )
}
