import {
  endOfWeek,
  format,
  isSameDay,
  isWithinInterval,
  parseISO,
  startOfWeek,
} from 'date-fns'
import type { Settings } from '../types'

export const getWeekInterval = (now: Date, settings: Settings) => {
  const start = startOfWeek(now, { weekStartsOn: settings.weekStartsOn })
  const end = endOfWeek(now, { weekStartsOn: settings.weekStartsOn })
  return { start, end }
}

export const isSameLocalDay = (dateISO: string, reference: Date) =>
  isSameDay(parseISO(dateISO), reference)

export const inInterval = (dateISO: string, start: Date, end: Date) =>
  isWithinInterval(parseISO(dateISO), { start, end })

export const formatDate = (dateISO: string | undefined, fallback = '—') => {
  if (!dateISO) return fallback
  return format(parseISO(dateISO), 'yyyy-MM-dd')
}

export const formatDateTime = (dateISO: string | undefined, fallback = '—') => {
  if (!dateISO) return fallback
  return format(parseISO(dateISO), 'yyyy-MM-dd HH:mm')
}

export const toInputDateTimeValue = (dateISO: string) => {
  const d = parseISO(dateISO)
  const pad = (n: number) => `${n}`.padStart(2, '0')
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(
    d.getHours(),
  )}:${pad(d.getMinutes())}`
}

export const nowISO = () => new Date().toISOString()
