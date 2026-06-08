import {
  addDays,
  eachDayOfInterval,
  endOfMonth,
  endOfWeek,
  format,
  isValid,
  parseISO,
  startOfMonth,
  startOfWeek,
  subDays,
} from 'date-fns'

export function normalizeDateParam(date?: string | null) {
  if (!date) return format(new Date(), 'yyyy-MM-dd')
  const parsed = parseISO(date)
  return isValid(parsed) ? format(parsed, 'yyyy-MM-dd') : format(new Date(), 'yyyy-MM-dd')
}

export function getWeekStrip(date: string) {
  const selected = parseISO(date)
  return eachDayOfInterval({ start: subDays(selected, 6), end: selected })
}

export function getMonthWindow(date: string) {
  const selected = parseISO(date)
  return {
    monthStart: startOfMonth(selected),
    monthEnd: endOfMonth(selected),
  }
}

export function getWeekBounds(date: string) {
  const selected = parseISO(date)
  return {
    start: startOfWeek(selected, { weekStartsOn: 0 }),
    end: endOfWeek(selected, { weekStartsOn: 0 }),
  }
}

export function listMonthDays(date: string) {
  const { monthStart, monthEnd } = getMonthWindow(date)
  return eachDayOfInterval({ start: monthStart, end: monthEnd })
}

export function buildLoggedAt(date: string) {
  const now = new Date()
  const selected = parseISO(date)
  selected.setHours(now.getHours(), now.getMinutes(), now.getSeconds(), now.getMilliseconds())
  return selected.toISOString()
}

export function shiftDate(date: string, days: number) {
  return format(addDays(parseISO(date), days), 'yyyy-MM-dd')
}
