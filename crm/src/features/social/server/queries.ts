import { addDays, startOfDay } from 'date-fns'
import { createClient } from '@/server/supabase'
import {
  isSocialPlatform,
  isSocialPostStatus,
  SocialPlatform,
  SocialPostRecord,
} from '@/features/social/social-shared'

interface SocialPostFilters {
  status?: string
  platform?: string
  window?: string
}

export interface SocialPostsQueryResult {
  posts: SocialPostRecord[]
  tableReady: boolean
  errorMessage: string | null
}

function isMissingTableError(error: { code?: string } | null) {
  return error?.code === '42P01'
}

export async function getSocialPosts({
  status = 'all',
  platform = 'all',
  window = 'all',
}: SocialPostFilters = {}): Promise<SocialPostsQueryResult> {
  const supabase = createClient()

  let query = supabase
    .from('social_posts')
    .select('id, title, platforms, caption, hashtags, asset_path, planned_for, status, notes, posted_at, created_at, updated_at, created_by, updated_by')

  if (isSocialPostStatus(status)) {
    query = query.eq('status', status)
  }

  if (isSocialPlatform(platform)) {
    query = query.contains('platforms', [platform] as SocialPlatform[])
  }

  const today = startOfDay(new Date())
  if (window === 'today') {
    query = query.gte('planned_for', today.toISOString()).lt('planned_for', addDays(today, 1).toISOString())
  } else if (window === 'week') {
    query = query.gte('planned_for', today.toISOString()).lt('planned_for', addDays(today, 7).toISOString())
  }

  const { data, error } = await query
    .order('planned_for', { ascending: true, nullsFirst: false })
    .order('created_at', { ascending: false })

  if (error) {
    return {
      posts: [],
      tableReady: false,
      errorMessage: isMissingTableError(error)
        ? 'The social_posts table is not set up yet. Run crm/supabase/social_media_migration.sql to enable the planner.'
        : error.message,
    }
  }

  const basePosts = (data ?? []) as Array<Omit<SocialPostRecord, 'created_by_name' | 'updated_by_name'>>
  const memberIds = Array.from(
    new Set(
      basePosts
        .flatMap(post => [post.created_by, post.updated_by])
        .filter((id): id is string => Boolean(id))
    )
  )

  let nameMap: Record<string, string> = {}
  if (memberIds.length > 0) {
    const { data: members } = await supabase
      .from('crm_users')
      .select('id, full_name')
      .in('id', memberIds)

    nameMap = Object.fromEntries((members ?? []).map(member => [member.id, member.full_name]))
  }

  return {
    posts: basePosts.map(post => ({
      ...post,
      created_by_name: post.created_by ? (nameMap[post.created_by] ?? null) : null,
      updated_by_name: post.updated_by ? (nameMap[post.updated_by] ?? null) : null,
    })),
    tableReady: true,
    errorMessage: null,
  }
}
