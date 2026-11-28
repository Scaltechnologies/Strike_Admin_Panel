import type { PaymentRow, RefundMethod, RefundReason } from '../api/payment-insights.api'

export type PaymentsTab = 'all' | 'refunds' | 'insights'
export const isPaymentsTab = (v: unknown): v is PaymentsTab => v === 'all' || v === 'refunds' || v === 'insights'

export const STATUS_META: Record<string, { label: string; tone: string; dot: string }> = {
  COMPLETED: { label: 'Paid', tone: 'bg-emerald-500/10 text-emerald-700 dark:text-emerald-300', dot: 'bg-emerald-500' },
  PENDING: { label: 'Pending', tone: 'bg-amber-500/10 text-amber-700 dark:text-amber-300', dot: 'bg-amber-500' },
  FAILED: { label: 'Failed', tone: 'bg-red-500/10 text-red-700 dark:text-red-300', dot: 'bg-red-500' },
  REFUNDED: { label: 'Refunded', tone: 'bg-violet-500/10 text-violet-700 dark:text-violet-300', dot: 'bg-violet-500' },
}

export const REASONS: { value: RefundReason; label: string; hint: string }[] = [
  { value: 'CUSTOMER_CANCELLED', label: 'Customer asked to cancel', hint: 'They changed their mind or can’t use the card' },
  { value: 'DUPLICATE_ENTRY', label: 'Charged twice', hint: 'The same card was paid for more than once' },
  { value: 'CARD_NOT_WORKING', label: 'Card didn’t work', hint: 'The store couldn’t redeem it' },
  { value: 'STORE_CLOSED', label: 'Store closed', hint: 'The store shut down or stopped accepting the card' },
  { value: 'OTHER', label: 'Something else', hint: 'Explain in the note' },
]

export const reasonLabel = (r: string | null | undefined) =>
  REASONS.find((x) => x.value === r)?.label ?? (r ? r.replace(/_/g, ' ').toLowerCase() : '—')

export const REFUND_METHOD: Record<RefundMethod | 'LEGACY', { label: string; short: string; explain: string }> = {
  RAZORPAY: { label: 'Send back through Razorpay', short: 'Razorpay', explain: 'Money goes back to the UPI / card / bank the customer paid from. Usually 5–7 working days.' },
  STORE_CASH: { label: 'Store hands cash back', short: 'Store cash', explain: 'The store took the money, so the store gives it back. We tell the store how much.' },
  OUTSIDE: { label: 'Already paid back another way', short: 'Outside Strike', explain: 'You settled it yourself (bank transfer, cash). We only record it.' },
  NONE: { label: 'No money back — just cancel the card', short: 'Card only', explain: 'The card stops working; nobody gets money back.' },
  LEGACY: { label: 'Recorded before refunds sent money', short: 'Recorded only', explain: 'Marked refunded before Strike could send money back.' },
}

export const isOnline = (p: Pick<PaymentRow, 'paymentMethod'>) => p.paymentMethod !== 'PAY_AT_STORE'

/** "UPI · test@okaxis", "Visa •••• 4242", "Net banking · HDFC" */
export function payMethodText(g: { method: string | null; vpa: string | null; bank: string | null; wallet: string | null; cardNetwork: string | null; cardLast4: string | null } | null | undefined): string | null {
  if (!g?.method) return null
  switch (g.method) {
    case 'upi': return g.vpa ? `UPI · ${g.vpa}` : 'UPI'
    case 'card': return `${g.cardNetwork ?? 'Card'}${g.cardLast4 ? ` •••• ${g.cardLast4}` : ''}`
    case 'netbanking': return g.bank ? `Net banking · ${g.bank}` : 'Net banking'
    case 'wallet': return g.wallet ? `Wallet · ${g.wallet}` : 'Wallet'
    default: return g.method
  }
}

export function initials(name: string | null | undefined): string {
  const parts = (name ?? '').trim().split(/\s+/).filter(Boolean)
  if (parts.length === 0) return '?'
  return (parts[0][0] + (parts[1]?.[0] ?? '')).toUpperCase()
}

/** What the refund status means, in plain words. */
export function refundState(p: Pick<PaymentRow, 'status' | 'refundMethod' | 'refundStatus' | 'refundError'>): { label: string; tone: string } | null {
  if (p.status === 'COMPLETED' && p.refundStatus === 'FAILED') return { label: 'Refund failed', tone: 'bg-red-500/10 text-red-600' }
  if (p.status !== 'REFUNDED') return null
  if (p.refundMethod === 'RAZORPAY') {
    if (p.refundStatus === 'PENDING') return { label: 'Refund on its way', tone: 'bg-amber-500/10 text-amber-700 dark:text-amber-300' }
    if (p.refundStatus === 'FAILED') return { label: 'Razorpay refund failed', tone: 'bg-red-500/10 text-red-600' }
    return { label: 'Refunded to customer', tone: 'bg-emerald-500/10 text-emerald-700 dark:text-emerald-300' }
  }
  if (p.refundMethod === 'STORE_CASH') return { label: 'Store hands cash back', tone: 'bg-sky-500/10 text-sky-700 dark:text-sky-300' }
  if (p.refundMethod === 'OUTSIDE') return { label: 'Paid back outside Strike', tone: 'bg-slate-500/10 text-slate-700 dark:text-slate-300' }
  if (p.refundMethod === 'NONE') return { label: 'Card cancelled, no money back', tone: 'bg-slate-500/10 text-slate-700 dark:text-slate-300' }
  return { label: 'Marked refunded (no money sent)', tone: 'bg-amber-500/10 text-amber-700 dark:text-amber-300' }
}

const inrExact = new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', minimumFractionDigits: 0, maximumFractionDigits: 2 })
/** Exact rupees with paise when there are any — refunds must never look rounded. */
export const money = (n: number | string | null | undefined) => inrExact.format(Number(n) || 0)
