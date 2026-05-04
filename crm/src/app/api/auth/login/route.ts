import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase'
import { verifyPassword } from '@/lib/auth'
import { createSession, CrmSession } from '@/lib/session'

export async function POST(req: NextRequest) {
  const { email, password } = await req.json()

  if (!email || !password) {
    return NextResponse.json({ error: 'Email and password required' }, { status: 400 })
  }

  const supabase = createClient()
  const { data: user, error } = await supabase
    .from('crm_users')
    .select('id, email, full_name, role, password_hash, is_active')
    .eq('email', email.toLowerCase().trim())
    .single()

  if (error || !user || !user.is_active) {
    return NextResponse.json({ error: 'Invalid credentials' }, { status: 401 })
  }

  const valid = verifyPassword(password, user.password_hash)
  if (!valid) {
    return NextResponse.json({ error: 'Invalid credentials' }, { status: 401 })
  }

  const session: CrmSession = {
    id: user.id,
    email: user.email,
    full_name: user.full_name,
    role: user.role,
  }

  await createSession(session)

  return NextResponse.json({ ok: true, role: user.role })
}
