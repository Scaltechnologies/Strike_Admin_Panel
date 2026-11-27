import { format, formatDistanceToNow, parseISO, isValid } from 'date-fns'

/**
 * The backend runs on UTC and sends date-times without a zone, e.g. "2026-11-27T04:07:45.97368".
 * Read as-is, a browser in India would show them 5½ hours early, so a date-time with no zone is
 * treated as UTC. Values that already carry a zone ("…Z", "+05:30") are left alone, and plain
 * dates ("2026-12-01") stay calendar dates so they never shift to another day.
 */
const NO_ZONE_DATE_TIME = /^\d{4}-\d{2}-\d{2}[T ]\d{2}:\d{2}(:\d{2}(\.\d+)?)?$/

export function parseServerDate(date: string | Date | null | undefined): Date {
  if (date == null) return new Date(NaN)
  if (date instanceof Date) return date
  const s = date.trim()
  if (NO_ZONE_DATE_TIME.test(s)) {
    // Keep at most milliseconds: Java sends up to 9 fractional digits.
    const normalised = s.replace(' ', 'T').replace(/(\.\d{3})\d+$/, '$1')
    return parseISO(`${normalised}Z`)
  }
  return parseISO(s)
}

/** A value from <input type="datetime-local"> (the admin's own clock) -> what the server expects (UTC, no zone). */
export function toServerDateTime(localValue: string): string {
  if (!localValue) return ''
  const d = new Date(localValue)
  return isValid(d) ? d.toISOString().slice(0, 19) : ''
}

/** A server date-time -> the value for <input type="datetime-local"> in the admin's own clock. */
export function toLocalInputValue(serverValue: string | null | undefined): string {
  if (!serverValue) return ''
  const d = parseServerDate(serverValue)
  return isValid(d) ? format(d, "yyyy-MM-dd'T'HH:mm") : ''
}

export function formatDate(date: string | Date, pattern = 'MMM dd, yyyy'): string {
  const parsed = parseServerDate(date)
  if (!isValid(parsed)) return '—'
  return format(parsed, pattern)
}

export function formatDateTime(date: string | Date): string {
  return formatDate(date, 'MMM dd, yyyy HH:mm')
}

export function formatRelative(date: string | Date): string {
  const parsed = parseServerDate(date)
  if (!isValid(parsed)) return '—'
  return formatDistanceToNow(parsed, { addSuffix: true })
}

export function formatTime(date: string | Date): string {
  return formatDate(date, 'HH:mm')
}

export function isExpired(date: string | Date): boolean {
  const parsed = parseServerDate(date)
  return isValid(parsed) && parsed < new Date()
}

export function toISOString(date: Date): string {
  return date.toISOString()
}
