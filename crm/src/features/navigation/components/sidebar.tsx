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
    <aside className="w-60 shrink-0 flex flex-col bg-slate-900 min-h-screen">
      {/* Logo */}
      <div className="flex items-center gap-3 px-6 py-5 border-b border-slate-800">
        <div className="w-8 h-8 rounded-lg bg-green-500 flex items-center justify-center shrink-0">
          <span className="text-white font-bold text-sm">F</span>
        </div>
        <div>
          <p className="text-white font-semibold text-sm leading-none">Fitterverse</p>
          <p className="text-slate-500 text-xs mt-0.5">CRM</p>
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
              className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-colors ${
                active
                  ? 'bg-green-500/10 text-green-400 font-medium'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800'
              }`}
            >
              <item.icon size={16} />
              {item.label}
            </Link>
          )
        })}
      </nav>

      {/* Footer */}
      <div className="px-3 pb-4 border-t border-slate-800 pt-4">
        <div className="px-3 py-2 mb-2">
          <p className="text-slate-200 text-sm font-medium truncate">{fullName}</p>
          <p className="text-slate-500 text-xs">{ROLE_LABELS[role]}</p>
        </div>
        <button
          onClick={handleLogout}
          className="flex items-center gap-3 px-3 py-2 rounded-lg text-sm text-slate-400 hover:text-red-400 hover:bg-slate-800 w-full transition-colors"
        >
          <LogOut size={16} />
          Sign out
        </button>
      </div>
    </aside>
  )
}
