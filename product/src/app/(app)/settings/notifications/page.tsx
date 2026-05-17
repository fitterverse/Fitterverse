import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'
import { getNotificationPreferences } from '@/features/notifications/server/queries'
import { NotificationSettingsForm } from '@/features/notifications/components/notification-settings-form'

export const metadata = { title: 'Notification Settings — Fitterverse' }

export default async function NotificationSettingsPage() {
  const prefs = await getNotificationPreferences()

  return (
    <div className="space-y-5">
      <div className="flex items-center gap-3">
        <Link
          href="/settings"
          className="flex h-9 w-9 items-center justify-center rounded-full border border-border bg-card text-muted-foreground hover:text-foreground transition-colors"
        >
          <ArrowLeft className="h-4 w-4" />
        </Link>
        <div>
          <h1 className="text-xl font-bold text-foreground">Notifications</h1>
          <p className="text-xs text-muted-foreground mt-0.5">
            Control what you hear from us and when
          </p>
        </div>
      </div>

      <NotificationSettingsForm initialPrefs={prefs} />
    </div>
  )
}
