import { useState } from 'react'
import { Link } from '@tanstack/react-router'
import { motion } from 'framer-motion'
import { Check, Clock, Copy, Globe2, Pause, Pencil, Play, Store, Users } from 'lucide-react'
import { toast } from 'sonner'
import { cn } from '@/lib/utils'
import { usePauseCoupon, type CouponRow } from '../api/coupon-insights.api'
import { STATE_META, discountBig, discountText, money, whenText } from '../utils/coupon-meta'

export function CopyCode({ code, className, light }: { code: string; className?: string; light?: boolean }) {
  const [copied, setCopied] = useState(false)
  return (
    <button type="button" title="Copy code"
      onClick={(e) => { e.preventDefault(); e.stopPropagation(); void navigator.clipboard.writeText(code).then(() => { setCopied(true); toast.success(`${code} copied`); window.setTimeout(() => setCopied(false), 1400) }) }}
      className={cn('group/copy inline-flex items-center gap-1.5 rounded-lg border border-dashed px-2.5 py-1 font-mono text-sm font-bold tracking-wider transition-colors',
        light ? 'border-white/40 text-white hover:bg-white/15' : 'border-border text-foreground hover:bg-muted', className)}>
      {code}
      {copied ? <Check className="h-3.5 w-3.5 text-emerald-400" /> : <Copy className="h-3.5 w-3.5 opacity-60 group-hover/copy:opacity-100" />}
    </button>
  )
}

/** A coupon drawn as a ticket: big discount stub on the left, details on the right. */
export function CouponTicket({ c, i = 0, onEdit }: { c: CouponRow; i?: number; onEdit?: (c: CouponRow) => void }) {
  const s = STATE_META[c.state] ?? STATE_META.LIVE
  const pause = usePauseCoupon()
  const used = Number(c.usedCount ?? 0)
  const pct = c.maxUses ? Math.min(100, (used / c.maxUses) * 100) : null
  const canToggle = c.state !== 'WAITING' && c.state !== 'REJECTED'
  return (
    <motion.div layout initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: Math.min(i, 12) * 0.03, type: 'spring', stiffness: 260, damping: 24 }}
      whileHover={{ y: -4 }} className="group relative">
      <Link to="/coupons/$couponId" params={{ couponId: String(c.id) }}
        className="flex overflow-hidden rounded-2xl border border-border bg-card shadow-sm transition-shadow group-hover:shadow-lg">
        {/* stub */}
        <div className={cn('relative flex w-28 shrink-0 flex-col items-center justify-center gap-1 bg-gradient-to-br p-3 text-white', s.ticket, c.state === 'EXPIRED' && 'grayscale-[40%]')}>
          <span className="text-2xl font-black leading-none tracking-tight">{discountBig(c)}</span>
          <span className="text-[10px] font-semibold uppercase tracking-widest text-white/80">off</span>
          {c.discountType === 'PERCENTAGE' && c.maxDiscountAmount && <span className="text-[10px] text-white/80">up to {money(c.maxDiscountAmount)}</span>}
          {/* perforation */}
          <span className="absolute -right-2 top-0 flex h-full flex-col justify-around py-1" aria-hidden>
            {Array.from({ length: 7 }).map((_, k) => <span key={k} className="h-2.5 w-2.5 rounded-full bg-background" />)}
          </span>
        </div>
        {/* body */}
        <div className="flex min-w-0 flex-1 flex-col gap-2 p-4 pl-5">
          <div className="flex items-start justify-between gap-2">
            <div className="min-w-0">
              <p className="truncate text-sm font-semibold text-foreground">{c.title}</p>
              <p className="truncate text-xs text-muted-foreground">{discountText(c)}{c.minPurchaseAmount ? ` · min ${money(c.minPurchaseAmount)}` : ''}</p>
            </div>
            <span className={cn('inline-flex shrink-0 items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-semibold', s.tone)}>
              <span className={cn('h-1.5 w-1.5 rounded-full', s.dot, c.state === 'LIVE' && 'animate-pulse')} />{s.label}
            </span>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <CopyCode code={c.code} />
            <span className="inline-flex items-center gap-1 text-[11px] text-muted-foreground">
              {c.vendorId ? <Store className="h-3 w-3" /> : <Globe2 className="h-3 w-3" />}
              <span className="max-w-[140px] truncate">{c.vendorId ? c.storeName || c.vendorName || `Vendor #${c.vendorId}` : 'All stores'}</span>
            </span>
          </div>
          <div>
            <div className="mb-1 flex items-center justify-between text-[11px] text-muted-foreground">
              <span className="inline-flex items-center gap-1"><Users className="h-3 w-3" />{used} used{c.maxUses ? ` of ${c.maxUses}` : ''}{Number(c.discountGiven ?? 0) > 0 ? ` · ${money(c.discountGiven)} saved` : ''}</span>
              <span className="inline-flex items-center gap-1"><Clock className="h-3 w-3" />{whenText(c)}</span>
            </div>
            <div className="h-1.5 overflow-hidden rounded-full bg-muted">
              <motion.div initial={{ width: 0 }} animate={{ width: `${pct ?? Math.min(100, used * 4)}%` }} transition={{ type: 'spring', stiffness: 120, damping: 20 }}
                className={cn('h-full rounded-full', pct != null && pct >= 90 ? 'bg-[#ec4647]' : pct != null && pct >= 70 ? 'bg-[#f2a600]' : 'bg-[#257de0]', pct == null && 'opacity-50')} />
            </div>
          </div>
        </div>
      </Link>
      {/* hover actions */}
      <div className="absolute right-3 top-3 flex gap-1 rounded-xl bg-card p-0.5 opacity-0 transition-opacity group-hover:opacity-100">
        {onEdit && (
          <button type="button" onClick={() => onEdit(c)} title="Edit" className="flex h-8 w-8 items-center justify-center rounded-lg border border-border bg-card text-muted-foreground shadow-sm hover:text-foreground">
            <Pencil className="h-3.5 w-3.5" />
          </button>
        )}
        {canToggle && (
          <button type="button" onClick={() => pause.mutate({ id: c.id, pause: c.isActive })} disabled={pause.isPending} title={c.isActive ? 'Pause' : 'Switch on'}
            className="flex h-8 w-8 items-center justify-center rounded-lg border border-border bg-card text-muted-foreground shadow-sm hover:text-foreground disabled:opacity-50">
            {c.isActive ? <Pause className="h-3.5 w-3.5" /> : <Play className="h-3.5 w-3.5" />}
          </button>
        )}
      </div>
    </motion.div>
  )
}
