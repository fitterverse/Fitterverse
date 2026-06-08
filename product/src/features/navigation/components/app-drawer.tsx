'use client'

import { useEffect } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import {
  Flame,
  Home,
  LifeBuoy,
  LineChart,
  Settings,
  X,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { cn } from '@/shared/lib/utils'

const navItems = [
  { href: '/dashboard', label: 'Today', icon: Home },
  { href: '/streak', label: 'Streak', icon: Flame },
  { href: '/progress', label: 'Progress', icon: LineChart },
  { href: '/settings', label: 'Settings', icon: Settings },
]

interface AppDrawerProps {
  open: boolean
  onClose: () => void
}

export function AppDrawer({ open, onClose }: AppDrawerProps) {
  const pathname = usePathname()

  useEffect(() => {
    if (open) onClose()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pathname])

  return (
    <>
      <div
        className={cn(
          'fixed inset-0 z-40 bg-slate-950/35 transition-opacity',
          open ? 'opacity-100' : 'pointer-events-none opacity-0'
        )}
        onClick={onClose}
      />
      <aside
        className={cn(
          'fixed inset-y-0 left-0 z-50 flex w-[82%] max-w-sm flex-col bg-white shadow-2xl transition-transform duration-200 ease-out',
          open ? 'translate-x-0' : '-translate-x-full'
        )}
      >
        <div className="flex items-center justify-between border-b border-slate-200 px-5 py-6">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.3em] text-slate-400">
              Fitterverse
            </p>
            <h2 className="mt-2 text-3xl font-semibold text-slate-900">Journal</h2>
          </div>
          <Button type="button" variant="ghost" size="icon" onClick={onClose} aria-label="Close navigation">
            <X className="h-5 w-5" />
          </Button>
        </div>

        <nav className="flex-1 space-y-1 px-3 py-5">
          {navItems.map(({ href, label, icon: Icon }) => {
            const active = pathname === href
            return (
              <Link
                key={href}
                href={href}
                className={cn(
                  'flex items-center gap-3 rounded-2xl px-4 py-3 text-base font-medium transition-colors',
                  active
                    ? 'bg-emerald-50 text-emerald-700'
                    : 'text-slate-700 hover:bg-slate-100 hover:text-slate-900'
                )}
              >
                <Icon className="h-5 w-5" />
                <span>{label}</span>
              </Link>
            )
          })}
        </nav>

        <div className="border-t border-slate-200 p-3">
          <a
            href="mailto:support@fitterverse.in?subject=Fitterverse%20Support"
            className="flex items-center gap-3 rounded-2xl px-4 py-3 text-base font-medium text-slate-700 transition-colors hover:bg-slate-100 hover:text-slate-900"
          >
            <LifeBuoy className="h-5 w-5" />
            <span>Feedback &amp; Support</span>
          </a>
        </div>
      </aside>
    </>
  )
}
