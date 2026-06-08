import type { NutritionTargets, Profile } from '@/shared/types'
import { calculateBMR, calculateTDEE } from '@/features/workouts/lib/calorie-math'

export function getNutritionTargets(profile: Partial<Profile> | null | undefined): NutritionTargets {
  const hasBioData = Boolean(profile?.weight_kg && profile?.height_cm && profile?.age)
  const calorieTarget = hasBioData
    ? Math.round(
        calculateTDEE(
          calculateBMR(
            Number(profile!.weight_kg),
            Number(profile!.height_cm),
            Number(profile!.age)
          ),
          profile?.activity_level ?? 'sedentary'
        )
      )
    : 1800

  const carbs = Math.round((calorieTarget * 0.45) / 4)
  const protein = Math.round((calorieTarget * 0.25) / 4)
  const fat = Math.round((calorieTarget * 0.30) / 9)

  return {
    calorie_target: calorieTarget,
    carbs_g: carbs,
    protein_g: protein,
    fat_g: fat,
  }
}
