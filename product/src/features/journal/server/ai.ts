'use server'

import { GoogleGenerativeAI } from '@google/generative-ai'
import type {
  JournalEntryType,
  JournalParsedJson,
  JournalSecondaryNutrients,
} from '@/shared/types'

export interface AnalyzedJournalEntry {
  entry_type: JournalEntryType
  display_title: string
  summary_text: string
  calories: number | null
  carbs_g: number | null
  protein_g: number | null
  fat_g: number | null
  secondary_nutrients: JournalSecondaryNutrients | null
  confidence_score: number | null
  parsed_json: JournalParsedJson
  model_name: string
}

interface AnalyzeJournalEntryInput {
  text?: string | null
  image?: {
    base64: string
    mimeType: string
  } | null
}

const PROMPT = `
You are the AI logging engine for an Android nutrition and fitness journal.

The user may describe food, exercise, or attach a food photo. Classify the entry as either "food" or "workout".
If the image or text is ambiguous, choose the most likely option and keep confidence lower.

Rules:
- Return ONLY valid JSON, no markdown.
- Be concise and practical.
- Use calories as estimated energy. For workouts, calories means calories burned.
- For food, estimate carbs_g, protein_g, fat_g when possible.
- For workouts, carbs_g, protein_g, fat_g should be null.
- secondary_nutrients should be an object with only the keys you can estimate with reasonable confidence.
- Do not invent extreme precision. Rounded estimates are better.
- display_title should be user-friendly and short.
- summary_text should be a 1-2 sentence explanation.

JSON shape:
{
  "entry_type": "food" | "workout",
  "display_title": "string",
  "summary_text": "string",
  "calories": number | null,
  "carbs_g": number | null,
  "protein_g": number | null,
  "fat_g": number | null,
  "secondary_nutrients": {
    "fiber_g": number | null,
    "sugar_g": number | null,
    "added_sugar_g": number | null,
    "net_carbs_g": number | null,
    "saturated_fat_g": number | null,
    "polyunsaturated_fat_g": number | null,
    "monounsaturated_fat_g": number | null,
    "trans_fat_g": number | null,
    "cholesterol_mg": number | null,
    "sodium_mg": number | null,
    "calcium_mg": number | null,
    "iron_mg": number | null,
    "potassium_mg": number | null,
    "vitamin_a_iu": number | null,
    "vitamin_c_mg": number | null,
    "vitamin_d_iu": number | null
  },
  "confidence_score": number,
  "structured": {
    "raw_detected_name": "string | null",
    "estimated_quantity": "string | null",
    "duration_minutes": number | null,
    "reps_or_sets": "string | null",
    "activity_type": "string | null",
    "intensity": "low" | "medium" | "high" | null,
    "muscle_focus": ["string"],
    "flags": ["string"]
  },
  "coach": {
    "positive_signals": ["string"],
    "watchouts": ["string"],
    "next_best_meal": "string | null",
    "balance_tip": "string | null",
    "hydration_tip": "string | null",
    "recovery_tip": "string | null",
    "fuel_tip": "string | null",
    "progression_tip": "string | null",
    "confidence_note": "string | null"
  }
}
`

export async function analyzeJournalEntry({
  text,
  image,
}: AnalyzeJournalEntryInput): Promise<AnalyzedJournalEntry> {
  const apiKey = process.env.GEMINI_API_KEY
  if (!apiKey) {
    throw new Error('GEMINI_API_KEY is missing.')
  }

  const models = getModelCandidates(process.env.GEMINI_MODEL)

  const genAI = new GoogleGenerativeAI(apiKey)
  const promptParts = [
    PROMPT,
    text?.trim() ? `USER_INPUT: ${text.trim()}` : 'USER_INPUT: none',
  ]

  const errors: string[] = []

  for (const modelName of models) {
    try {
      const model = genAI.getGenerativeModel({ model: modelName })
      const parts: Array<string | { inlineData: { data: string; mimeType: string } }> = [
        promptParts.join('\n\n'),
      ]

      if (image) {
        parts.push({ inlineData: { data: image.base64, mimeType: image.mimeType } })
      }

      const result = await model.generateContent(parts)
      const textResponse = result.response.text()
      const parsed = normalizeAnalysisJson(parseJsonResponse(textResponse))

      return {
        ...parsed,
        model_name: modelName,
      }
    } catch (error) {
      errors.push(`${modelName}: ${extractGeminiErrorMessage(error)}`)
    }
  }

  throw new Error(buildGeminiFailureMessage(errors))
}

function parseJsonResponse(raw: string) {
  const cleaned = raw.replace(/```json|```/g, '').trim()
  try {
    return JSON.parse(cleaned)
  } catch {
    const start = cleaned.indexOf('{')
    const end = cleaned.lastIndexOf('}')
    if (start >= 0 && end > start) {
      return JSON.parse(cleaned.slice(start, end + 1))
    }
    throw new Error('The AI response was not valid JSON.')
  }
}

function normalizeAnalysisJson(parsed: any): Omit<AnalyzedJournalEntry, 'model_name'> {
  const entryType: JournalEntryType =
    parsed?.entry_type === 'workout' ? 'workout' : 'food'
  const displayTitle = String(parsed?.display_title || fallbackTitle(entryType, parsed?.structured))
  const summaryText = String(parsed?.summary_text || fallbackSummary(entryType))
  const parsedJson: JournalParsedJson = {
    ...parsed,
    entry_type: entryType,
    display_title: displayTitle,
    summary_text: summaryText,
    structured: normalizeStructured(parsed?.structured),
    coach: normalizeCoach(parsed?.coach),
  }

  return {
    entry_type: entryType,
    display_title: displayTitle,
    summary_text: summaryText,
    calories: normalizeNumber(parsed?.calories),
    carbs_g: entryType === 'food' ? normalizeNumber(parsed?.carbs_g) : null,
    protein_g: entryType === 'food' ? normalizeNumber(parsed?.protein_g) : null,
    fat_g: entryType === 'food' ? normalizeNumber(parsed?.fat_g) : null,
    secondary_nutrients: normalizeSecondaryNutrients(parsed?.secondary_nutrients),
    confidence_score: normalizeConfidence(parsed?.confidence_score),
    parsed_json: parsedJson,
  }
}

function fallbackTitle(entryType: JournalEntryType, structured?: Record<string, unknown>) {
  if (typeof structured?.raw_detected_name === 'string' && structured.raw_detected_name.trim()) {
    return structured.raw_detected_name.trim()
  }
  return entryType === 'food' ? 'Food log' : 'Workout log'
}

function fallbackSummary(entryType: JournalEntryType) {
  return entryType === 'food'
    ? 'Estimated from the description or photo you logged.'
    : 'Estimated from the workout description you logged.'
}

function normalizeNumber(value: unknown) {
  if (value === null || value === undefined || value === '') return null
  const numeric = Number(value)
  if (!Number.isFinite(numeric)) return null
  return Math.round(numeric * 10) / 10
}

function normalizeConfidence(value: unknown) {
  const normalized = normalizeNumber(value)
  if (normalized === null) return null
  if (normalized > 1) return Math.min(1, normalized / 100)
  return Math.max(0, Math.min(1, normalized))
}

function normalizeSecondaryNutrients(value: unknown): JournalSecondaryNutrients | null {
  if (!value || typeof value !== 'object') return null
  const entries = Object.entries(value as Record<string, unknown>)
    .map(([key, entryValue]) => [key, normalizeNumber(entryValue)] as const)
    .filter(([, entryValue]) => entryValue !== null)

  if (!entries.length) return null

  return Object.fromEntries(entries) as JournalSecondaryNutrients
}

function normalizeStructured(value: unknown) {
  if (!value || typeof value !== 'object') return undefined

  const structured = value as Record<string, unknown>

  return {
    raw_detected_name: normalizeString(structured.raw_detected_name),
    estimated_quantity: normalizeString(structured.estimated_quantity),
    duration_minutes: normalizeNumber(structured.duration_minutes),
    reps_or_sets: normalizeString(structured.reps_or_sets),
    activity_type: normalizeString(structured.activity_type),
    intensity: normalizeEnum(structured.intensity, ['low', 'medium', 'high']),
    muscle_focus: normalizeStringArray(structured.muscle_focus),
    flags: normalizeStringArray(structured.flags),
  }
}

function normalizeCoach(value: unknown) {
  if (!value || typeof value !== 'object') return undefined

  const coach = value as Record<string, unknown>

  return {
    positive_signals: normalizeStringArray(coach.positive_signals),
    watchouts: normalizeStringArray(coach.watchouts),
    next_best_meal: normalizeString(coach.next_best_meal),
    balance_tip: normalizeString(coach.balance_tip),
    hydration_tip: normalizeString(coach.hydration_tip),
    recovery_tip: normalizeString(coach.recovery_tip),
    fuel_tip: normalizeString(coach.fuel_tip),
    progression_tip: normalizeString(coach.progression_tip),
    confidence_note: normalizeString(coach.confidence_note),
  }
}

function normalizeString(value: unknown) {
  if (typeof value !== 'string') return null

  const trimmed = value.trim()
  return trimmed ? trimmed : null
}

function normalizeStringArray(value: unknown) {
  if (!Array.isArray(value)) return undefined

  const strings = value
    .map((entry) => normalizeString(entry))
    .filter((entry): entry is string => Boolean(entry))

  return strings.length ? strings : undefined
}

function normalizeEnum<T extends string>(value: unknown, allowed: readonly T[]) {
  if (typeof value !== 'string') return null

  const normalized = value.trim().toLowerCase() as T
  return allowed.includes(normalized) ? normalized : null
}

function getModelCandidates(configuredModel?: string | null) {
  const normalizedConfigured = normalizeModelName(configuredModel)
  const defaults = [
    'gemini-2.5-flash',
    'gemini-2.5-flash-lite',
    'gemini-2.0-flash',
  ]

  const candidates = [
    normalizedConfigured,
    ...defaults,
  ].filter((value): value is string => Boolean(value))

  return Array.from(new Set(candidates))
}

function normalizeModelName(model?: string | null) {
  if (!model) return null

  const normalized = model.replace(/^models\//, '').trim()
  if (!normalized) return null

  // Retired model aliases should not be used as launch defaults.
  if (normalized === 'gemini-1.5-flash') {
    return null
  }

  return normalized
}

function extractGeminiErrorMessage(error: unknown) {
  if (error instanceof Error) return error.message
  return 'Unknown Gemini API error.'
}

function buildGeminiFailureMessage(errors: string[]) {
  const hasModelNotFound = errors.some((message) => message.includes('404'))

  if (hasModelNotFound) {
    return 'Gemini model configuration failed. Set `GEMINI_MODEL=gemini-2.5-flash` or leave it unset to use the built-in stable defaults.'
  }

  return errors[0] || 'The AI analysis failed.'
}
