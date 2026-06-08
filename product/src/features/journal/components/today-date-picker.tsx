'use client'

import { startTransition, useMemo, useState } from 'react'
import { usePathname, useRouter, useSearchParams } from 'next/navigation'
import {
  ChevronDown,
  ChevronUp,
} from 'lucide-react'
import {
  eachDayOfInterval,
  endOfMonth,
  format,
  getDay,
  isSameDay,
  parseISO,
  startOfMonth,
  subDays,
} from 'date-fns'
import { cn } from '@/shared/lib/utils'

interface TodayDatePickerProps {
  selectedDate: string
  monthLoggedDates: string[]
  stripLoggedDates: string[]
  prefix?: React.ReactNode
  suffix?: React.ReactNode
}

export function TodayDatePicker({
  selectedDate,
  monthLoggedDates,
  stripLoggedDates,
  prefix,
  suffix,
}: TodayDatePickerProps) {
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const [expanded, setExpanded] = useState(false)

  const selected = useMemo(() => parseISO(selectedDate), [selectedDate])
  const calendarMonth = useMemo(() => startOfMonth(selected), [selected])

  const stripDays = useMemo(
    () => eachDayOfInterval({ start: subDays(selected, 6), end: selected }),
    [selected]
  )
  const monthStart = startOfMonth(calendarMonth)
  const monthEnd = endOfMonth(calendarMonth)
  const monthDays = useMemo(
    () => eachDayOfInterval({ start: monthStart, end: monthEnd }),
    [monthStart, monthEnd]
  )
  const monthSet = useMemo(() => new Set(monthLoggedDates), [monthLoggedDates])
  const stripSet = useMemo(() => new Set(stripLoggedDates), [stripLoggedDates])

  function goToDate(date: Date) {
    const params = new URLSearchParams(searchParams.toString())
    params.set('date', format(date, 'yyyy-MM-dd'))
    startTransition(() => {
      router.push(`${pathname}?${params.toString()}`)
    })
    setExpanded(false)
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          {prefix}
          <button
            type="button"
            onClick={() => setExpanded((value) => !value)}
            className="inline-flex items-center gap-1 text-[1.8rem] font-semibold tracking-tight text-slate-900"
          >
            <span>Today</span>
            {expanded ? <ChevronUp className="mt-1 h-5 w-5" /> : <ChevronDown className="mt-1 h-5 w-5" />}
          </button>
        </div>
        {suffix}
      </div>

      {expanded && (
        <div className="rounded-[1.8rem] border border-slate-200 bg-white px-4 py-4 shadow-lg">
          <div className="flex items-end justify-between">
            <div>
              <p className="text-[1.2rem] font-semibold text-slate-900">
                {format(calendarMonth, 'MMMM')}
              </p>
              <p className="text-[0.82rem] font-medium uppercase tracking-[0.18em] text-slate-400">
                {format(calendarMonth, 'yyyy')}
              </p>
            </div>
            <p className="text-[0.8rem] text-slate-400">Pick a date</p>
          </div>

          <div className="mt-4 grid grid-cols-7 gap-y-3 text-center text-[0.72rem] font-medium uppercase tracking-[0.14em] text-slate-400">
            {['S', 'M', 'T', 'W', 'T', 'F', 'S'].map((label, index) => (
              <span key={`${label}-${index}`}>{label}</span>
            ))}
          </div>

          <div className="mt-3 grid grid-cols-7 gap-y-2.5 text-center">
            {Array.from({ length: getDay(monthStart) }).map((_, index) => (
              <span key={`empty-${index}`} />
            ))}

            {monthDays.map((day) => {
              const dateKey = format(day, 'yyyy-MM-dd')
              const isSelected = isSameDay(day, selected)
              const isLogged = monthSet.has(dateKey)

              return (
                <button
                  key={dateKey}
                  type="button"
                  onClick={() => goToDate(day)}
                  className={cn(
                    'relative mx-auto flex h-10.5 w-10.5 items-center justify-center rounded-2xl text-[1rem] font-medium transition-colors',
                    isSelected
                      ? 'border border-emerald-400 bg-emerald-50 text-slate-900'
                      : isLogged
                        ? 'bg-emerald-50 text-slate-900'
                        : 'text-slate-400 hover:bg-slate-100'
                  )}
                >
                  {format(day, 'd')}
                  {isLogged && !isSelected ? (
                    <span className="absolute bottom-1.5 h-1.5 w-1.5 rounded-full bg-emerald-500" />
                  ) : null}
                </button>
              )
            })}
          </div>
        </div>
      )}

      <div className="grid grid-cols-7 gap-2">
        {stripDays.map((day) => {
          const dateKey = format(day, 'yyyy-MM-dd')
          const isSelected = isSameDay(day, selected)
          const isLogged = stripSet.has(dateKey)

          return (
            <button
              key={dateKey}
              type="button"
              onClick={() => goToDate(day)}
              className={cn(
                'flex min-w-0 flex-col items-center gap-1 rounded-[1.35rem] border px-1 py-2.5 text-center transition-colors',
                isSelected
                  ? 'border-emerald-400 bg-emerald-50'
                  : isLogged
                    ? 'border-transparent bg-emerald-50/80'
                    : 'border-transparent bg-white'
              )}
            >
              <span className="text-[0.76rem] font-medium text-slate-600">{format(day, 'EEE')}</span>
              <span className="text-[1.75rem] font-medium leading-none text-slate-900">{format(day, 'd')}</span>
            </button>
          )
        })}
      </div>
    </div>
  )
}
