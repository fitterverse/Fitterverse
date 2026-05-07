'use client'

import { useState } from 'react'
import { Loader2 } from 'lucide-react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { saveWorkout } from '@/features/workouts/server/actions'
import { calculateCaloriesBurned } from '@/features/workouts/lib/calorie-math'
import {
  WorkoutType,
  WorkoutIntensity,
  WORKOUT_LABELS,
  WORKOUT_EMOJIS,
  INTENSITY_LABELS,
} from '@/shared/types'

const WORKOUT_TYPES: WorkoutType[] = [
  'running', 'walking', 'cycling', 'swimming',
  'strength', 'yoga', 'hiit', 'dance', 'sports', 'stretching', 'other',
]

const INTENSITIES: WorkoutIntensity[] = ['low', 'moderate', 'high']

const INTENSITY_COLORS: Record<WorkoutIntensity, string> = {
  low: '#22c55e',
  moderate: '#f59e0b',
  high: '#ef4444',
}

interface WorkoutLoggerProps {
  weightKg: number
}

export function WorkoutLogger({ weightKg }: WorkoutLoggerProps) {
  const [workoutType, setWorkoutType] = useState<WorkoutType>('running')
  const [intensity, setIntensity] = useState<WorkoutIntensity>('moderate')
  const [duration, setDuration] = useState('')
  const [notes, setNotes] = useState('')
  const [saving, setSaving] = useState(false)

  const durationNum = parseInt(duration) || 0
  const estimatedCalories =
    durationNum > 0
      ? calculateCaloriesBurned(workoutType, intensity, durationNum, weightKg)
      : 0

  async function handleSave() {
    if (!duration || durationNum < 1) {
      toast.error('Enter a duration in minutes')
      return
    }
    setSaving(true)
    const result = await saveWorkout({
      workout_type: workoutType,
      intensity,
      duration_minutes: durationNum,
      notes: notes.trim() || null,
    })
    setSaving(false)
    if (result?.error) {
      toast.error(result.error)
    } else {
      toast.success(`Workout logged! ~${result.calories_burned} kcal burned`)
      setDuration('')
      setNotes('')
    }
  }

  return (
    <div className="bg-card border border-border rounded-xl p-4 space-y-4">
      {/* Workout type */}
      <div>
        <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-2">
          Workout type
        </p>
        <div className="grid grid-cols-4 gap-2">
          {WORKOUT_TYPES.map(type => (
            <button
              key={type}
              onClick={() => setWorkoutType(type)}
              className={`flex flex-col items-center gap-1 p-2 rounded-xl border text-center transition-all ${
                workoutType === type
                  ? 'border-primary/50 bg-primary/10'
                  : 'border-border bg-secondary/10 hover:bg-secondary/25'
              }`}
            >
              <span className="text-lg">{WORKOUT_EMOJIS[type]}</span>
              <span className="text-[10px] font-medium leading-tight">
                {WORKOUT_LABELS[type]}
              </span>
            </button>
          ))}
        </div>
      </div>

      {/* Intensity */}
      <div>
        <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-2">
          Intensity
        </p>
        <div className="grid grid-cols-3 gap-2">
          {INTENSITIES.map(level => (
            <button
              key={level}
              onClick={() => setIntensity(level)}
              className={`py-2.5 rounded-xl border text-sm font-semibold transition-all ${
                intensity === level
                  ? 'border-2'
                  : 'border-border bg-secondary/10 hover:bg-secondary/25'
              }`}
              style={
                intensity === level
                  ? {
                      borderColor: INTENSITY_COLORS[level],
                      backgroundColor: INTENSITY_COLORS[level] + '15',
                      color: INTENSITY_COLORS[level],
                    }
                  : {}
              }
            >
              {INTENSITY_LABELS[level]}
            </button>
          ))}
        </div>
      </div>

      {/* Duration */}
      <div className="space-y-1.5">
        <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
          Duration (minutes)
        </label>
        <Input
          type="number"
          placeholder="e.g. 30"
          value={duration}
          onChange={e => setDuration(e.target.value)}
          className="bg-input h-10"
          min={1}
          max={300}
        />
      </div>

      {/* Calorie estimate */}
      {estimatedCalories > 0 && (
        <div className="bg-primary/8 border border-primary/20 rounded-xl px-4 py-3 flex items-center justify-between">
          <span className="text-sm text-foreground/75">Estimated burn</span>
          <span className="text-lg font-bold text-primary">~{estimatedCalories} kcal</span>
        </div>
      )}

      {/* Notes */}
      <div className="space-y-1.5">
        <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
          Notes (optional)
        </label>
        <Input
          placeholder="e.g. Morning run, felt great"
          value={notes}
          onChange={e => setNotes(e.target.value)}
          className="bg-input h-9"
        />
      </div>

      <Button onClick={handleSave} disabled={saving || durationNum < 1} className="w-full">
        {saving && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
        Log Workout
      </Button>
    </div>
  )
}
