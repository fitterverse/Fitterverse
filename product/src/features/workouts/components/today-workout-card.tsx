'use client'

import { useState } from 'react'
import { ChevronDown, ChevronUp, Dumbbell } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import { WorkoutLogger } from './workout-logger'
import { WorkoutLog, WORKOUT_LABELS, WORKOUT_EMOJIS } from '@/shared/types'

interface TodayWorkoutCardProps {
  workouts: WorkoutLog[]
  weightKg: number
}

export function TodayWorkoutCard({ workouts, weightKg }: TodayWorkoutCardProps) {
  const [expanded, setExpanded] = useState(workouts.length === 0)

  const totalCalories = workouts.reduce((sum, w) => sum + (w.calories_burned ?? 0), 0)
  const totalMinutes = workouts.reduce((sum, w) => sum + w.duration_minutes, 0)

  return (
    <div className="bg-card border border-border rounded-xl overflow-hidden">
      {/* Header */}
      <button
        onClick={() => setExpanded(!expanded)}
        className="w-full flex items-center justify-between p-4 text-left"
      >
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10 border border-primary/20 text-primary shrink-0">
            <Dumbbell className="h-4.5 w-4.5" />
          </div>
          <div>
            <div className="font-semibold text-sm">Today&apos;s Workout</div>
            {workouts.length > 0 ? (
              <div className="text-xs text-primary">
                {workouts.length} session{workouts.length > 1 ? 's' : ''} · {totalMinutes} min · ~{totalCalories} kcal burned
              </div>
            ) : (
              <div className="text-xs text-muted-foreground">Tap to log a workout</div>
            )}
          </div>
        </div>
        <div className="flex items-center gap-2">
          {workouts.length > 0 && (
            <div className="flex gap-1">
              {workouts.slice(0, 3).map(w => (
                <span key={w.id} className="text-base">{WORKOUT_EMOJIS[w.workout_type]}</span>
              ))}
            </div>
          )}
          {expanded ? (
            <ChevronUp className="h-4 w-4 text-muted-foreground shrink-0" />
          ) : (
            <ChevronDown className="h-4 w-4 text-muted-foreground shrink-0" />
          )}
        </div>
      </button>

      {/* Logged workouts summary (when collapsed) */}
      {!expanded && workouts.length > 0 && (
        <div className="px-4 pb-3 space-y-1.5 border-t border-border">
          {workouts.map(w => (
            <div key={w.id} className="flex items-center gap-2 text-xs text-muted-foreground pt-2">
              <span>{WORKOUT_EMOJIS[w.workout_type]}</span>
              <span className="text-foreground font-medium">{WORKOUT_LABELS[w.workout_type]}</span>
              <span>·</span>
              <span>{w.duration_minutes} min</span>
              {w.calories_burned && (
                <>
                  <span>·</span>
                  <span className="text-primary font-medium">~{w.calories_burned} kcal</span>
                </>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Expanded: logger */}
      <AnimatePresence>
        {expanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="overflow-hidden"
          >
            <div className="border-t border-border p-4 space-y-4">
              {/* Already logged today */}
              {workouts.length > 0 && (
                <div className="space-y-1.5">
                  <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                    Logged today
                  </p>
                  {workouts.map(w => (
                    <div
                      key={w.id}
                      className="flex items-center gap-2 text-xs bg-primary/5 border border-primary/15 rounded-lg px-3 py-2"
                    >
                      <span>{WORKOUT_EMOJIS[w.workout_type]}</span>
                      <span className="font-medium text-foreground">{WORKOUT_LABELS[w.workout_type]}</span>
                      <span className="text-muted-foreground">· {w.duration_minutes} min</span>
                      {w.calories_burned && (
                        <span className="text-primary font-semibold ml-auto">~{w.calories_burned} kcal</span>
                      )}
                    </div>
                  ))}
                </div>
              )}

              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                {workouts.length > 0 ? 'Log another' : 'Log workout'}
              </p>
              <WorkoutLogger weightKg={weightKg} />
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
