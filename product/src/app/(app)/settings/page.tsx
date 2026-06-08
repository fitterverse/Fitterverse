import Link from 'next/link'
import { Bell, ChevronRight, LifeBuoy, Shield } from 'lucide-react'
import { getSession } from '@/server/session'
import { createClient } from '@/server/supabase/server'
import { getNotificationPreferences } from '@/features/notifications/server/queries'
import { SignOutButton } from '@/features/notifications/components/sign-out-button'
import { DrawerToggleButton } from '@/features/navigation/components/app-shell'

export const metadata = { title: 'Settings — Fitterverse' }

export default async function SettingsPage() {
  const session = await getSession()
  const supabase = createClient()

  const [profileResult, prefs] = await Promise.all([
    supabase
      .from('profiles')
      .select('full_name, email')
      .eq('id', session!.uid)
      .single(),
    getNotificationPreferences(),
  ])

  const profile = profileResult.data

  return (
    <div className="space-y-6 pb-8">
      <div className="flex items-center gap-4">
        <DrawerToggleButton className="-ml-2 text-slate-900" />
        <div>
          <h1 className="text-4xl font-semibold text-slate-900">Settings</h1>
          <p className="mt-1 text-lg text-slate-500">{profile?.full_name ?? session?.email}</p>
        </div>
      </div>

      <section className="rounded-[2rem] border border-slate-200 bg-white p-5 shadow-sm">
        <div className="flex items-center gap-3">
          <div className="flex h-12 w-12 items-center justify-center rounded-full bg-slate-100 text-lg font-semibold text-slate-900">
            {(profile?.full_name ?? session?.email ?? 'U').charAt(0).toUpperCase()}
          </div>
          <div>
            <p className="text-lg font-semibold text-slate-900">{profile?.full_name ?? 'Your account'}</p>
            <p className="text-sm text-slate-500">{session?.email}</p>
          </div>
        </div>
      </section>

      <div className="space-y-3">
        <SettingsRow
          href="/settings/notifications"
          icon={<Bell className="h-5 w-5" />}
          label="Notifications"
          value={prefs.enabled ? 'On' : 'Off'}
        />
        <SettingsExternalRow
          href="mailto:support@fitterverse.in?subject=Fitterverse%20Support"
          icon={<LifeBuoy className="h-5 w-5" />}
          label="Feedback & Support"
        />
        <SettingsExternalRow href="/privacy-policy" icon={<Shield className="h-5 w-5" />} label="Privacy Policy" />
        <SettingsExternalRow href="/terms" icon={<Shield className="h-5 w-5" />} label="Terms of Service" />
      </div>

      <SignOutButton />
    </div>
  )
}

function SettingsRow({
  href,
  icon,
  label,
  value,
}: {
  href: string
  icon: React.ReactNode
  label: string
  value?: string
}) {
  return (
    <Link
      href={href}
      className="flex items-center gap-3 rounded-[1.6rem] border border-slate-200 bg-white px-4 py-4 shadow-sm"
    >
      <span className="flex h-10 w-10 items-center justify-center rounded-2xl bg-slate-100 text-slate-700">
        {icon}
      </span>
      <span className="flex-1 text-base font-medium text-slate-900">{label}</span>
      {value ? <span className="text-sm font-medium text-slate-500">{value}</span> : null}
      <ChevronRight className="h-5 w-5 text-slate-400" />
    </Link>
  )
}

function SettingsExternalRow({
  href,
  icon,
  label,
}: {
  href: string
  icon: React.ReactNode
  label: string
}) {
  return (
    <Link
      href={href}
      className="flex items-center gap-3 rounded-[1.6rem] border border-slate-200 bg-white px-4 py-4 shadow-sm"
    >
      <span className="flex h-10 w-10 items-center justify-center rounded-2xl bg-slate-100 text-slate-700">
        {icon}
      </span>
      <span className="flex-1 text-base font-medium text-slate-900">{label}</span>
      <ChevronRight className="h-5 w-5 text-slate-400" />
    </Link>
  )
}
