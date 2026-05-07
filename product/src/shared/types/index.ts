export type { FoodItem, MealPlan, MealPlanItem, WorkoutPlan, WorkoutPlanDay, WorkoutPlanExercise, PlanStatus, DayOfWeek, MealSlot, } from './plans'
export { DAY_LABELS, DAY_SHORT, MEAL_SLOT_LABELS, MEAL_SLOT_EMOJIS, MEAL_SLOTS, DAYS_OF_WEEK, scaleMacros } from './plans'

export type MealType = 'breakfast' | 'lunch' | 'dinner'
export type MealRating = 'healthy' | 'medium' | 'junk' | 'skipped'

export const POINTS: Record<MealRating, number> = {
  healthy: 3,
  medium: 2,
  junk: 1,
  skipped: 3, // fasting counts as healthy
}

export const RATING_LABELS: Record<MealRating, string> = {
  healthy: 'Healthy',
  medium: 'Medium',
  junk: 'Junk',
  skipped: 'Skipped (Fasting)',
}

export const RATING_COLORS: Record<MealRating, string> = {
  healthy: '#22c55e',
  medium: '#f59e0b',
  junk: '#ef4444',
  skipped: '#6366f1',
}

export const MEAL_LABELS: Record<MealType, string> = {
  breakfast: 'Breakfast',
  lunch: 'Lunch',
  dinner: 'Dinner',
}

export const MEAL_EMOJIS: Record<MealType, string> = {
  breakfast: '🌅',
  lunch: '☀️',
  dinner: '🌙',
}

export interface MealLog {
  id: string
  user_id: string
  date: string // YYYY-MM-DD
  meal_type: MealType
  rating: MealRating | null
  calories: number | null
  note: string | null
  points: number | null
  created_at: string
  updated_at: string
}

export interface DailyScore {
  id: string
  user_id: string
  date: string
  total_points: number
  meals_logged: number
  is_streak_day: boolean
}

export interface UserStreak {
  user_id: string
  current_streak: number
  longest_streak: number
  consecutive_bad_days: number
  last_updated: string | null
  streak_start_date: string | null
}

export interface UserBadge {
  id: string
  user_id: string
  badge_slug: BadgeSlug
  earned_at: string
}

export type BadgeSlug =
  | 'streak_1'
  | 'streak_3'
  | 'streak_7'
  | 'streak_21'
  | 'streak_90'
  | 'streak_180'
  | 'streak_365'
  | 'first_meal'
  | 'perfect_day'

export interface BadgeDefinition {
  slug: BadgeSlug
  name: string
  description: string
  icon: string
  color: string
  requirement: number // streak days needed (0 for special badges)
}

export const BADGE_DEFINITIONS: BadgeDefinition[] = [
  {
    slug: 'first_meal',
    name: 'First Bite',
    description: 'Logged your very first meal',
    icon: '🍽️',
    color: '#6366f1',
    requirement: 0,
  },
  {
    slug: 'perfect_day',
    name: 'Perfect Day',
    description: 'Scored 9/9 in a single day',
    icon: '⭐',
    color: '#f59e0b',
    requirement: 0,
  },
  {
    slug: 'streak_1',
    name: 'Getting Started',
    description: '1 day streak — you showed up!',
    icon: '🔥',
    color: '#f97316',
    requirement: 1,
  },
  {
    slug: 'streak_3',
    name: 'Three-peat',
    description: '3 day streak — building the habit',
    icon: '💪',
    color: '#22c55e',
    requirement: 3,
  },
  {
    slug: 'streak_7',
    name: 'One Full Week',
    description: '7 day streak — you\'re consistent',
    icon: '🏆',
    color: '#3b82f6',
    requirement: 7,
  },
  {
    slug: 'streak_21',
    name: '21-Day Warrior',
    description: '21 day streak — habit locked in',
    icon: '⚡',
    color: '#8b5cf6',
    requirement: 21,
  },
  {
    slug: 'streak_90',
    name: 'Quarter Master',
    description: '90 day streak — serious commitment',
    icon: '💎',
    color: '#06b6d4',
    requirement: 90,
  },
  {
    slug: 'streak_180',
    name: 'Half Year Hero',
    description: '180 day streak — elite level',
    icon: '🚀',
    color: '#ec4899',
    requirement: 180,
  },
  {
    slug: 'streak_365',
    name: 'Legend',
    description: '365 day streak — one full year',
    icon: '👑',
    color: '#fbbf24',
    requirement: 365,
  },
]

// ──────────────────────────────────────────────
// Workouts
// ──────────────────────────────────────────────

export type WorkoutType =
  | 'running'
  | 'walking'
  | 'cycling'
  | 'swimming'
  | 'strength'
  | 'yoga'
  | 'hiit'
  | 'dance'
  | 'sports'
  | 'stretching'
  | 'other'

export type WorkoutIntensity = 'low' | 'moderate' | 'high'

export interface WorkoutLog {
  id: string
  user_id: string
  date: string
  workout_type: WorkoutType
  intensity: WorkoutIntensity
  duration_minutes: number
  calories_burned: number | null
  notes: string | null
  created_at: string
  updated_at: string
}

export const WORKOUT_LABELS: Record<WorkoutType, string> = {
  running: 'Running',
  walking: 'Walking',
  cycling: 'Cycling',
  swimming: 'Swimming',
  strength: 'Strength',
  yoga: 'Yoga',
  hiit: 'HIIT',
  dance: 'Dance',
  sports: 'Sports',
  stretching: 'Stretching',
  other: 'Other',
}

export const WORKOUT_EMOJIS: Record<WorkoutType, string> = {
  running: '🏃',
  walking: '🚶',
  cycling: '🚴',
  swimming: '🏊',
  strength: '🏋️',
  yoga: '🧘',
  hiit: '⚡',
  dance: '💃',
  sports: '⚽',
  stretching: '🤸',
  other: '💪',
}

export const INTENSITY_LABELS: Record<WorkoutIntensity, string> = {
  low: 'Easy',
  moderate: 'Moderate',
  high: 'Intense',
}

export interface Profile {
  id: string
  email: string
  full_name: string | null
  age: number | null
  weight_kg: number | null
  height_cm: number | null
  goal_weight_kg: number | null
  activity_level: 'sedentary' | 'light' | 'moderate' | 'active' | null
  practices_fasting: boolean
  meals_per_day: number
  breakfast_time: string | null
  lunch_time: string | null
  dinner_time: string | null
  calorie_limit_per_meal: number
  dietary_restrictions: string | null
  diet_goal: string | null
  biggest_challenge: string | null
  motivation: string | null
  onboarding_completed: boolean
  created_at: string
}
