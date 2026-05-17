import { type NextRequest, NextResponse } from 'next/server'
import { getSession } from '@/server/session'
import { createClient } from '@/server/supabase/server'

// POST — register a new FCM token for the authenticated user
export async function POST(req: NextRequest) {
  const session = await getSession()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const body = await req.json().catch(() => null)
  const token: string | undefined = body?.token
  if (!token || typeof token !== 'string') {
    return NextResponse.json({ error: 'token is required' }, { status: 400 })
  }

  const deviceHint = req.headers.get('user-agent')?.slice(0, 120) ?? null
  const supabase = createClient()

  const { error } = await supabase.from('notification_tokens').upsert(
    {
      user_id:     session.uid,
      token,
      device_hint: deviceHint,
      last_seen:   new Date().toISOString(),
    },
    { onConflict: 'token' }
  )

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ ok: true })
}

// DELETE — unregister a token (user disabled notifications or switched device)
export async function DELETE(req: NextRequest) {
  const session = await getSession()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const body = await req.json().catch(() => null)
  const token: string | undefined = body?.token
  if (!token) return NextResponse.json({ error: 'token is required' }, { status: 400 })

  const supabase = createClient()
  await supabase
    .from('notification_tokens')
    .delete()
    .eq('user_id', session.uid)
    .eq('token', token)

  return NextResponse.json({ ok: true })
}
