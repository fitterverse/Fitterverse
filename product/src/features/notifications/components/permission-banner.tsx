'use client'

import { useEffect, useState } from 'react'
import { Bell, X } from 'lucide-react'
import { useNotificationPermission } from '../hooks/use-notification-permission'
import { saveNotificationPreferences } from '../server/actions'

const DISMISSED_KEY = 'fv_notif_banner_dismissed'

export function NotificationPermissionBanner() {
  const { permission, loading, enable } = useNotificationPermission()
  const [dismissed, setDismissed] = useState(true) // hidden by default, shown after hydration

  useEffect(() => {
    const wasDismissed = localStorage.getItem(DISMISSED_KEY) === '1'
    setDismissed(wasDismissed)
  }, [])

  if (dismissed || permission !== 'default') return null

  async function handleEnable() {
    const token = await enable()
    if (token) {
      // Auto-enable notifications in preferences with sensible defaults
      await saveNotificationPreferences({ enabled: true })
    }
  }

  function handleDismiss() {
    localStorage.setItem(DISMISSED_KEY, '1')
    setDismissed(true)
  }

  return (
    <div className="fixed bottom-20 left-0 right-0 z-40 px-4">
      <div className="mx-auto max-w-md rounded-2xl border border-primary/25 bg-card shadow-xl shadow-black/30 p-4">
        <div className="flex items-start gap-3">
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-primary/10">
            <Bell className="h-4 w-4 text-primary" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold text-foreground">Stay on track</p>
            <p className="mt-0.5 text-xs leading-5 text-muted-foreground">
              Enable push notifications for meal reminders, streak alerts, and daily motivation.
            </p>
            <div className="mt-3 flex gap-2">
              <button
                onClick={handleEnable}
                disabled={loading}
                className="flex-1 rounded-full bg-primary px-4 py-2 text-xs font-semibold text-primary-foreground disabled:opacity-60 transition-opacity"
              >
                {loading ? 'Enabling…' : 'Enable'}
              </button>
              <button
                onClick={handleDismiss}
                className="rounded-full border border-border px-4 py-2 text-xs font-medium text-muted-foreground hover:text-foreground transition-colors"
              >
                Not now
              </button>
            </div>
          </div>
          <button
            onClick={handleDismiss}
            className="shrink-0 text-muted-foreground hover:text-foreground transition-colors"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      </div>
    </div>
  )
}
