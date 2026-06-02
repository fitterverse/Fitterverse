export const SOCIAL_POST_STATUSES = ['idea', 'draft', 'ready', 'posted'] as const
export type SocialPostStatus = (typeof SOCIAL_POST_STATUSES)[number]

export const SOCIAL_ACCESS_ROLES = [
  'admin',
  'master_coach',
  'nutritionist',
  'trainer',
  'sales',
] as const

export const SOCIAL_PLATFORM_OPTIONS = [
  { value: 'instagram', label: 'Instagram' },
  { value: 'facebook', label: 'Facebook' },
] as const

export type SocialPlatform = (typeof SOCIAL_PLATFORM_OPTIONS)[number]['value']

export const SOCIAL_WINDOW_OPTIONS = [
  { value: 'all', label: 'All dates' },
  { value: 'today', label: 'Today' },
  { value: 'week', label: 'Next 7 days' },
] as const

export interface SocialPostRecord {
  id: string
  title: string
  platforms: SocialPlatform[]
  caption: string
  hashtags: string
  asset_path: string
  planned_for: string | null
  status: SocialPostStatus
  notes: string
  posted_at: string | null
  created_at: string
  updated_at: string
  created_by: string | null
  updated_by: string | null
  created_by_name: string | null
  updated_by_name: string | null
}

export function isSocialPostStatus(value: string): value is SocialPostStatus {
  return SOCIAL_POST_STATUSES.includes(value as SocialPostStatus)
}

export function isSocialPlatform(value: string): value is SocialPlatform {
  return SOCIAL_PLATFORM_OPTIONS.some(option => option.value === value)
}

export function normalizePlatforms(values: unknown): SocialPlatform[] {
  if (!Array.isArray(values)) return []

  return Array.from(
    new Set(
      values
        .filter((value): value is string => typeof value === 'string')
        .map(value => value.trim().toLowerCase())
        .filter(isSocialPlatform)
    )
  )
}

export function canAccessSocial(role: string | null | undefined) {
  return typeof role === 'string' && SOCIAL_ACCESS_ROLES.includes(role as (typeof SOCIAL_ACCESS_ROLES)[number])
}
