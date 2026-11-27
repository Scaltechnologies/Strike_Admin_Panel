import { Ban, CheckCircle2, Clock, RotateCcw, XCircle, type LucideIcon } from 'lucide-react'
import type { RedemptionStatusName } from '../api/redemption-insights.api'

export const STATUS_META: Record<RedemptionStatusName, { label: string; icon: LucideIcon; color: string; chip: string; tone: string }> = {
  COMPLETED: {
    label: 'Completed', icon: CheckCircle2, color: '#10b981', tone: 'from-emerald-400 to-teal-600',
    chip: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-400/10 dark:text-emerald-300',
  },
  PENDING: {
    label: 'Waiting for store', icon: Clock, color: '#f59e0b', tone: 'from-amber-400 to-orange-600',
    chip: 'bg-amber-100 text-amber-700 dark:bg-amber-400/10 dark:text-amber-300',
  },
  REJECTED: {
    label: 'Rejected', icon: XCircle, color: '#f43f5e', tone: 'from-rose-400 to-red-600',
    chip: 'bg-rose-100 text-rose-700 dark:bg-rose-400/10 dark:text-rose-300',
  },
  FAILED: {
    label: 'Failed', icon: XCircle, color: '#ef4444', tone: 'from-red-500 to-rose-700',
    chip: 'bg-red-100 text-red-700 dark:bg-red-400/10 dark:text-red-300',
  },
  REVERSED: {
    label: 'Reversed', icon: RotateCcw, color: '#8b5cf6', tone: 'from-violet-400 to-purple-600',
    chip: 'bg-violet-100 text-violet-700 dark:bg-violet-400/10 dark:text-violet-300',
  },
  CANCELLED: {
    label: 'Cancelled by customer', icon: Ban, color: '#94a3b8', tone: 'from-slate-400 to-slate-600',
    chip: 'bg-muted text-muted-foreground',
  },
}

export const statusMeta = (s: string | null | undefined) => STATUS_META[(s ?? 'PENDING') as RedemptionStatusName] ?? STATUS_META.PENDING

/** "2m 10s", "45s", "1h 5m", "3 days" — how long a store took to decide. */
export function humanDuration(seconds: number | null | undefined): string {
  if (seconds == null) return '—'
  const s = Math.max(0, Math.round(seconds))
  if (s < 60) return `${s}s`
  if (s < 3600) return `${Math.floor(s / 60)}m${s % 60 ? ` ${s % 60}s` : ''}`
  if (s < 86400) return `${Math.floor(s / 3600)}h${Math.floor((s % 3600) / 60) ? ` ${Math.floor((s % 3600) / 60)}m` : ''}`
  return `${Math.round(s / 86400)} days`
}

export const initiatedLabel = (by: string | null | undefined) =>
  by === 'USER' ? 'Customer app' : by === 'VENDOR' || by === 'STORE' ? 'Store (vendor app)' : by === 'MANAGER' ? 'Store manager' : by ?? 'Unknown'

const HOURS = ['12 am', '1 am', '2 am', '3 am', '4 am', '5 am', '6 am', '7 am', '8 am', '9 am', '10 am', '11 am',
  '12 pm', '1 pm', '2 pm', '3 pm', '4 pm', '5 pm', '6 pm', '7 pm', '8 pm', '9 pm', '10 pm', '11 pm']
export const hourLabel = (h: number) => HOURS[h] ?? `${h}:00`
export const WEEKDAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']

/** Photo URLs that are real images (skips placeholder values such as "string"). */
export const usablePhoto = (url: string | null | undefined) => (url && /^(https?:\/\/|\/)/.test(url) ? url : null)
