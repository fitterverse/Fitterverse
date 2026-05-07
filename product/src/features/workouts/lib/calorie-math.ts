import type { WorkoutType, WorkoutIntensity } from '@/shared/types'

// Mifflin-St Jeor (gender-neutral: average of male/female constants ≈ -78)
export function calculateBMR(weight_kg: number, height_cm: number, age: number): number {
  return Math.round(10 * weight_kg + 6.25 * height_cm - 5 * age - 78)
}

export const ACTIVITY_MULTIPLIERS: Record<string, number> = {
  sedentary: 1.2,
  light: 1.375,
  moderate: 1.55,
  active: 1.725,
}

export function calculateTDEE(bmr: number, activity_level: string): number {
  return Math.round(bmr * (ACTIVITY_MULTIPLIERS[activity_level] ?? 1.2))
}

// MET values per workout type and intensity
const WORKOUT_MET: Record<WorkoutType, Record<WorkoutIntensity, number>> = {
  running:    { low: 7.0,  moderate: 9.8,  high: 12.5 },
  walking:    { low: 2.5,  moderate: 3.5,  high: 5.0  },
  cycling:    { low: 4.0,  moderate: 6.8,  high: 10.0 },
  swimming:   { low: 5.0,  moderate: 7.0,  high: 9.8  },
  strength:   { low: 3.0,  moderate: 5.0,  high: 6.0  },
  yoga:       { low: 2.5,  moderate: 3.0,  high: 4.0  },
  hiit:       { low: 6.0,  moderate: 8.0,  high: 12.0 },
  dance:      { low: 4.0,  moderate: 6.5,  high: 8.0  },
  sports:     { low: 4.0,  moderate: 7.0,  high: 10.0 },
  stretching: { low: 2.0,  moderate: 2.5,  high: 3.0  },
  other:      { low: 3.0,  moderate: 5.0,  high: 7.0  },
}

export function calculateCaloriesBurned(
  workout_type: WorkoutType,
  intensity: WorkoutIntensity,
  duration_minutes: number,
  weight_kg: number
): number {
  const met = WORKOUT_MET[workout_type]?.[intensity] ?? 5.0
  return Math.round(met * weight_kg * (duration_minutes / 60))
}
