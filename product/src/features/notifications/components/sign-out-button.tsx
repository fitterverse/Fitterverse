'use client'

import { LogOut } from 'lucide-react'

export function SignOutButton() {
  async function handleSignOut() {
    const { signOut } = await import('firebase/auth')
    const { auth } = await import('@/features/auth/client/firebase')
    await signOut(auth)
    await fetch('/api/auth/session', { method: 'DELETE' })
    window.location.href = '/login'
  }

  return (
    <button
      onClick={handleSignOut}
      className="w-full flex items-center justify-center gap-2 rounded-2xl border border-destructive/30 bg-destructive/8 py-3.5 text-sm font-semibold text-destructive hover:bg-destructive/15 transition-colors"
    >
      <LogOut className="h-4 w-4" />
      Sign out
    </button>
  )
}
