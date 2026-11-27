import { Banknote, CheckCircle2, Clock, Smartphone, XCircle, type LucideIcon } from 'lucide-react'
import type { PayoutMethod, PayoutStatus } from '../api/withdrawal-insights.api'

export const STATUS_META: Record<PayoutStatus, { label: string; icon: LucideIcon; chip: string; tone: string; color: string }> = {
  PENDING: { label: 'Waiting to be paid', icon: Clock, chip: 'bg-amber-100 text-amber-700 dark:bg-amber-400/10 dark:text-amber-300', tone: 'from-amber-400 to-orange-600', color: '#f59e0b' },
  APPROVED: { label: 'Paid', icon: CheckCircle2, chip: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-400/10 dark:text-emerald-300', tone: 'from-emerald-400 to-teal-600', color: '#10b981' },
  REJECTED: { label: 'Rejected', icon: XCircle, chip: 'bg-rose-100 text-rose-700 dark:bg-rose-400/10 dark:text-rose-300', tone: 'from-rose-400 to-red-600', color: '#f43f5e' },
}

export const METHOD_META: Record<PayoutMethod, { label: string; icon: LucideIcon; chip: string; color: string }> = {
  UPI: { label: 'UPI', icon: Smartphone, chip: 'bg-violet-100 text-violet-700 dark:bg-violet-400/10 dark:text-violet-300', color: '#8b5cf6' },
  BANK_TRANSFER: { label: 'Bank transfer', icon: Banknote, chip: 'bg-sky-100 text-sky-700 dark:bg-sky-400/10 dark:text-sky-300', color: '#0ea5e9' },
}

export const statusMeta = (s: string | null | undefined) => STATUS_META[(s ?? 'PENDING') as PayoutStatus] ?? STATUS_META.PENDING
export const methodMeta = (m: string | null | undefined) => METHOD_META[(m ?? 'BANK_TRANSFER') as PayoutMethod] ?? METHOD_META.BANK_TRANSFER

/** "50100234567890" → "5010 0234 5678 90" for easy reading while paying. */
export const groupDigits = (s: string | null | undefined) => (s ?? '').replace(/\s/g, '').replace(/(.{4})/g, '$1 ').trim()

/** Opens a UPI app with the payee and amount filled in (works when the panel is open on a phone). */
export const upiPayLink = (upiId: string, name: string, amount: number, ref: string) =>
  `upi://pay?pa=${encodeURIComponent(upiId)}&pn=${encodeURIComponent(name)}&am=${Number(amount).toFixed(2)}&cu=INR&tn=${encodeURIComponent(ref)}`

export function humanDuration(seconds: number | null | undefined): string {
  if (seconds == null) return '—'
  const s = Math.max(0, Math.round(seconds))
  if (s < 60) return `${s}s`
  if (s < 3600) return `${Math.floor(s / 60)} min`
  if (s < 86400) return `${Math.round(s / 360) / 10} h`
  const days = Math.round(s / 8640) / 10
  return `${days} day${days === 1 ? "" : "s"}`
}

export const REJECT_REASONS = [
  'Balance not enough yet',
  'Bank details look wrong — please update and request again',
  'UPI ID is not valid',
  'Pending verification of your store (KYC)',
  'Duplicate request',
]
