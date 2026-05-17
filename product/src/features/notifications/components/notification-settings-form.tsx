'use client'

import { useEffect, useState, useTransition } from 'react'
import { Bell, BellOff, Check, ChevronRight } from 'lucide-react'
import { toast } from 'sonner'
import { cn } from '@/shared/lib/utils'
import { INTENSITY_LEVELS, NOTIFICATION_CATEGORIES } from '../lib/constants'
import { useNotificationPermission } from '../hooks/use-notification-permission'
import { saveNotificationPreferences } from '../server/actions'
import type { NotificationPreferences } from '../server/queries'
import type { IntensityKey } from '../lib/constants'

interface Props {
  initialPrefs: NotificationPreferences
}

export function NotificationSettingsForm({ initialPrefs }: Props) {
  const { permission, token, loading: permLoading, enable, disable } = useNotificationPermission()
  const [isPending, startTransition] = useTransition()

  const [enabled, setEnabled]                 = useState(initialPrefs.enabled)
  const [intensity, setIntensity]             = useState<IntensityKey>(initialPrefs.intensity)
  const [mealReminders, setMealReminders]     = useState(initialPrefs.meal_reminders)
  const [workoutReminders, setWorkoutReminders] = useState(initialPrefs.workout_reminders)
  const [motivationQuotes, setMotivationQuotes] = useState(initialPrefs.motivation_quotes)
  const [streakAlerts, setStreakAlerts]        = useState(initialPrefs.streak_alerts)

  // Keep `enabled` in sync with browser permission state
  useEffect(() => {
    if (permission === 'denied') setEnabled(false)
  }, [permission])

  async function handleMasterToggle() {
    if (!enabled) {
      // Enable — request browser permission first
      if (permission !== 'granted') {
        const t = await enable()
        if (!t) {
          toast.error(
            permission === 'denied'
              ? 'Notifications are blocked in your browser. Allow them in site settings.'
              : 'Could not enable notifications.'
          )
          return
        }
      }
      setEnabled(true)
      savePrefs({ enabled: true })
    } else {
      await disable()
      setEnabled(false)
      savePrefs({ enabled: false })
    }
  }

  function savePrefs(overrides: Partial<NotificationPreferences> = {}) {
    startTransition(async () => {
      const result = await saveNotificationPreferences({
        enabled,
        intensity,
        meal_reminders:    mealReminders,
        workout_reminders: workoutReminders,
        motivation_quotes: motivationQuotes,
        streak_alerts:     streakAlerts,
        ...overrides,
      })
      if (result.ok) {
        toast.success('Saved')
      } else {
        toast.error('Failed to save. Please try again.')
      }
    })
  }

  const categoryValues: Record<string, boolean> = {
    meal_reminders:    mealReminders,
    workout_reminders: workoutReminders,
    motivation_quotes: motivationQuotes,
    streak_alerts:     streakAlerts,
  }

  const categorySetters: Record<string, (v: boolean) => void> = {
    meal_reminders:    setMealReminders,
    workout_reminders: setWorkoutReminders,
    motivation_quotes: setMotivationQuotes,
    streak_alerts:     setStreakAlerts,
  }

  return (
    <div className="space-y-5">

      {/* ── Permission status card ─────────────────────── */}
      {permission === 'denied' && (
        <div className="rounded-2xl border border-destructive/30 bg-destructive/10 px-4 py-3">
          <p className="text-xs font-semibold text-destructive">Notifications blocked</p>
          <p className="mt-1 text-xs text-muted-foreground leading-5">
            Your browser is blocking notifications for this site. Go to your browser's site
            settings and allow notifications for fitterverse.in, then come back here.
          </p>
        </div>
      )}

      {/* ── Master switch ──────────────────────────────── */}
      <div className="rounded-2xl border border-border bg-card p-4">
        <div className="flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className={cn(
              'flex h-9 w-9 items-center justify-center rounded-full',
              enabled ? 'bg-primary/12' : 'bg-muted'
            )}>
              {enabled
                ? <Bell className="h-4 w-4 text-primary" />
                : <BellOff className="h-4 w-4 text-muted-foreground" />
              }
            </div>
            <div>
              <p className="text-sm font-semibold text-foreground">Push notifications</p>
              <p className="text-xs text-muted-foreground">
                {enabled
                  ? token ? 'Active on this device' : 'Enabled'
                  : 'Off — no notifications sent'}
              </p>
            </div>
          </div>
          <Toggle
            checked={enabled}
            onChange={handleMasterToggle}
            disabled={permLoading || permission === 'denied'}
          />
        </div>
      </div>

      {/* ── Intensity ────────────────────────────────────── */}
      <div className={cn('space-y-2 transition-opacity', !enabled && 'pointer-events-none opacity-40')}>
        <SectionLabel>Intensity</SectionLabel>
        <p className="text-xs text-muted-foreground -mt-1 mb-2">
          Dial this down as the habit becomes automatic. Increase it when you need more accountability.
        </p>
        <div className="grid grid-cols-3 gap-2">
          {INTENSITY_LEVELS.map((level) => {
            const active = intensity === level.key
            return (
              <button
                key={level.key}
                onClick={() => { setIntensity(level.key); savePrefs({ intensity: level.key }) }}
                className={cn(
                  'relative flex flex-col gap-1 rounded-2xl border p-3.5 text-left transition-all',
                  active
                    ? 'border-primary/50 bg-primary/8'
                    : 'border-border bg-card hover:border-border/80'
                )}
              >
                {active && (
                  <span className="absolute right-2.5 top-2.5">
                    <Check className="h-3 w-3 text-primary" />
                  </span>
                )}
                <span className={cn(
                  'text-sm font-semibold',
                  active ? 'text-primary' : 'text-foreground'
                )}>
                  {level.label}
                </span>
                <span className="text-[10px] text-muted-foreground leading-4">
                  {level.sublabel}
                </span>
              </button>
            )
          })}
        </div>
        {/* Description of selected intensity */}
        <p className="text-xs text-muted-foreground px-1">
          {INTENSITY_LEVELS.find((l) => l.key === intensity)?.description}
        </p>
      </div>

      {/* ── Categories ────────────────────────────────────── */}
      <div className={cn('space-y-2 transition-opacity', !enabled && 'pointer-events-none opacity-40')}>
        <SectionLabel>What to send</SectionLabel>
        <div className="rounded-2xl border border-border bg-card divide-y divide-border">
          {NOTIFICATION_CATEGORIES.map((cat) => {
            const Icon = cat.icon
            const value = categoryValues[cat.key]
            return (
              <div key={cat.key} className="flex items-center gap-3 px-4 py-3.5">
                <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-muted">
                  <Icon className="h-4 w-4 text-muted-foreground" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-foreground">{cat.label}</p>
                  <p className="text-xs text-muted-foreground leading-4 mt-0.5">{cat.description}</p>
                </div>
                <Toggle
                  checked={value}
                  onChange={() => {
                    const next = !value
                    categorySetters[cat.key](next)
                    savePrefs({ [cat.key]: next })
                  }}
                />
              </div>
            )
          })}
        </div>
      </div>

      {/* ── Save button (for manual re-save) ─────────────── */}
      <button
        onClick={() => savePrefs()}
        disabled={isPending}
        className="w-full rounded-full bg-primary py-3 text-sm font-semibold text-primary-foreground disabled:opacity-60 transition-opacity"
      >
        {isPending ? 'Saving…' : 'Save preferences'}
      </button>

      <p className="text-center text-xs text-muted-foreground px-4">
        All notifications respect quiet hours (10 PM – 7 AM IST).
        You can turn everything off at any time.
      </p>
    </div>
  )
}

// ── Sub-components ────────────────────────────────────────────

function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <p className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">
      {children}
    </p>
  )
}

function Toggle({
  checked,
  onChange,
  disabled = false,
}: {
  checked: boolean
  onChange: () => void
  disabled?: boolean
}) {
  return (
    <button
      role="switch"
      aria-checked={checked}
      onClick={onChange}
      disabled={disabled}
      className={cn(
        'relative inline-flex h-6 w-10 shrink-0 cursor-pointer items-center rounded-full border-2 border-transparent transition-colors focus-visible:outline-none disabled:cursor-not-allowed disabled:opacity-50',
        checked ? 'bg-primary' : 'bg-muted'
      )}
    >
      <span
        className={cn(
          'pointer-events-none inline-block h-4 w-4 rounded-full bg-white shadow-sm transition-transform',
          checked ? 'translate-x-4' : 'translate-x-0.5'
        )}
      />
    </button>
  )
}
