import type { CouponRow, CouponState } from '../api/coupon-insights.api'

export type CouponsTab = 'coupons' | 'requests' | 'insights'
export const isCouponsTab = (v: unknown): v is CouponsTab => v === 'coupons' || v === 'requests' || v === 'insights'

export const STATE_META: Record<CouponState, { label: string; tone: string; dot: string; ticket: string }> = {
  LIVE: { label: 'Live', tone: 'bg-emerald-500/10 text-emerald-700 dark:text-emerald-300', dot: 'bg-emerald-500', ticket: 'from-emerald-500 to-teal-600' },
  SCHEDULED: { label: 'Starts later', tone: 'bg-sky-500/10 text-sky-700 dark:text-sky-300', dot: 'bg-sky-500', ticket: 'from-sky-500 to-indigo-600' },
  EXPIRED: { label: 'Ended', tone: 'bg-slate-500/10 text-slate-600 dark:text-slate-300', dot: 'bg-slate-400', ticket: 'from-slate-400 to-slate-600' },
  PAUSED: { label: 'Paused', tone: 'bg-amber-500/10 text-amber-700 dark:text-amber-300', dot: 'bg-amber-500', ticket: 'from-amber-400 to-orange-500' },
  USED_UP: { label: 'All used', tone: 'bg-violet-500/10 text-violet-700 dark:text-violet-300', dot: 'bg-violet-500', ticket: 'from-violet-500 to-fuchsia-600' },
  WAITING: { label: 'Waiting for you', tone: 'bg-orange-500/10 text-orange-700 dark:text-orange-300', dot: 'bg-orange-500', ticket: 'from-orange-400 to-red-500' },
  REJECTED: { label: 'Turned down', tone: 'bg-red-500/10 text-red-700 dark:text-red-300', dot: 'bg-red-500', ticket: 'from-rose-400 to-red-600' },
}

const inr = new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', minimumFractionDigits: 0, maximumFractionDigits: 2 })
export const money = (n: number | string | null | undefined) => inr.format(Number(n) || 0)

/** "20% off, up to ₹100" / "₹50 off" */
export function discountText(c: Pick<CouponRow, 'discountType' | 'discountValue' | 'maxDiscountAmount'>): string {
  if (c.discountType === 'PERCENTAGE') {
    return `${Number(c.discountValue)}% off${c.maxDiscountAmount ? `, up to ${money(c.maxDiscountAmount)}` : ''}`
  }
  return `${money(c.discountValue)} off`
}

/** Big label on the ticket: "20%" / "₹50" */
export const discountBig = (c: Pick<CouponRow, 'discountType' | 'discountValue'>) =>
  c.discountType === 'PERCENTAGE' ? `${Number(c.discountValue)}%` : money(c.discountValue)

/** The rules in one plain sentence. */
export function rulesText(c: Pick<CouponRow, 'minPurchaseAmount' | 'maxUses' | 'vendorId' | 'storeName' | 'vendorName'>): string {
  const parts = [
    c.vendorId ? `only at ${c.storeName || c.vendorName || `vendor #${c.vendorId}`}` : 'at every store',
    c.minPurchaseAmount ? `on cards of ${money(c.minPurchaseAmount)} or more` : 'on any card',
    c.maxUses ? `for the first ${c.maxUses} customers` : 'no limit on customers',
    'once per customer',
  ]
  return parts.join(' · ')
}

/** "ends in 3 days", "ended 2 days ago", "starts tomorrow" */
export function whenText(c: Pick<CouponRow, 'validFrom' | 'validUntil' | 'state'>): string {
  const now = Date.now()
  const day = 86_400_000
  const rel = (ms: number) => {
    const d = Math.round(Math.abs(ms) / day)
    if (d === 0) { const h = Math.max(1, Math.round(Math.abs(ms) / 3_600_000)); return `${h} hour${h === 1 ? '' : 's'}` }
    return `${d} day${d === 1 ? '' : 's'}`
  }
  const from = new Date(c.validFrom).getTime()
  const until = new Date(c.validUntil).getTime()
  if (from > now) return `starts in ${rel(from - now)}`
  if (until < now) return `ended ${rel(now - until)} ago`
  return `ends in ${rel(until - now)}`
}

export function randomCode(prefix = 'STRIKE'): string {
  const alphabet = 'ABCDEFGHJKMNPQRSTUVWXYZ23456789'
  const bytes = new Uint8Array(4)
  crypto.getRandomValues(bytes)
  return `${prefix}${Array.from(bytes, (b) => alphabet[b % alphabet.length]).join('')}`
}
