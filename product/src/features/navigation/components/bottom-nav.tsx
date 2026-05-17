'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Apple, Dumbbell, Home, Settings, TrendingUp } from 'lucide-react'

const navItems = [
  { href: '/dashboard', icon: Home,       label: 'Today'    },
  { href: '/diet',      icon: Apple,      label: 'Diet'     },
  { href: '/workout',   icon: Dumbbell,   label: 'Workout'  },
  { href: '/progress',  icon: TrendingUp, label: 'Progress' },
  { href: '/settings',  icon: Settings,   label: 'Settings' },
]

export function BottomNav() {
  const pathname = usePathname()

  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-card border-t border-border z-50">
      <div className="max-w-md mx-auto flex items-center justify-around px-1">
        {navItems.map(({ href, icon: Icon, label }) => {
          // Mark Settings active for all /settings/* routes
          const active = href === '/settings'
            ? pathname.startsWith('/settings')
            : pathname === href
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
      </div>
    </nav>
  )
}
