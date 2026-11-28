import { useEffect, useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { ArrowDownUp, Check, ChevronLeft, ChevronRight, Inbox, Loader2, Search, Store, Ticket, X } from 'lucide-react'
import { cn } from '@/lib/utils'
import { formatRelative } from '@/utils/helpers/date'
import { useApproveRequest, useCouponRows, useRejectRequest, type CouponRow, type CouponSort, type CouponState } from '../api/coupon-insights.api'
import { STATE_META, discountText, rulesText, whenText } from '../utils/coupon-meta'
import { CouponTicket } from './CouponTicket'

function useDebounced<T>(v: T, ms = 300) {
  const [d, setD] = useState(v)
  useEffect(() => { const t = window.setTimeout(() => setD(v), ms); return () => window.clearTimeout(t) }, [v, ms])
  return d
}

const STATES: (CouponState | '')[] = ['', 'LIVE', 'SCHEDULED', 'PAUSED', 'USED_UP', 'EXPIRED', 'REJECTED']

export function CouponGrid({ counts, onEdit }: { counts?: Partial<Record<CouponState, number>>; onEdit: (c: CouponRow) => void }) {
  const [state, setState] = useState<CouponState | ''>('')
  const [scope, setScope] = useState<'' | 'PLATFORM' | 'STORE'>('')
  const [sort, setSort] = useState<CouponSort>('newest')
  const [q, setQ] = useState('')
  const [page, setPage] = useState(0)
  const search = useDebounced(q)
  const rows = useCouponRows({ state, scope, q: search, sort }, page)
  const list = (rows.data?.content ?? []).filter((c) => c.state !== 'WAITING' || state === 'WAITING')

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-col gap-3 rounded-2xl border border-border bg-card p-3 shadow-sm">
        <div className="flex flex-wrap items-center gap-2">
          <div className="relative min-w-[220px] flex-1">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <input value={q} onChange={(e) => { setQ(e.target.value); setPage(0) }} placeholder="Search code, name or store"
              className="w-full rounded-xl border border-border bg-background py-2 pl-9 pr-8 text-sm outline-none focus:ring-2 focus:ring-ring" />
            {q && <button type="button" onClick={() => setQ('')} aria-label="Clear" className="absolute right-2 top-1/2 -translate-y-1/2 rounded p-1 text-muted-foreground hover:bg-muted"><X className="h-3.5 w-3.5" /></button>}
          </div>
          <select value={scope} onChange={(e) => { setScope(e.target.value as typeof scope); setPage(0) }} aria-label="Where it works" className="rounded-xl border border-border bg-background px-3 py-2 text-sm">
            <option value="">All coupons</option>
            <option value="PLATFORM">Every store (Strike-wide)</option>
            <option value="STORE">One store only</option>
          </select>
          <label className="inline-flex items-center gap-1.5 rounded-xl border border-border bg-background px-2.5 py-2 text-sm">
            <ArrowDownUp className="h-3.5 w-3.5 text-muted-foreground" />
            <select value={sort} onChange={(e) => { setSort(e.target.value as CouponSort); setPage(0) }} aria-label="Sort" className="bg-transparent outline-none">
              <option value="newest">Newest first</option>
              <option value="most_used">Most used</option>
              <option value="most_discount">Most money saved</option>
              <option value="ending">Ending soonest</option>
            </select>
          </label>
        </div>
        <div className="flex flex-wrap gap-1.5">
          {STATES.map((s) => {
            const n = s ? counts?.[s] : undefined
            return (
              <button key={s || 'all'} type="button" onClick={() => { setState(s); setPage(0) }}
                className={cn('relative rounded-full px-3 py-1 text-xs font-medium transition-colors', state === s ? 'text-white' : 'text-muted-foreground hover:bg-muted hover:text-foreground')}>
                {state === s && <motion.span layoutId="cpn-state" className="absolute inset-0 rounded-full bg-gradient-to-r from-[#e01a00] to-[#ff6a00]" transition={{ type: 'spring', stiffness: 500, damping: 36 }} />}
                <span className="relative">{s ? STATE_META[s].label : 'Everything'}{n != null ? ` · ${n}` : ''}</span>
              </button>
            )
          })}
        </div>
      </div>

      {rows.isLoading ? (
        <div className="grid gap-3 md:grid-cols-2 2xl:grid-cols-3">{Array.from({ length: 6 }).map((_, i) => <div key={i} className="h-[136px] animate-pulse rounded-2xl bg-muted" />)}</div>
      ) : list.length === 0 ? (
        <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="flex flex-col items-center gap-2 rounded-2xl border border-dashed border-border py-14 text-center">
          <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-primary/10 text-primary"><Ticket className="h-6 w-6" /></span>
          <p className="text-sm font-semibold text-foreground">No coupons here</p>
          <p className="text-xs text-muted-foreground">{q || state || scope ? 'Try other filters.' : 'Create your first coupon to give customers a discount.'}</p>
        </motion.div>
      ) : (
        <div className={cn('grid gap-3 transition-opacity md:grid-cols-2 2xl:grid-cols-3', rows.isFetching && 'opacity-70')}>
          <AnimatePresence initial={false}>{list.map((c, i) => <CouponTicket key={c.id} c={c} i={i} onEdit={onEdit} />)}</AnimatePresence>
        </div>
      )}

      {rows.data && rows.data.totalPages > 1 && (
        <div className="flex items-center justify-center gap-2 text-sm">
          <button type="button" disabled={page === 0} onClick={() => setPage((p) => p - 1)} aria-label="Previous page" className="flex h-9 w-9 items-center justify-center rounded-xl border border-border hover:bg-muted disabled:opacity-40"><ChevronLeft className="h-4 w-4" /></button>
          <span className="tabular-nums text-muted-foreground">Page {page + 1} of {rows.data.totalPages}</span>
          <button type="button" disabled={page >= rows.data.totalPages - 1} onClick={() => setPage((p) => p + 1)} aria-label="Next page" className="flex h-9 w-9 items-center justify-center rounded-xl border border-border hover:bg-muted disabled:opacity-40"><ChevronRight className="h-4 w-4" /></button>
        </div>
      )}
    </div>
  )
}

const QUICK_REASONS = ['Discount is too high', 'Dates don’t work', 'Clashes with a Strike-wide offer', 'Code is unclear']

function RequestCard({ c, i }: { c: CouponRow; i: number }) {
  const approve = useApproveRequest()
  const reject = useRejectRequest()
  const [rejecting, setRejecting] = useState(false)
  const [reason, setReason] = useState('')
  const busy = approve.isPending || reject.isPending
  return (
    <motion.li layout initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, x: 40 }} transition={{ delay: i * 0.04 }}
      className="rounded-2xl border border-orange-500/30 bg-card p-5 shadow-sm">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="flex items-start gap-4">
          <span className="flex h-14 w-14 shrink-0 flex-col items-center justify-center rounded-2xl bg-gradient-to-br from-orange-400 to-red-500 text-white shadow-md">
            <span className="text-lg font-black leading-none">{c.discountType === 'PERCENTAGE' ? `${Number(c.discountValue)}%` : `₹${Number(c.discountValue)}`}</span>
            <span className="text-[9px] uppercase tracking-widest">off</span>
          </span>
          <div className="min-w-0">
            <p className="text-base font-semibold text-foreground">{c.title}</p>
            <p className="inline-flex items-center gap-1 text-xs text-muted-foreground"><Store className="h-3 w-3" />{c.storeName || c.vendorName || `Vendor #${c.vendorId}`} asked {formatRelative(c.createdAt)}</p>
            <p className="mt-1.5 font-mono text-sm font-bold tracking-wider text-foreground">{c.code}</p>
            <p className="mt-1 text-xs text-muted-foreground">{discountText(c)} · {rulesText(c)} · {whenText(c)}</p>
            {c.description && <p className="mt-1 text-xs italic text-muted-foreground">“{c.description}”</p>}
          </div>
        </div>
        <div className="flex gap-2">
          <button type="button" onClick={() => setRejecting((r) => !r)} disabled={busy} className="rounded-xl border border-border px-3.5 py-2 text-sm font-medium hover:bg-muted disabled:opacity-50">Turn down</button>
          <button type="button" onClick={() => approve.mutate(c.id)} disabled={busy}
            className="inline-flex items-center gap-1.5 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-600 px-4 py-2 text-sm font-semibold text-white shadow-md disabled:opacity-50">
            {approve.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Check className="h-4 w-4" />} Approve
          </button>
        </div>
      </div>
      <AnimatePresence>
        {rejecting && (
          <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }} className="overflow-hidden">
            <div className="mt-4 flex flex-col gap-2 border-t border-border pt-4">
              <div className="flex flex-wrap gap-1.5">{QUICK_REASONS.map((r) => <button key={r} type="button" onClick={() => setReason(r)} className={cn('rounded-full border px-2.5 py-1 text-xs', reason === r ? 'border-red-500 bg-red-500/10 text-red-700' : 'border-border text-muted-foreground hover:bg-muted')}>{r}</button>)}</div>
              <div className="flex gap-2">
                <input value={reason} onChange={(e) => setReason(e.target.value)} placeholder="Why? The store sees this." className="flex-1 rounded-xl border border-border bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-ring" />
                <button type="button" disabled={!reason.trim() || busy} onClick={() => reject.mutate({ id: c.id, reason: reason.trim() })}
                  className="rounded-xl bg-red-600 px-4 py-2 text-sm font-semibold text-white disabled:opacity-50">{reject.isPending ? 'Sending…' : 'Send'}</button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.li>
  )
}

export function CouponRequests() {
  const rows = useCouponRows({ state: 'WAITING', scope: '', q: '', sort: 'newest' }, 0, 50)
  const list = rows.data?.content ?? []
  if (rows.isLoading) return <div className="flex flex-col gap-3">{[0, 1].map((i) => <div key={i} className="h-32 animate-pulse rounded-2xl bg-muted" />)}</div>
  if (list.length === 0) {
    return (
      <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="flex flex-col items-center gap-2 rounded-2xl border border-dashed border-border py-16 text-center">
        <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-emerald-500/10 text-emerald-600"><Inbox className="h-6 w-6" /></span>
        <p className="text-sm font-semibold text-foreground">No requests waiting</p>
        <p className="text-xs text-muted-foreground">When a store asks for a coupon from the vendor app, it shows up here for you to approve.</p>
      </motion.div>
    )
  }
  return (
    <ul className="flex flex-col gap-3">
      <AnimatePresence initial={false}>{list.map((c, i) => <RequestCard key={c.id} c={c} i={i} />)}</AnimatePresence>
    </ul>
  )
}
