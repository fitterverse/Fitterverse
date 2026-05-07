// ──────────────────────────────────────────────────────────────────
// Shared plan types — used by product app (read) and CRM (read/write)
// ──────────────────────────────────────────────────────────────────

export type PlanStatus = 'draft' | 'published' | 'archived'
export type DayOfWeek = 0 | 1 | 2 | 3 | 4 | 5 | 6  // 0 = Monday
export type MealSlot =
  | 'breakfast'
  | 'morning_snack'
  | 'lunch'
  | 'afternoon_snack'
  | 'dinner'
  | 'evening_snack'

// ── Meal plans ────────────────────────────────────────────────────

export interface MealPlan {
  id: string
  user_id: string
  created_by: string
  title: string
  week_start: string   // 'yyyy-MM-dd' — Monday of target week
  status: PlanStatus
  notes: string | null
  created_at: string
  updated_at: string
}

export interface MealPlanItem {
  id: string
  meal_plan_id: string
  day_of_week: DayOfWeek
  meal_slot: MealSlot
  food_item_id: number | null
  food_name: string
  quantity_g: number
  energy_kcal: number | null
  protein_g: number | null
  fat_g: number | null
  carbs_g: number | null
  fiber_g: number | null
  display_order: number
  notes: string | null
  created_at: string
}

// ── Workout plans ─────────────────────────────────────────────────

export interface WorkoutPlan {
  id: string
  user_id: string
  created_by: string
  title: string
  week_start: string
  status: PlanStatus
  notes: string | null
  created_at: string
  updated_at: string
}

export interface WorkoutPlanDay {
  id: string
  workout_plan_id: string
  day_of_week: DayOfWeek
  label: string | null
  is_rest_day: boolean
  display_order: number
  created_at: string
}

export interface WorkoutPlanExercise {
  id: string
  workout_plan_day_id: string
  exercise_name: string
  sets: number | null
  reps: string | null          // free text: "8-12", "AMRAP", "30s"
  duration_minutes: number | null
  rest_seconds: number | null
  notes: string | null
  display_order: number
  created_at: string
}

// ── Food items (IFCT 2017, per 100g) ─────────────────────────────

export interface FoodItem {
  id: number
  code: string
  name: string
  scientific: string | null
  lang_names: string | null
  food_group: string | null
  energy_kcal: number | null
  water_g: number | null
  protein_g: number | null
  fat_g: number | null
  carbs_g: number | null
  fiber_g: number | null
  sugar_g: number | null
  sat_fat_g: number | null
  cholesterol_mg: number | null
  vit_c_mg: number | null
  vit_a_mcg: number | null
  thiamine_mg: number | null
  riboflavin_mg: number | null
  niacin_mg: number | null
  vit_b6_mg: number | null
  folate_mcg: number | null
  beta_carotene_mcg: number | null
  calcium_mg: number | null
  iron_mg: number | null
  magnesium_mg: number | null
  phosphorus_mg: number | null
  potassium_mg: number | null
  sodium_mg: number | null
  zinc_mg: number | null
}

// ── Display helpers ───────────────────────────────────────────────

export const DAY_LABELS: Record<DayOfWeek, string> = {
  0: 'Monday', 1: 'Tuesday', 2: 'Wednesday', 3: 'Thursday',
  4: 'Friday', 5: 'Saturday', 6: 'Sunday',
}

export const DAY_SHORT: Record<DayOfWeek, string> = {
  0: 'Mon', 1: 'Tue', 2: 'Wed', 3: 'Thu', 4: 'Fri', 5: 'Sat', 6: 'Sun',
}

export const MEAL_SLOT_LABELS: Record<MealSlot, string> = {
  breakfast: 'Breakfast',
  morning_snack: 'Morning Snack',
  lunch: 'Lunch',
  afternoon_snack: 'Afternoon Snack',
  dinner: 'Dinner',
  evening_snack: 'Evening Snack',
}

export const MEAL_SLOT_EMOJIS: Record<MealSlot, string> = {
  breakfast: '🌅',
  morning_snack: '🍎',
  lunch: '☀️',
  afternoon_snack: '🧃',
  dinner: '🌙',
  evening_snack: '🥛',
}

export const MEAL_SLOTS: MealSlot[] = [
  'breakfast', 'morning_snack', 'lunch', 'afternoon_snack', 'dinner', 'evening_snack',
]

export const DAYS_OF_WEEK: DayOfWeek[] = [0, 1, 2, 3, 4, 5, 6]

/** Scale food macros from per-100g to a given quantity */
export function scaleMacros(food: FoodItem, quantity_g: number) {
  const scale = quantity_g / 100
  return {
    energy_kcal: food.energy_kcal != null ? Math.round(food.energy_kcal * scale * 10) / 10 : null,
    protein_g:   food.protein_g   != null ? Math.round(food.protein_g   * scale * 10) / 10 : null,
    fat_g:       food.fat_g       != null ? Math.round(food.fat_g       * scale * 10) / 10 : null,
    carbs_g:     food.carbs_g     != null ? Math.round(food.carbs_g     * scale * 10) / 10 : null,
    fiber_g:     food.fiber_g     != null ? Math.round(food.fiber_g     * scale * 10) / 10 : null,
  }
}
