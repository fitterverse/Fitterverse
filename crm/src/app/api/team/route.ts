import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/server/supabase'
import { hashPassword } from '@/features/auth/server/password'
import { getSession } from '@/server/session'

export async function GET() {
  const session = await getSession()
  if (!session || session.role !== 'admin') {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const supabase = createClient()
  const { data, error } = await supabase
    .from('crm_users')
    .select('id, email, full_name, role, is_active, created_at')
    .order('created_at', { ascending: true })

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data)
}

export async function POST(req: NextRequest) {
  const session = await getSession()
  if (!session || session.role !== 'admin') {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const { email, full_name, role, password } = await req.json()

  if (!email || !full_name || !role || !password) {
    return NextResponse.json({ error: 'All fields required' }, { status: 400 })
  }

  const validRoles = ['admin', 'master_coach', 'nutritionist', 'trainer', 'sales']
  if (!validRoles.includes(role)) {
    return NextResponse.json({ error: 'Invalid role' }, { status: 400 })
  }

  const password_hash = hashPassword(password)
  const supabase = createClient()

  const { data, error } = await supabase
    .from('crm_users')
    .insert({ email: email.toLowerCase().trim(), full_name, role, password_hash })
    .select('id, email, full_name, role')
    .single()

  if (error) {
    const msg = error.message.includes('unique') ? 'Email already exists' : error.message
    return NextResponse.json({ error: msg }, { status: 400 })
  }

  return NextResponse.json(data, { status: 201 })
}

export async function PATCH(req: NextRequest) {
  const session = await getSession()
  if (!session || session.role !== 'admin') {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const { id, role, is_active } = await req.json()
  if (!id) return NextResponse.json({ error: 'ID required' }, { status: 400 })

  const supabase = createClient()
  const updates: Record<string, unknown> = { updated_at: new Date().toISOString() }
  if (role !== undefined) updates.role = role
  if (is_active !== undefined) updates.is_active = is_active

  const { data, error } = await supabase
    .from('crm_users')
    .update(updates)
    .eq('id', id)
    .select('id, email, full_name, role, is_active')
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data)
}
