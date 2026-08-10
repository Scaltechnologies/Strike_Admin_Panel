import { format, formatDistanceToNow, parseISO, isValid } from 'date-fns'

export function formatDate(date: string | Date, pattern = 'MMM dd, yyyy'): string {
  const parsed = typeof date === 'string' ? parseISO(date) : date
  if (!isValid(parsed)) return '—'
  return format(parsed, pattern)
}

export function formatDateTime(date: string | Date): string {
  return formatDate(date, 'MMM dd, yyyy HH:mm')
}

export function formatRelative(date: string | Date): string {
  const parsed = typeof date === 'string' ? parseISO(date) : date
  if (!isValid(parsed)) return '—'
  return formatDistanceToNow(parsed, { addSuffix: true })
}

export function formatTime(date: string | Date): string {
  return formatDate(date, 'HH:mm')
}

export function isExpired(date: string | Date): boolean {
  const parsed = typeof date === 'string' ? parseISO(date) : date
  return isValid(parsed) && parsed < new Date()
}

export function toISOString(date: Date): string {
  return date.toISOString()
}
