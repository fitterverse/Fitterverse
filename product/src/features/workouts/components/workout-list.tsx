'use client'

import { useState } from 'react'
import { Trash2, Loader2 } from 'lucide-react'
import { toast } from 'sonner'
import { deleteWorkout } from '@/features/workouts/server/actions'
import {
  WorkoutLog,
  WORKOUT_LABELS,
  WORKOUT_EMOJIS,
  INTENSITY_LABELS,
} from '@/shared/types'

const INTENSITY_COLORS = {
  low: '#22c55e',
  moderate: '#f59e0b',
  high: '#ef4444',
}

interface WorkoutListProps {
  workouts: WorkoutLog[]
}

export function WorkoutList({ workouts }: WorkoutListProps) {
  const [deleting, setDeleting] = useState<string | null>(null)

  if (workouts.length === 0) {
    return (
      <div className="bg-card border border-border rounded-xl p-5 text-center">
        <p className="text-sm text-muted-foreground">No workouts logged today.</p>
        <p className="text-xs text-muted-foreground mt-1">Log one above to start your streak!</p>
      </div>
    )
  }

  async function handleDelete(id: string) {
    setDeleting(id)
    const result = await deleteWorkout(id)
    setDeleting(null)
    if (result?.error) {
      toast.error(result.error)
    } else {
      toast.success('Workout removed')
    }
  }

  const totalCalories = workouts.reduce((sum, w) => sum + (w.calories_burned ?? 0), 0)
  const totalMinutes = workouts.reduce((sum, w) => sum + w.duration_minutes, 0)

  return (
    <div className="space-y-2">
      {workouts.length > 1 && (
        <div className="flex gap-3 mb-2">
          <div className="flex-1 bg-primary/8 border border-primary/20 rounded-xl px-4 py-2.5 text-center">
            <p className="text-xs text-muted-foreground">Total burn</p>
            <p className="text-base font-bold text-primary">{totalCalories} kcal</p>
          </div>
          <div className="flex-1 bg-card border border-border rounded-xl px-4 py-2.5 text-center">
            <p className="text-xs text-muted-foreground">Total time</p>
            <p className="text-base font-bold">{totalMinutes} min</p>
          </div>
        </div>
      )}

      {workouts.map(workout => {
        const color = INTENSITY_COLORS[workout.intensity]
        return (
          <div
            key={workout.id}
            className="bg-card border border-border rounded-xl p-4 flex items-start justify-between gap-3"
          >
            <div className="flex items-start gap-3">
              <span className="text-2xl mt-0.5">{WORKOUT_EMOJIS[workout.workout_type]}</span>
              <div>
                <p className="font-semibold text-sm">{WORKOUT_LABELS[workout.workout_type]}</p>
                <div className="flex items-center gap-2 mt-0.5">
                  <span
                    className="text-xs font-semibold px-2 py-0.5 rounded-full"
                    style={{ backgroundColor: color + '20', color }}
                  >
                    {INTENSITY_LABELS[workout.intensity]}
                  </span>
                  <span className="text-xs text-muted-foreground">
                    {workout.duration_minutes} min
                  </span>
                  {workout.calories_burned && (
                    <span className="text-xs text-primary font-semibold">
                      ~{workout.calories_burned} kcal
                    </span>
                  )}
                </div>
                {workout.notes && (
                  <p className="text-xs text-muted-foreground mt-1">{workout.notes}</p>
                )}
              </div>
            </div>
            <button
              onClick={() => handleDelete(workout.id)}
              disabled={deleting === workout.id}
              className="text-muted-foreground hover:text-destructive transition-colors shrink-0 mt-0.5"
            >
              {deleting === workout.id ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Trash2 className="h-4 w-4" />
              )}
            </button>
          </div>
        )
      })}
    </div>
  )
}
