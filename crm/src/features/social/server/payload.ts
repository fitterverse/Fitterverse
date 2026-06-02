import {
  isSocialPostStatus,
  normalizePlatforms,
  SocialPlatform,
  SocialPostStatus,
} from '@/features/social/social-shared'

export interface SocialPostPayload {
  title: string
  platforms: SocialPlatform[]
  caption: string
  hashtags: string
  asset_path: string
  planned_for: string | null
  status: SocialPostStatus
  notes: string
}

export function parseSocialPostPayload(body: unknown): SocialPostPayload {
  const input = body as Record<string, unknown>
  const title = normalizeText(input.title)
  const platforms = normalizePlatforms(input.platforms)
  const status = typeof input.status === 'string' && isSocialPostStatus(input.status)
    ? input.status
    : 'draft'

  if (!title) throw new Error('Title is required')
  if (platforms.length === 0) throw new Error('Choose at least one platform')

  return {
    title,
    platforms,
    caption: normalizeLongText(input.caption),
    hashtags: normalizeLongText(input.hashtags),
    asset_path: normalizeLongText(input.asset_path),
    planned_for: normalizeDateTime(input.planned_for),
    status,
    notes: normalizeLongText(input.notes),
  }
}

function normalizeText(value: unknown) {
  return typeof value === 'string' ? value.trim() : ''
}

function normalizeLongText(value: unknown) {
  return typeof value === 'string' ? value.trim() : ''
}

function normalizeDateTime(value: unknown) {
  if (typeof value !== 'string' || !value.trim()) return null

  const parsed = new Date(value)
  if (Number.isNaN(parsed.valueOf())) throw new Error('Planned date is invalid')

  return parsed.toISOString()
}
