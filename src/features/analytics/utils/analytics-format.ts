import type { AnalyticsInsights, SeriesMetric } from '../api/analytics-insights.api'

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']
export const WEEKDAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']

export function bucketLabel(key: string, bucket: AnalyticsInsights['bucket']): string {
  const d = new Date(`${key}T00:00:00`)
  if (bucket === 'month') return `${MONTHS[d.getMonth()]} ${String(d.getFullYear()).slice(2)}`
  return d.toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })
}

/** % change vs the previous period; null when there's nothing to compare with. */
export function change(now?: number, before?: number): number | null {
  const n = Number(now ?? 0)
  const b = Number(before ?? 0)
  if (!b) return n ? null : 0
  return Math.round(((n - b) / b) * 1000) / 10
}

export const METRICS: { id: SeriesMetric; label: string; money: boolean }[] = [
  { id: 'revenue', label: 'Revenue', money: true },
  { id: 'earnings', label: 'Strike earnings', money: true },
  { id: 'sold', label: 'Cards sold', money: false },
  { id: 'redeemed', label: 'Wallet spent', money: true },
  { id: 'customers', label: 'New customers', money: false },
]
