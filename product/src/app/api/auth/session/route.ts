import { NextRequest, NextResponse } from 'next/server'
import { createSession, deleteSession } from '@/server/session'
import { createClient } from '@/server/supabase/server'

// POST /api/auth/session — called after Firebase sign-in to create server session
export async function POST(request: NextRequest) {
  const { uid, email } = await request.json()

  if (!uid || !email) {
    return NextResponse.json({ error: 'Missing uid or email' }, { status: 400 })
  }

  // Ensure profile + streak rows exist in Supabase
  const supabase = createClient()
  const { data: existingProfile } = await supabase
    .from('profiles')
    .select('id')
    .eq('id', uid)
    .single()

  let onboardingCompleted = false

  if (!existingProfile) {
    // New user — create profile and streak rows
    await Promise.all([
      supabase.from('profiles').insert({ id: uid, email }),
      supabase.from('user_streaks').insert({ user_id: uid }),
    ])
  } else {
    const { data: profile } = await supabase
      .from('profiles')
      .select('onboarding_completed')
      .eq('id', uid)
      .single()
    onboardingCompleted = profile?.onboarding_completed ?? false
  }

  await createSession(uid, email)
  return NextResponse.json({ ok: true, onboardingCompleted })
}

// DELETE /api/auth/session — sign out
export async function DELETE() {
  await deleteSession()
  return NextResponse.json({ ok: true })
}
