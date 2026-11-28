import {
  ArrowDownCircle, BadgePercent, CalendarDays, CreditCard, HandCoins, Receipt, RotateCcw, Scale, UserPlus, type LucideIcon,
} from 'lucide-react'
import type { ColType, ReportType } from '../api/report-builder.api'

export interface ReportMeta {
  id: ReportType
  title: string
  answers: string
  inside: string[]
  icon: LucideIcon
  tone: string
  group: 'Money' | 'Vendors' | 'Customers & cards'
}

export const REPORTS: ReportMeta[] = [
  { id: 'daily', title: 'Daily summary', answers: 'How did each day go?', inside: ['Sales & money in', 'Refunds', 'Commission', 'Visits', 'Sign-ups', 'Payouts'], icon: CalendarDays, tone: 'from-sky-400 to-indigo-600', group: 'Money' },
  { id: 'sales', title: 'Card sales', answers: 'Every card bought — who, where, how they paid', inside: ['Customer & mobile', 'Store', 'Discount & coupon', 'Online / at store', 'Razorpay id'], icon: Receipt, tone: 'from-emerald-400 to-teal-600', group: 'Money' },
  { id: 'refunds', title: 'Refunds', answers: 'What was given back, how and why', inside: ['Amount back', 'Razorpay / store cash', 'Reason', 'Refund id', 'Who did it'], icon: RotateCcw, tone: 'from-violet-500 to-fuchsia-600', group: 'Money' },
  { id: 'commissions', title: 'Commission', answers: 'What Strike earned on each sale', inside: ['Sale amount', 'Rate', 'Commission', 'Pending / settled'], icon: BadgePercent, tone: 'from-orange-400 to-red-600', group: 'Money' },
  { id: 'settlement', title: 'Store settlement', answers: 'Who owes whom — per vendor', inside: ['Online vs at store', 'Strike commission', 'Vendor earned', 'Paid out', 'Balance now'], icon: Scale, tone: 'from-amber-400 to-orange-600', group: 'Vendors' },
  { id: 'payouts', title: 'Vendor payouts', answers: 'Every withdrawal request and how fast it was paid', inside: ['Amount', 'UPI / bank (masked)', 'Reference', 'Hours to decide'], icon: ArrowDownCircle, tone: 'from-rose-400 to-red-600', group: 'Vendors' },
  { id: 'redemptions', title: 'Store visits', answers: 'Every time a card was used at a store', inside: ['Customer', 'Store', 'Amount used', 'What they had'], icon: HandCoins, tone: 'from-cyan-400 to-blue-600', group: 'Customers & cards' },
  { id: 'customers', title: 'New customers', answers: 'Who joined, and what they’ve done since', inside: ['Name & mobile', 'Cards bought', 'Spent', 'Visits', 'Last purchase'], icon: UserPlus, tone: 'from-pink-400 to-rose-600', group: 'Customers & cards' },
  { id: 'cards', title: 'Card performance', answers: 'Which cards sell, get used, and expire unused', inside: ['Sold', 'Collected', 'Used at store', 'Active now', 'Unused on expired'], icon: CreditCard, tone: 'from-violet-400 to-indigo-600', group: 'Customers & cards' },
]

export const reportMeta = (id: string | undefined) => REPORTS.find((r) => r.id === id)
export const isReportType = (v: unknown): v is ReportType => REPORTS.some((r) => r.id === v)

// ── periods (India dates) ──────────────────────────────────────────────────────

export type PresetId = 'today' | 'yesterday' | '7d' | '30d' | 'month' | 'last_month' | 'quarter' | 'year'

/** Today's date in India as YYYY-MM-DD. */
export function indiaToday(): string {
  return new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Kolkata', year: 'numeric', month: '2-digit', day: '2-digit' }).format(new Date())
}

const iso = (d: Date) => d.toISOString().slice(0, 10)
const at = (s: string) => new Date(`${s}T00:00:00Z`)
const addDays = (s: string, n: number) => { const d = at(s); d.setUTCDate(d.getUTCDate() + n); return iso(d) }

export function presetRange(p: PresetId): { from: string; to: string } {
  const t = indiaToday()
  const d = at(t)
  const y = d.getUTCFullYear()
  const m = d.getUTCMonth()
  switch (p) {
    case 'today': return { from: t, to: t }
    case 'yesterday': return { from: addDays(t, -1), to: addDays(t, -1) }
    case '7d': return { from: addDays(t, -6), to: t }
    case '30d': return { from: addDays(t, -29), to: t }
    case 'month': return { from: iso(new Date(Date.UTC(y, m, 1))), to: t }
    case 'last_month': return { from: iso(new Date(Date.UTC(y, m - 1, 1))), to: iso(new Date(Date.UTC(y, m, 0))) }
    case 'quarter': return { from: iso(new Date(Date.UTC(y, Math.floor(m / 3) * 3, 1))), to: t }
    case 'year': return { from: iso(new Date(Date.UTC(m >= 3 ? y : y - 1, 3, 1))), to: t }
  }
}

export const PRESETS: { id: PresetId; label: string }[] = [
  { id: 'today', label: 'Today' },
  { id: 'yesterday', label: 'Yesterday' },
  { id: '7d', label: 'Last 7 days' },
  { id: '30d', label: 'Last 30 days' },
  { id: 'month', label: 'This month' },
  { id: 'last_month', label: 'Last month' },
  { id: 'quarter', label: 'This quarter' },
  { id: 'year', label: 'This financial year' },
]

export function rangeLabel(from: string, to: string): string {
  const f = (s: string, withYear: boolean) => at(s).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', ...(withYear ? { year: 'numeric' } : {}), timeZone: 'UTC' })
  if (from === to) return f(from, true)
  return `${f(from, from.slice(0, 4) !== to.slice(0, 4))} – ${f(to, true)}`
}

// ── cell formatting ────────────────────────────────────────────────────────────

const inr = new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', minimumFractionDigits: 0, maximumFractionDigits: 2 })
const num = new Intl.NumberFormat('en-IN', { maximumFractionDigits: 1 })

export function formatCell(v: unknown, type: ColType): string {
  if (v == null || v === '') return '—'
  switch (type) {
    case 'money': return inr.format(Number(v))
    case 'number': return num.format(Number(v))
    case 'percent': return `${Number(v)}%`
    case 'date': return String(v).length === 10 ? at(String(v)).toLocaleDateString('en-IN', { weekday: 'short', day: 'numeric', month: 'short', timeZone: 'UTC' }) : String(v)
    case 'status': return String(v).replace(/_/g, ' ').toLowerCase()
    default: return String(v)
  }
}

export const STATUS_TONE: Record<string, string> = {
  COMPLETED: 'bg-emerald-500/10 text-emerald-700 dark:text-emerald-300',
  APPROVED: 'bg-emerald-500/10 text-emerald-700 dark:text-emerald-300',
  PROCESSED: 'bg-emerald-500/10 text-emerald-700 dark:text-emerald-300',
  SETTLED: 'bg-emerald-500/10 text-emerald-700 dark:text-emerald-300',
  ACTIVE: 'bg-emerald-500/10 text-emerald-700 dark:text-emerald-300',
  PENDING: 'bg-amber-500/10 text-amber-700 dark:text-amber-300',
  REFUNDED: 'bg-violet-500/10 text-violet-700 dark:text-violet-300',
  REVERSED: 'bg-violet-500/10 text-violet-700 dark:text-violet-300',
  FAILED: 'bg-red-500/10 text-red-700 dark:text-red-300',
  REJECTED: 'bg-red-500/10 text-red-700 dark:text-red-300',
  CANCELLED: 'bg-slate-500/10 text-slate-600 dark:text-slate-300',
  PAUSED: 'bg-slate-500/10 text-slate-600 dark:text-slate-300',
}
