'use server'

import { deleteSession, getSession } from '@/server/session'
import { redirect } from 'next/navigation'

export async function signOut() {
  await deleteSession()
  redirect('/login')
}

export async function requireSession() {
  const session = await getSession()
  if (!session) redirect('/login')
  return session!
}

export async function requireSessionSafe() {
  const session = await getSession()
  if (!session) return null
  return session
}
