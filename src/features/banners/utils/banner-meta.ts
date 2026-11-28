import type { BannerResponse } from '../types/banner.types'

/** The shape the customer app draws banners in (width ÷ height). */
export const APP_RATIO = 2.2
export const IDEAL_SIZE = { w: 1320, h: 600 }

export type BannerState = 'LIVE' | 'SCHEDULED' | 'ENDED' | 'OFF'

export const STATE_META: Record<BannerState, { label: string; tone: string; dot: string; bar: string }> = {
  LIVE: { label: 'In the app now', tone: 'bg-emerald-500/10 text-emerald-700 dark:text-emerald-300', dot: 'bg-emerald-500', bar: '#00b894' },
  SCHEDULED: { label: 'Starts later', tone: 'bg-sky-500/10 text-sky-700 dark:text-sky-300', dot: 'bg-sky-500', bar: '#257de0' },
  ENDED: { label: 'Ended', tone: 'bg-slate-500/10 text-slate-600 dark:text-slate-300', dot: 'bg-slate-400', bar: '#94a3b8' },
  OFF: { label: 'Switched off', tone: 'bg-amber-500/10 text-amber-700 dark:text-amber-300', dot: 'bg-amber-500', bar: '#f2a600' },
}

/** Today's date in India, YYYY-MM-DD (banners run on India calendar days). */
export function indiaToday(): string {
  return new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Kolkata', year: 'numeric', month: '2-digit', day: '2-digit' }).format(new Date())
}

export function addDays(day: string, n: number): string {
  const d = new Date(`${day}T00:00:00Z`)
  d.setUTCDate(d.getUTCDate() + n)
  return d.toISOString().slice(0, 10)
}

export function daysBetween(a: string, b: string): number {
  return Math.round((new Date(`${b}T00:00:00Z`).getTime() - new Date(`${a}T00:00:00Z`).getTime()) / 86_400_000)
}

/** Would the app show this banner on that day? Same rule as the server. */
export function showsOn(b: Pick<BannerResponse, 'isActive' | 'validFrom' | 'validUntil'>, day: string): boolean {
  return b.isActive && (!b.validFrom || b.validFrom <= day) && (!b.validUntil || b.validUntil >= day)
}

export function bannerState(b: BannerResponse, today = indiaToday()): BannerState {
  if (!b.isActive) return 'OFF'
  if (b.validFrom && b.validFrom > today) return 'SCHEDULED'
  if (b.validUntil && b.validUntil < today) return 'ENDED'
  return 'LIVE'
}

export function dayLabel(day: string, withYear = false): string {
  return new Date(`${day}T00:00:00Z`).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', ...(withYear ? { year: 'numeric' } : {}), timeZone: 'UTC' })
}

/** "Every day until 31 Dec", "From 5 Dec", "1 Dec – 7 Dec", "No dates — shows while switched on" */
export function runText(b: Pick<BannerResponse, 'validFrom' | 'validUntil'>): string {
  if (b.validFrom && b.validUntil) return `${dayLabel(b.validFrom)} – ${dayLabel(b.validUntil, true)}`
  if (b.validFrom) return `From ${dayLabel(b.validFrom, true)}`
  if (b.validUntil) return `Until ${dayLabel(b.validUntil, true)}`
  return 'No dates — shows while switched on'
}

/** "ends in 3 days" / "starts tomorrow" / "ended 2 days ago" */
export function whenText(b: BannerResponse, today = indiaToday()): string | null {
  const s = bannerState(b, today)
  const rel = (n: number) => (n === 0 ? 'today' : n === 1 ? 'tomorrow' : `in ${n} days`)
  if (s === 'SCHEDULED' && b.validFrom) return `starts ${rel(daysBetween(today, b.validFrom))}`
  if (s === 'LIVE' && b.validUntil) { const n = daysBetween(today, b.validUntil); return n === 0 ? 'last day today' : `ends ${rel(n)}` }
  if (s === 'ENDED' && b.validUntil) { const n = daysBetween(b.validUntil, today); return `ended ${n} day${n === 1 ? '' : 's'} ago` }
  return null
}

export interface ImageCheck {
  width: number
  height: number
  sizeKb: number
  ratio: number
  level: 'good' | 'ok' | 'bad'
  notes: string[]
}

/** Looks at a picked image and says how it'll look in the app. */
export function checkImage(width: number, height: number, bytes: number): ImageCheck {
  const ratio = width / height
  const off = Math.abs(ratio - APP_RATIO) / APP_RATIO
  const notes: string[] = []
  let level: ImageCheck['level'] = 'good'
  if (off > 0.25) { level = 'bad'; notes.push(`It's ${ratio >= APP_RATIO ? 'much wider' : 'much taller'} than the app's banner shape — a lot will be cut off.`) }
  else if (off > 0.08) { level = 'ok'; notes.push('A little will be cut off the edges to fit the app’s shape.') }
  if (width < 800) { level = 'bad'; notes.push('It’s small — it may look blurry on phones.') }
  else if (width < IDEAL_SIZE.w) { if (level === 'good') level = 'ok'; notes.push(`Fine, but ${IDEAL_SIZE.w} px wide looks sharper.`) }
  if (bytes > 2_000_000) { if (level === 'good') level = 'ok'; notes.push('It’s a large file — it may load slowly on mobile data.') }
  if (notes.length === 0) notes.push('Perfect fit for the app.')
  return { width, height, sizeKb: Math.round(bytes / 1024), ratio, level, notes }
}
