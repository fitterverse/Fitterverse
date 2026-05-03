'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Home, Calendar, Trophy, TrendingUp, LogOut } from 'lucide-react'
import { signOut } from '@/app/actions'

const navItems = [
  { href: '/dashboard', icon: Home, label: 'Today' },
  { href: '/history', icon: Calendar, label: 'History' },
  { href: '/progress', icon: TrendingUp, label: 'Progress' },
  { href: '/badges', icon: Trophy, label: 'Badges' },
]

export function BottomNav() {
  const pathname = usePathname()

  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-card border-t border-border z-50">
      <div className="max-w-md mx-auto flex items-center justify-around px-2">
        {navItems.map(({ href, icon: Icon, label }) => {
          const active = pathname === href
          return (
            <Link
              key={href}
              href={href}
              className={`flex flex-col items-center gap-0.5 px-3 py-3 rounded-lg transition-colors ${
                active ? 'text-primary' : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              <Icon className="h-5 w-5" />
              <span className="text-[10px] font-medium">{label}</span>
            </Link>
          )
        })}
        <button
          onClick={async () => {
            const { signOut: firebaseSignOut } = await import('firebase/auth')
            const { auth } = await import('@/lib/firebase/client')
            await firebaseSignOut(auth)
            await fetch('/api/auth/session', { method: 'DELETE' })
            window.location.href = '/login'
          }}
          className="flex flex-col items-center gap-0.5 px-3 py-3 rounded-lg text-muted-foreground hover:text-destructive transition-colors"
        >
          <LogOut className="h-5 w-5" />
          <span className="text-[10px] font-medium">Out</span>
        </button>
      </div>
    </nav>
  )
}
