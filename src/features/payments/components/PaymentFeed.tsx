import { useEffect, useState } from 'react'
import { Link } from '@tanstack/react-router'
import { AnimatePresence, motion } from 'framer-motion'
import { ArrowDownUp, ChevronLeft, ChevronRight, CreditCard, QrCode, RotateCcw, Search, Store, X } from 'lucide-react'
import { cn } from '@/lib/utils'
import { formatInrShort } from '@/features/vendors/utils/vendor-meta'
import { formatDateTime, formatRelative } from '@/utils/helpers/date'
import { usePaymentFeed, type FeedQuery, type FeedSort, type FeedStatus, type PaymentRow } from '../api/payment-insights.api'
import { STATUS_META, isOnline, money, refundState } from '../utils/payment-meta'
import { Avatar } from './Avatar'
import { RefundDialog } from './RefundDialog'

const STATUS_CHIPS: Record<'all' | 'refunds', { value: FeedStatus; label: string }[]> = {
  all: [
    { value: '', label: 'Everything' },
    { value: 'COMPLETED', label: 'Paid' },
    { value: 'REFUNDED', label: 'Refunded' },
    { value: 'FAILED', label: 'Failed' },
    { value: 'PENDING', label: 'Pending' },
    { value: 'DISPUTED', label: 'Disputed' },
  ],
  refunds: [
    { value: 'REFUNDED', label: 'All refunds' },
    { value: 'REFUNDS_PENDING', label: 'On their way' },
    { value: 'REFUND_FAILED', label: 'Failed — try again' },
  ],
}

const SORTS: { value: FeedSort; label: string }[] = [
  { value: 'newest', label: 'Newest first' },
  { value: 'oldest', label: 'Oldest first' },
  { value: 'amount_high', label: 'Biggest first' },
  { value: 'amount_low', label: 'Smallest first' },
]

function useDebounced<T>(value: T, ms = 300): T {
  const [v, setV] = useState(value)
  useEffect(() => { const id = window.setTimeout(() => setV(value), ms); return () => window.clearTimeout(id) }, [value, ms])
  return v
}

function Row({ p, i, onRefund }: { p: PaymentRow; i: number; onRefund: (p: PaymentRow) => void }) {
  const s = STATUS_META[p.status] ?? STATUS_META.PENDING
  const rs = refundState(p)
  const online = isOnline(p)
  const canRefund = p.status === 'COMPLETED'
  return (
    <motion.li layout initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} transition={{ delay: Math.min(i, 10) * 0.025 }}>
      <Link to="/payments/$paymentId" params={{ paymentId: String(p.id) }}
        className="group flex items-center gap-3 rounded-2xl border border-border bg-card p-3 pr-4 shadow-sm transition-all hover:-translate-y-0.5 hover:border-violet-400/40 hover:shadow-md sm:gap-4">
        <span className="relative shrink-0">
          <Avatar src={p.customerPic} name={p.customerName} className="h-11 w-11 rounded-xl text-sm" />
          <span className={cn('absolute -bottom-1 -right-1 flex h-5 w-5 items-center justify-center rounded-full ring-2 ring-card', online ? 'bg-sky-500 text-white' : 'bg-amber-500 text-white')}
            title={online ? 'Paid online' : 'Paid at the store'}>
            {online ? <CreditCard className="h-2.5 w-2.5" /> : <QrCode className="h-2.5 w-2.5" />}
          </span>
        </span>
        <span className="min-w-0 flex-1">
          <span className="flex flex-wrap items-center gap-x-2 gap-y-0.5">
            <span className="truncate text-sm font-semibold text-foreground">{p.customerName || `Customer #${p.userId}`}</span>
            <span className="text-xs text-muted-foreground">#{p.id}</span>
          </span>
          <span className="mt-0.5 flex flex-wrap items-center gap-x-2 text-xs text-muted-foreground">
            <span className="truncate">{p.cardName}</span>
            <span className="inline-flex items-center gap-1"><Store className="h-3 w-3" />{p.storeName || p.vendorName || `Store #${p.storeId}`}</span>
            <span title={formatDateTime(p.createdAt)}>{formatRelative(p.createdAt)}</span>
          </span>
        </span>
        <span className="hidden flex-col items-end gap-1 sm:flex">
          <span className={cn('inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-semibold', s.tone)}>
            <span className={cn('h-1.5 w-1.5 rounded-full', s.dot)} />{s.label}
          </span>
          {rs && <span className={cn('rounded-full px-2 py-0.5 text-[10px] font-medium', rs.tone)}>{rs.label}</span>}
          {!rs && p.disputeStatus === 'OPEN' && <span className="rounded-full bg-red-500/10 px-2 py-0.5 text-[10px] font-medium text-red-600">Disputed</span>}
        </span>
        <span className="w-28 shrink-0 text-right">
          <span className={cn('block text-base font-bold tabular-nums', p.status === 'REFUNDED' ? 'text-muted-foreground line-through decoration-violet-500/60' : 'text-foreground')}>{money(p.amountPaid)}</span>
          {p.status === 'REFUNDED' && p.refundAmount != null && <span className="block text-[11px] font-semibold text-violet-600">−{money(p.refundAmount)} back</span>}
          {p.status !== 'REFUNDED' && Number(p.discountApplied ?? 0) > 0 && <span className="block text-[11px] text-emerald-600">{formatInrShort(p.discountApplied)} off</span>}
        </span>
        {canRefund && (
          <button type="button" onClick={(e) => { e.preventDefault(); e.stopPropagation(); onRefund(p) }} title="Refund"
            className="hidden h-9 w-9 shrink-0 items-center justify-center rounded-xl border border-border text-muted-foreground opacity-0 transition-all hover:border-violet-500 hover:bg-violet-500 hover:text-white group-hover:opacity-100 md:flex">
            <RotateCcw className="h-4 w-4" />
          </button>
        )}
      </Link>
    </motion.li>
  )
}

export function PaymentFeed({ mode }: { mode: 'all' | 'refunds' }) {
  const [q, setQ] = useState<FeedQuery>({ status: mode === 'refunds' ? 'REFUNDED' : '', method: '', q: '', from: '', to: '', sort: 'newest' })
  const [page, setPage] = useState(0)
  const [refunding, setRefunding] = useState<PaymentRow | null>(null)
  const search = useDebounced(q.q)
  const feed = usePaymentFeed({ ...q, q: search }, page)
  const set = (patch: Partial<FeedQuery>) => { setQ((s) => ({ ...s, ...patch })); setPage(0) }
  const rows = feed.data?.content ?? []
  const filtered = q.method || q.from || q.to || q.q

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-col gap-3 rounded-2xl border border-border bg-card p-3 shadow-sm">
        <div className="flex flex-wrap items-center gap-2">
          <div className="relative min-w-[220px] flex-1">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <input value={q.q} onChange={(e) => set({ q: e.target.value })} placeholder="Search customer, phone, store, card, #id, pay_… or coupon"
              className="w-full rounded-xl border border-border bg-background py-2 pl-9 pr-8 text-sm outline-none focus:ring-2 focus:ring-ring" />
            {q.q && <button type="button" onClick={() => set({ q: '' })} className="absolute right-2 top-1/2 -translate-y-1/2 rounded p-1 text-muted-foreground hover:bg-muted" aria-label="Clear search"><X className="h-3.5 w-3.5" /></button>}
          </div>
          <select value={q.method} onChange={(e) => set({ method: e.target.value as FeedQuery['method'] })} aria-label="How they paid"
            className="rounded-xl border border-border bg-background px-3 py-2 text-sm">
            <option value="">Online + at store</option>
            <option value="ONLINE">Online only</option>
            <option value="PAY_AT_STORE">At store only</option>
          </select>
          <input type="date" value={q.from} onChange={(e) => set({ from: e.target.value })} aria-label="From" className="rounded-xl border border-border bg-background px-2.5 py-2 text-sm" />
          <span className="text-xs text-muted-foreground">to</span>
          <input type="date" value={q.to} onChange={(e) => set({ to: e.target.value })} aria-label="To" className="rounded-xl border border-border bg-background px-2.5 py-2 text-sm" />
          <label className="inline-flex items-center gap-1.5 rounded-xl border border-border bg-background px-2.5 py-2 text-sm">
            <ArrowDownUp className="h-3.5 w-3.5 text-muted-foreground" />
            <select value={q.sort} onChange={(e) => set({ sort: e.target.value as FeedSort })} aria-label="Sort" className="bg-transparent outline-none">
              {SORTS.map((s) => <option key={s.value} value={s.value}>{s.label}</option>)}
            </select>
          </label>
          {filtered && <button type="button" onClick={() => set({ method: '', from: '', to: '', q: '' })} className="text-xs font-medium text-primary hover:underline">Clear filters</button>}
        </div>
        <div className="flex flex-wrap items-center gap-1.5">
          {STATUS_CHIPS[mode].map((c) => (
            <button key={c.value || 'all'} type="button" onClick={() => set({ status: c.value })}
              className={cn('relative rounded-full px-3 py-1 text-xs font-medium transition-colors', q.status === c.value ? 'text-white' : 'text-muted-foreground hover:bg-muted hover:text-foreground')}>
              {q.status === c.value && <motion.span layoutId={`pay-chip-${mode}`} className="absolute inset-0 rounded-full bg-gradient-to-r from-violet-600 to-fuchsia-600" transition={{ type: 'spring', stiffness: 500, damping: 36 }} />}
              <span className="relative">{c.label}</span>
            </button>
          ))}
          <span className="ml-auto text-xs text-muted-foreground">
            {feed.data ? `${feed.data.totalElements} payment${feed.data.totalElements === 1 ? '' : 's'} · ${money(feed.data.totalAmount)}` : ''}
          </span>
        </div>
      </div>

      {feed.isLoading ? (
        <div className="flex flex-col gap-2">{Array.from({ length: 6 }).map((_, i) => <div key={i} className="h-[68px] animate-pulse rounded-2xl bg-muted" />)}</div>
      ) : feed.isError ? (
        <div className="rounded-2xl border border-red-500/30 bg-red-500/5 p-6 text-center text-sm text-red-700">Couldn&apos;t load payments. <button type="button" className="font-semibold underline" onClick={() => void feed.refetch()}>Try again</button></div>
      ) : rows.length === 0 ? (
        <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="flex flex-col items-center gap-2 rounded-2xl border border-dashed border-border py-14 text-center">
          <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-violet-500/10 text-violet-600">{mode === 'refunds' ? <RotateCcw className="h-6 w-6" /> : <CreditCard className="h-6 w-6" />}</span>
          <p className="text-sm font-semibold text-foreground">{mode === 'refunds' ? 'No refunds here' : 'No payments match'}</p>
          <p className="text-xs text-muted-foreground">{filtered ? 'Try clearing the filters.' : mode === 'refunds' ? 'Refunds you make show up here.' : 'Card purchases show up here.'}</p>
        </motion.div>
      ) : (
        <ul className={cn('flex flex-col gap-2 transition-opacity', feed.isFetching && 'opacity-70')}>
          <AnimatePresence initial={false}>
            {rows.map((p, i) => <Row key={p.id} p={p} i={i} onRefund={setRefunding} />)}
          </AnimatePresence>
        </ul>
      )}

      {feed.data && feed.data.totalPages > 1 && (
        <div className="flex items-center justify-center gap-2 text-sm">
          <button type="button" disabled={page === 0} onClick={() => setPage((p) => p - 1)} className="flex h-9 w-9 items-center justify-center rounded-xl border border-border hover:bg-muted disabled:opacity-40" aria-label="Previous page"><ChevronLeft className="h-4 w-4" /></button>
          <span className="tabular-nums text-muted-foreground">Page {page + 1} of {feed.data.totalPages}</span>
          <button type="button" disabled={page >= feed.data.totalPages - 1} onClick={() => setPage((p) => p + 1)} className="flex h-9 w-9 items-center justify-center rounded-xl border border-border hover:bg-muted disabled:opacity-40" aria-label="Next page"><ChevronRight className="h-4 w-4" /></button>
        </div>
      )}

      <RefundDialog payment={refunding} onClose={() => setRefunding(null)} />
    </div>
  )
}
