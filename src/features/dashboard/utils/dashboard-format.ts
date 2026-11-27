import type { Variants } from 'framer-motion'

// ── Formatting ───────────────────────────────────────────────────────────────

const inrCompact = new Intl.NumberFormat('en-IN', {
  style: 'currency', currency: 'INR', notation: 'compact', maximumFractionDigits: 1,
})
const inrFull = new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 })
const numFull = new Intl.NumberFormat('en-IN')

/** ₹1.2L, ₹3.4Cr: short enough for a tile. */
export const formatInrCompact = (n: number) => inrCompact.format(n || 0)
/** ₹1,23,456 */
export const formatInr = (n: number) => inrFull.format(n || 0)
export const formatCount = (n: number) => numFull.format(Math.round(n || 0))

export const toNumber = (v: unknown): number => {
  const n = typeof v === 'string' ? Number(v) : (v as number)
  return Number.isFinite(n) ? n : 0
}

// ── Motion ───────────────────────────────────────────────────────────────────

export const staggerContainer: Variants = {
  hidden: {},
  show: { transition: { staggerChildren: 0.06, delayChildren: 0.05 } },
}

export const riseIn: Variants = {
  hidden: { opacity: 0, y: 18, scale: 0.98 },
  show: { opacity: 1, y: 0, scale: 1, transition: { type: 'spring', stiffness: 260, damping: 26 } },
}
