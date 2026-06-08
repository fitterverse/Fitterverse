import type {
  JournalEntry,
  JournalEntryAnalysis,
  JournalParsedJson,
} from '@/shared/types'

export interface EntryDetailInsights {
  structured: {
    rawDetectedName: string | null
    estimatedQuantity: string | null
    durationMinutes: number | null
    repsOrSets: string | null
    activityType: string | null
    intensity: string | null
    muscleFocus: string[]
    flags: string[]
  }
  coach: {
    positiveSignals: string[]
    watchouts: string[]
    nextBestMeal: string | null
    balanceTip: string | null
    hydrationTip: string | null
    recoveryTip: string | null
    fuelTip: string | null
    progressionTip: string | null
    confidenceNote: string | null
  }
}

interface NormalizedCoachSuggestions {
  positiveSignals: string[]
  watchouts: string[]
  nextBestMeal: string | null
  balanceTip: string | null
  hydrationTip: string | null
  recoveryTip: string | null
  fuelTip: string | null
  progressionTip: string | null
  confidenceNote: string | null
}

export function buildEntryDetailInsights(
  entry: JournalEntry,
  analysis: JournalEntryAnalysis | null
): EntryDetailInsights {
  const parsed = (analysis?.parsed_json ?? {}) as JournalParsedJson
  const structured = parseStructured(parsed)
  const coach = mergeCoachSuggestions(
    parseCoachSuggestions(parsed),
    entry.entry_type === 'workout'
      ? buildWorkoutFallbackCoach(analysis, structured)
      : buildFoodFallbackCoach(analysis, structured)
  )

  return {
    structured,
    coach,
  }
}

function parseStructured(parsed: JournalParsedJson) {
  const structured = parsed.structured

  return {
    rawDetectedName: safeString(structured?.raw_detected_name),
    estimatedQuantity: safeString(structured?.estimated_quantity),
    durationMinutes: safeNumber(structured?.duration_minutes),
    repsOrSets: safeString(structured?.reps_or_sets),
    activityType: safeString(structured?.activity_type),
    intensity: safeString(structured?.intensity),
    muscleFocus: safeStringArray(structured?.muscle_focus),
    flags: safeStringArray(structured?.flags).filter(isPresentableFlag),
  }
}

function parseCoachSuggestions(parsed: JournalParsedJson) {
  const coach = parsed.coach

  return {
    positiveSignals: safeStringArray(coach?.positive_signals),
    watchouts: safeStringArray(coach?.watchouts),
    nextBestMeal: safeString(coach?.next_best_meal),
    balanceTip: safeString(coach?.balance_tip),
    hydrationTip: safeString(coach?.hydration_tip),
    recoveryTip: safeString(coach?.recovery_tip),
    fuelTip: safeString(coach?.fuel_tip),
    progressionTip: safeString(coach?.progression_tip),
    confidenceNote: safeString(coach?.confidence_note),
  } satisfies NormalizedCoachSuggestions
}

function buildFoodFallbackCoach(
  analysis: JournalEntryAnalysis | null,
  structured: EntryDetailInsights['structured']
): NormalizedCoachSuggestions {
  const calories = Math.round(analysis?.calories ?? 0)
  const carbs = analysis?.carbs_g ?? 0
  const protein = analysis?.protein_g ?? 0
  const fat = analysis?.fat_g ?? 0
  const nutrients = analysis?.secondary_nutrients ?? {}

  const positiveSignals: string[] = []
  const watchouts: string[] = []

  if (protein >= 20) {
    positiveSignals.push('Protein is reasonably strong for a single log and should help satiety.')
  }
  if ((nutrients.fiber_g ?? 0) >= 5) {
    positiveSignals.push('Fiber looks meaningful here, which is helpful for fullness and steadier energy.')
  }
  if (calories > 0 && calories <= 450 && protein >= 15) {
    positiveSignals.push('This looks like a more balanced calorie-to-protein tradeoff than a typical snack.')
  }
  if (!positiveSignals.length) {
    positiveSignals.push('This entry is now in your journal, which makes the rest of the day easier to balance intentionally.')
  }

  if ((nutrients.sugar_g ?? 0) >= 20) {
    watchouts.push('Sugar is fairly high for one log, so hunger may rebound faster afterward.')
  }
  if ((nutrients.saturated_fat_g ?? 0) >= 10 || fat >= 20) {
    watchouts.push('Fat is on the heavier side here, so the next meal should probably stay lighter.')
  }
  if (protein < 10 && carbs >= 25) {
    watchouts.push('Protein is relatively low compared with carbs, so this may not keep you full for long.')
  }
  if (!watchouts.length && calories >= 700) {
    watchouts.push('This is a heavier-calorie entry, so the next meal should be steadier and more protein-led.')
  }

  return {
    positiveSignals,
    watchouts,
    nextBestMeal:
      protein < 15
        ? 'Next meal: go protein-first with eggs, curd, paneer, tofu, dal, fish, or chicken plus vegetables.'
        : calories >= 700 || (nutrients.sugar_g ?? 0) >= 20
          ? 'Next meal: keep it lighter and steadier, like dal with sabzi, curd with fruit, or grilled protein with salad.'
          : 'Next meal: keep the rhythm going with a balanced plate built around protein, vegetables, and a moderate carb portion.',
    balanceTip:
      carbs >= 40
        ? 'Balance tip: add protein or fiber in the next eating window so energy and appetite stay more stable.'
        : fat >= 20
          ? 'Balance tip: lean toward a lighter, lower-fat next meal with vegetables and hydration.'
          : 'Balance tip: keep the rest of the day simple rather than trying to compensate too hard.',
    hydrationTip:
      calories >= 600
        ? 'Hydration tip: pair this with water now and again over the next hour, especially if the meal was salty or sweet.'
        : 'Hydration tip: a glass of water with or after the meal is enough for most cases here.',
    recoveryTip: null,
    fuelTip: null,
    progressionTip: null,
    confidenceNote:
      structured.estimatedQuantity
        ? `AI estimate used the portion hint "${structured.estimatedQuantity}".`
        : 'AI estimate is based on the text or image you logged, so treat the numbers as directional rather than exact.',
  }
}

function buildWorkoutFallbackCoach(
  analysis: JournalEntryAnalysis | null,
  structured: EntryDetailInsights['structured']
): NormalizedCoachSuggestions {
  const calories = Math.round(analysis?.calories ?? 0)
  const intensity = structured.intensity ?? inferWorkoutIntensity(calories)
  const duration = structured.durationMinutes

  const positiveSignals: string[] = []
  const watchouts: string[] = []

  if (duration && duration >= 25) {
    positiveSignals.push('This was long enough to count as a meaningful training session for the day.')
  }
  if (intensity === 'medium' || intensity === 'high') {
    positiveSignals.push('Effort looks solid enough to support consistency and calorie burn.')
  }
  if (!positiveSignals.length) {
    positiveSignals.push('Even a short logged workout strengthens the habit loop and keeps your day active.')
  }

  if (intensity === 'high') {
    watchouts.push('If form broke down near the end, treat recovery and hydration seriously before the next hard session.')
  } else if (!duration && calories < 120) {
    watchouts.push('The workout may have been brief or lightly described, so the calorie estimate could swing more than usual.')
  }

  return {
    positiveSignals,
    watchouts,
    nextBestMeal: null,
    balanceTip: null,
    hydrationTip:
      calories >= 250 || intensity === 'high'
        ? 'Hydration tip: replace fluids over the next hour, especially if the session was sweaty.'
        : 'Hydration tip: a normal post-workout water refill is probably enough here.',
    recoveryTip:
      intensity === 'high'
        ? 'Recovery: prioritize protein, fluids, and an easier next session for the same muscle groups.'
        : 'Recovery: a normal meal with protein and some walking or stretching later is enough for most cases here.',
    fuelTip:
      calories >= 250 || (duration !== null && duration >= 30)
        ? 'Fuel: aim for protein in the next meal and add carbs if this workout was part of a longer active day.'
        : 'Fuel: no special refuel is needed beyond your normal meal rhythm unless you are training again soon.',
    progressionTip:
      structured.repsOrSets
        ? 'Progression: repeat this later in the week and try a small rep, set, or time increase if recovery feels good.'
        : 'Progression: the next simple win is a small increase in duration, reps, pace, or consistency.',
    confidenceNote:
      duration
        ? `AI estimate used the logged duration of about ${duration} minutes.`
        : 'AI estimate is based on the workout description you logged, so burned calories are directional.',
  }
}

function mergeCoachSuggestions(
  primary: NormalizedCoachSuggestions,
  fallback: NormalizedCoachSuggestions
): NormalizedCoachSuggestions {
  return {
    positiveSignals: primary.positiveSignals.length ? primary.positiveSignals : fallback.positiveSignals,
    watchouts: primary.watchouts.length ? primary.watchouts : fallback.watchouts,
    nextBestMeal: primary.nextBestMeal ?? fallback.nextBestMeal,
    balanceTip: primary.balanceTip ?? fallback.balanceTip,
    hydrationTip: primary.hydrationTip ?? fallback.hydrationTip,
    recoveryTip: primary.recoveryTip ?? fallback.recoveryTip,
    fuelTip: primary.fuelTip ?? fallback.fuelTip,
    progressionTip: primary.progressionTip ?? fallback.progressionTip,
    confidenceNote: primary.confidenceNote ?? fallback.confidenceNote,
  }
}

function inferWorkoutIntensity(calories: number) {
  if (calories >= 300) return 'high'
  if (calories >= 150) return 'medium'
  return 'low'
}

function safeString(value: unknown) {
  if (typeof value !== 'string') return null

  const trimmed = value.trim()
  return trimmed ? trimmed : null
}

function safeStringArray(value: unknown) {
  if (!Array.isArray(value)) return []

  return value
    .map((entry) => safeString(entry))
    .filter((entry): entry is string => Boolean(entry))
}

function safeNumber(value: unknown) {
  if (typeof value !== 'number' || !Number.isFinite(value)) return null
  return value
}

function isPresentableFlag(flag: string) {
  const normalized = flag.toLowerCase()
  if (normalized.includes('ignored')) return false
  if (normalized.includes('low_confidence')) return false
  if (normalized.includes('estimate_only')) return false
  return true
}
