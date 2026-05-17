import Link from 'next/link'
import { Bell, ChevronRight, Shield, Flame } from 'lucide-react'
import { getSession } from '@/server/session'
import { createClient } from '@/server/supabase/server'
import { getNotificationPreferences } from '@/features/notifications/server/queries'
import { SignOutButton } from '@/features/notifications/components/sign-out-button'

export const metadata = { title: 'Settings — Fitterverse' }

export default async function SettingsPage() {
  const session = await getSession()
  const supabase = createClient()

  const [profileResult, prefs] = await Promise.all([
    supabase
      .from('profiles')
      .select('full_name, email, current_streak')
      .eq('id', session!.uid)
      .single(),
    getNotificationPreferences(),
  ])

  const profile = profileResult.data
  const notifStatus = prefs.enabled ? 'On' : 'Off'

  return (
    <div className="space-y-6">
      {/* ── Header ──────────────────────────────────────── */}
      <div>
        <h1 className="text-2xl font-bold text-foreground">Settings</h1>
        <p className="text-sm text-muted-foreground mt-1">
          {profile?.full_name ?? session?.email}
        </p>
      </div>

      {/* ── Profile card ────────────────────────────────── */}
      <div className="rounded-2xl border border-border bg-card px-4 py-4">
        <div className="flex items-center gap-3">
          <div className="flex h-11 w-11 items-center justify-center rounded-full bg-primary/10 text-base font-bold text-primary">
            {(profile?.full_name ?? session?.email ?? 'U').charAt(0).toUpperCase()}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold text-foreground truncate">
              {profile?.full_name ?? 'Your account'}
            </p>
            <p className="text-xs text-muted-foreground truncate">{session?.email}</p>
          </div>
          {(profile as any)?.current_streak > 0 && (
            <div className="flex items-center gap-1 rounded-full border border-primary/25 bg-primary/10 px-2.5 py-1">
              <Flame className="h-3 w-3 text-primary" />
              <span className="text-xs font-semibold text-primary">
                {(profile as any).current_streak}
              </span>
            </div>
          )}
        </div>
      </div>

      {/* ── App settings ────────────────────────────────── */}
      <div>
        <p className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground mb-2">
          App
        </p>
        <nav className="rounded-2xl border border-border bg-card divide-y divide-border overflow-hidden">
          <SettingsRow
            href="/settings/notifications"
            icon={<Bell className="h-4 w-4" />}
            label="Notifications"
            value={notifStatus}
            valueColor={prefs.enabled ? 'text-primary' : undefined}
          />
        </nav>
      </div>

      {/* ── Legal ───────────────────────────────────────── */}
      <div>
        <p className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground mb-2">
          Legal
        </p>
        <nav className="rounded-2xl border border-border bg-card divide-y divide-border overflow-hidden">
          <SettingsRow href="/privacy-policy" icon={<Shield className="h-4 w-4" />} label="Privacy Policy" external />
          <SettingsRow href="/terms" icon={<Shield className="h-4 w-4" />} label="Terms of Service" external />
        </nav>
      </div>

      {/* ── Sign out ─────────────────────────────────────── */}
      <SignOutButton />

      <p className="text-center text-xs text-muted-foreground pb-2">Fitterverse · fitterverse.in</p>
    </div>
  )
}

// ── Sub-components ────────────────────────────────────────────

function SettingsRow({
  href,
  icon,
  label,
  value,
  valueColor,
  external,
}: {
  href: string
  icon: React.ReactNode
  label: string
  value?: string
  valueColor?: string
  external?: boolean
}) {
  return (
    <Link
      href={href}
      target={external ? '_blank' : undefined}
      rel={external ? 'noopener noreferrer' : undefined}
      className="flex items-center gap-3 px-4 py-3.5 hover:bg-muted/30 transition-colors"
    >
      <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-muted text-muted-foreground">
        {icon}
      </span>
      <span className="flex-1 text-sm font-medium text-foreground">{label}</span>
      {value && (
        <span className={`text-xs font-medium ${valueColor ?? 'text-muted-foreground'}`}>
          {value}
        </span>
      )}
      <ChevronRight className="h-4 w-4 text-muted-foreground/50" />
    </Link>
  )
}
