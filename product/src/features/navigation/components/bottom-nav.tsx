'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Home, Apple, Dumbbell, TrendingUp, LogOut } from 'lucide-react'

const navItems = [
  { href: '/dashboard', icon: Home, label: 'Today' },
  { href: '/diet', icon: Apple, label: 'Diet' },
  { href: '/workout', icon: Dumbbell, label: 'Workout' },
  { href: '/progress', icon: TrendingUp, label: 'Progress' },
]

export function BottomNav() {
  const pathname = usePathname()

  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-card border-t border-border z-50">
      <div className="max-w-md mx-auto flex items-center justify-around px-1">
        {navItems.map(({ href, icon: Icon, label }) => {
          const active = pathname === href
          return (
            <Link
              key={href}
              href={href}
              className={`flex flex-col items-center gap-0.5 px-3 py-3 rounded-lg transition-colors min-w-0 ${
                active ? 'text-primary' : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              <Icon className="h-5 w-5 shrink-0" />
              <span className="text-[10px] font-medium">{label}</span>
            </Link>
          )
        })}
        <button
          onClick={async () => {
            const { signOut: firebaseSignOut } = await import('firebase/auth')
            const { auth } = await import('@/features/auth/client/firebase')
            await firebaseSignOut(auth)
            await fetch('/api/auth/session', { method: 'DELETE' })
            window.location.href = '/login'
          }}
          className="flex flex-col items-center gap-0.5 px-3 py-3 rounded-lg text-muted-foreground hover:text-destructive transition-colors"
        >
          <LogOut className="h-5 w-5 shrink-0" />
          <span className="text-[10px] font-medium">Out</span>
        </button>
      </div>
    </nav>
  )
}
