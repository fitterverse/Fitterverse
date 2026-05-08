'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import {
  LayoutDashboard,
  Users,
  UserCog,
  LogOut,
} from 'lucide-react'
import { CrmRole } from '@/server/session'

const NAV = [
  { href: '/dashboard', label: 'Dashboard', icon: LayoutDashboard, roles: ['admin', 'master_coach', 'nutritionist', 'trainer', 'sales'] },
  { href: '/users', label: 'Users', icon: Users, roles: ['admin', 'master_coach', 'nutritionist', 'trainer', 'sales'] },
  { href: '/team', label: 'Team', icon: UserCog, roles: ['admin'] },
]

interface SidebarProps {
  fullName: string
  role: CrmRole
}

const ROLE_LABELS: Record<CrmRole, string> = {
  admin: 'Admin',
  master_coach: 'Master Coach',
  nutritionist: 'Nutritionist',
  trainer: 'Trainer',
  sales: 'Sales',
}

export function Sidebar({ fullName, role }: SidebarProps) {
  const pathname = usePathname()

  async function handleLogout() {
    await fetch('/api/auth/logout', { method: 'POST' })
    window.location.href = '/login'
  }

  const visibleNav = NAV.filter(item => item.roles.includes(role))

  return (
    <aside className="w-60 shrink-0 flex flex-col min-h-screen" style={{ background: '#1A1F1C' }}>
      {/* Logo — brand mark */}
      <div className="flex items-center gap-3 px-6 py-5" style={{ borderBottom: '1px solid rgba(255,255,255,0.08)' }}>
        <svg viewBox="0 0 120 120" width="32" height="32" className="shrink-0 rounded-lg" aria-hidden="true">
          <rect width="120" height="120" rx="20" fill="#0B0F0D"/>
          <circle cx="60" cy="60" r="40" fill="none" stroke="#3FD17A" strokeWidth="4" strokeOpacity="0.35"/>
          <circle cx="88.28" cy="31.72" r="6" fill="#3FD17A"/>
          <path d="M44 34 H80 V46 H56 V58 H74 V70 H56 V86 H44 Z" fill="#3FD17A"/>
        </svg>
        <div>
          <p className="font-semibold text-sm leading-none" style={{ color: '#F5F2EA', fontFamily: 'var(--fv-font-display, system-ui)' }}>Fitterverse</p>
          <p className="text-xs mt-0.5" style={{ color: 'rgba(245,242,234,0.4)', fontFamily: 'var(--fv-font-data, monospace)', letterSpacing: '0.12em' }}>CRM</p>
        </div>
      </div>

      {/* Nav */}
      <nav className="flex-1 px-3 py-4 space-y-1">
        {visibleNav.map(item => {
          const active = pathname.startsWith(item.href)
          return (
            <Link
              key={item.href}
              href={item.href}
              className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-colors"
              style={active
                ? { background: 'oklch(0.72 0.19 145 / 0.12)', color: '#3FD17A', fontWeight: 500 }
                : { color: 'rgba(245,242,234,0.5)' }
              }
              onMouseEnter={e => { if (!active) { (e.currentTarget as HTMLElement).style.color = '#F5F2EA'; (e.currentTarget as HTMLElement).style.background = 'rgba(255,255,255,0.06)'; }}}
              onMouseLeave={e => { if (!active) { (e.currentTarget as HTMLElement).style.color = 'rgba(245,242,234,0.5)'; (e.currentTarget as HTMLElement).style.background = 'transparent'; }}}
            >
              <item.icon size={16} />
              {item.label}
            </Link>
          )
        })}
      </nav>

      {/* Footer */}
      <div className="px-3 pb-4 pt-4" style={{ borderTop: '1px solid rgba(255,255,255,0.08)' }}>
        <div className="px-3 py-2 mb-2">
          <p className="text-sm font-medium truncate" style={{ color: '#F5F2EA' }}>{fullName}</p>
          <p className="text-xs" style={{ color: 'rgba(245,242,234,0.4)', fontFamily: 'var(--fv-font-data, monospace)', letterSpacing: '0.1em' }}>{ROLE_LABELS[role]}</p>
        </div>
        <button
          onClick={handleLogout}
          className="flex items-center gap-3 px-3 py-2 rounded-lg text-sm w-full transition-colors"
          style={{ color: 'rgba(245,242,234,0.4)' }}
          onMouseEnter={e => { (e.currentTarget as HTMLElement).style.color = '#D8462E'; (e.currentTarget as HTMLElement).style.background = 'rgba(216,70,46,0.08)'; }}
          onMouseLeave={e => { (e.currentTarget as HTMLElement).style.color = 'rgba(245,242,234,0.4)'; (e.currentTarget as HTMLElement).style.background = 'transparent'; }}
        >
          <LogOut size={16} />
          Sign out
        </button>
      </div>
    </aside>
  )
}
