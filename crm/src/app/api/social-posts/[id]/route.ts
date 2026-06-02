import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/server/supabase'
import { getSession } from '@/server/session'
import { parseSocialPostPayload } from '@/features/social/server/payload'
import { canAccessSocial } from '@/features/social/social-shared'

function setupErrorMessage(error: { code?: string; message: string }) {
  if (error.code === '42P01') {
    return 'The social_posts table is missing. Run crm/supabase/social_media_migration.sql first.'
  }

  return error.message
}

export async function PATCH(
  req: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  const session = await getSession()
  if (!session || !canAccessSocial(session.role)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 403 })
  }

  const { id } = await context.params

  try {
    const body = await req.json()
    const supabase = createClient()
    const now = new Date().toISOString()

    const updates =
      body?.action === 'mark_posted'
        ? {
            status: 'posted',
            posted_at: now,
            updated_at: now,
            updated_by: session.id,
          }
        : (() => {
            const payload = parseSocialPostPayload(body)

            return {
              ...payload,
              posted_at: payload.status === 'posted' ? now : null,
              updated_at: now,
              updated_by: session.id,
            }
          })()

    const { data, error } = await supabase
      .from('social_posts')
      .update(updates)
      .eq('id', id)
      .select('id')
      .single()

    if (error || !data) {
      return NextResponse.json(
        { error: setupErrorMessage(error ?? { message: 'Failed to update social post' }) },
        { status: error?.code === '42P01' ? 503 : 500 }
      )
    }

    return NextResponse.json({ ok: true, id: data.id })
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'Invalid request' },
      { status: 400 }
    )
  }
}
