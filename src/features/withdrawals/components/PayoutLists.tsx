import { useEffect, useState } from 'react'
import { useNavigate } from '@tanstack/react-router'
import { AnimatePresence, motion } from 'framer-motion'
import { CalendarRange, CheckCheck, ChevronLeft, ChevronRight, ChevronRight as Go, Loader2, PartyPopper, Search, Wallet, X } from 'lucide-react'
import { cn } from '@/lib/utils'
import { ErrorState } from '@/components/common/ErrorState'
import { formatRelative } from '@/utils/helpers/date'
import { avatarGradient, formatInrFull, vendorInitials } from '@/features/vendors/utils/vendor-meta'
import { useBulkMarkPaid, usePayoutFeed, type PayoutQuery, type PayoutRow, type PayoutStatus } from '../api/withdrawal-insights.api'
import { methodMeta, statusMeta } from '../utils/payout-meta'
import { PayoutCard } from './PayoutCard'

const QUEUE: PayoutQuery = { status: 'PENDING', method: '', q: '', from: '', to: '', sort: 'oldest' }

/** Every withdrawal waiting to be paid, oldest first, with bulk "mark paid". */
export function PayoutQueue() {
  const [page, setPage] = useState(0)
  const [selected, setSelected] = useState<Set<number>>(new Set())
  const [method, setMethod] = useState<'' | 'UPI' | 'BANK_TRANSFER'>('')
  const feed = usePayoutFeed({ ...QUEUE, method }, page, 20)
  const bulk = useBulkMarkPaid()
  const rows = feed.data?.content ?? []
  const toggle = (id: number, on: boolean) => setSelected((s) => { const n = new Set(s); if (on) n.add(id); else n.delete(id); return n })
  const selectedTotal = rows.filter((r) => selected.has(r.id)).reduce((s, r) => s + Number(r.amount), 0)
  const totalPages = feed.data?.totalPages ?? 0

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap items-center gap-3 rounded-2xl border border-border bg-card p-3 shadow-sm">
        <div role="tablist" className="flex gap-1 rounded-xl bg-muted/60 p-1">
          {([['', 'All methods'], ['UPI', 'UPI'], ['BANK_TRANSFER', 'Bank transfer']] as const).map(([v, l]) => (
            <button key={v || 'all'} type="button" role="tab" aria-selected={method === v} onClick={() => { setMethod(v); setPage(0); setSelected(new Set()) }}
              className={cn('relative rounded-lg px-3 py-1.5 text-xs font-medium', method === v ? 'text-foreground' : 'text-muted-foreground hover:text-foreground')}>
              {method === v && <motion.span layoutId="queue-method" className="absolute inset-0 rounded-lg bg-card shadow-sm" />}
              <span className="relative">{l}</span>
            </button>
          ))}
        </div>
        {rows.length > 1 && (
          <label className="flex cursor-pointer items-center gap-2 text-xs font-medium text-muted-foreground">
            <input type="checkbox" checked={rows.every((r) => selected.has(r.id))} onChange={(e) => setSelected(e.target.checked ? new Set(rows.map((r) => r.id)) : new Set())} className="h-4 w-4 accent-[#e01a00]" />
            Select all
          </label>
        )}
        <AnimatePresence>
          {selected.size > 0 && (
            <motion.div initial={{ opacity: 0, x: 10 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 10 }} className="ml-auto flex items-center gap-3">
              <span className="text-xs text-muted-foreground"><b className="text-foreground">{selected.size}</b> selected · <b className="text-foreground">{formatInrFull(selectedTotal)}</b></span>
              <button type="button" disabled={bulk.isPending} onClick={() => bulk.mutate({ ids: [...selected] }, { onSuccess: () => setSelected(new Set()) })}
                className="btn-shine flex h-9 items-center gap-1.5 rounded-lg bg-gradient-to-r from-emerald-500 to-teal-600 px-4 text-xs font-semibold text-white shadow-md disabled:opacity-60">
                {bulk.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <CheckCheck className="h-4 w-4" />} Mark {selected.size} as paid
              </button>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {feed.isError ? <ErrorState title="Couldn't load the payout queue" description="Check the connection and try again." onRetry={() => void feed.refetch()} />
        : feed.isLoading ? <div className="flex flex-col gap-4">{Array.from({ length: 2 }).map((_, i) => <div key={i} className="h-72 animate-pulse rounded-3xl bg-muted" />)}</div>
          : rows.length === 0 ? (
            <motion.div initial={{ opacity: 0, scale: 0.97 }} animate={{ opacity: 1, scale: 1 }} className="flex flex-col items-center justify-center rounded-3xl border border-dashed border-border bg-card py-16 text-center">
              <motion.span initial={{ rotate: -20, scale: 0.4 }} animate={{ rotate: 0, scale: 1 }} transition={{ type: 'spring', stiffness: 240, damping: 12 }}
                className="flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-emerald-400 to-teal-600 text-white shadow-lg shadow-emerald-500/30">
                <PartyPopper className="h-8 w-8" />
              </motion.span>
              <p className="mt-4 text-base font-semibold text-foreground">No one is waiting to be paid</p>
              <p className="mt-1 text-sm text-muted-foreground">New withdrawal requests appear here — and the bell rings.</p>
            </motion.div>
          ) : (
            <motion.div layout className="flex flex-col gap-4">
              <AnimatePresence mode="popLayout">
                {rows.map((r) => <PayoutCard key={r.id} row={r} selected={selected.has(r.id)} onSelect={toggle} />)}
              </AnimatePresence>
            </motion.div>
          )}
      <Pager page={page} totalPages={totalPages} onPage={setPage} />
    </div>
  )
}

const ALL: PayoutQuery = { status: 'ALL', method: '', q: '', from: '', to: '', sort: 'newest' }

/** Every withdrawal ever, with search and filters. */
export function PayoutHistory() {
  const navigate = useNavigate()
  const [q, setQ] = useState<PayoutQuery>(ALL)
  const [search, setSearch] = useState('')
  const [page, setPage] = useState(0)
  useEffect(() => { const t = setTimeout(() => { setQ((s) => (s.q === search.trim() ? s : { ...s, q: search.trim() })); setPage(0) }, 350); return () => clearTimeout(t) }, [search])
  const feed = usePayoutFeed(q, page, 20)
  const rows = feed.data?.content ?? []
  const counts = feed.data?.statusCounts ?? {}
  const total = Object.values(counts).reduce<number>((s, n) => s + (n ?? 0), 0)
  const update = (p: Partial<PayoutQuery>) => { setQ((s) => ({ ...s, ...p })); setPage(0) }
  const filtered = q.status !== 'ALL' || !!q.method || !!q.q || !!q.from || !!q.to

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-col gap-3 rounded-2xl border border-border bg-card p-3 shadow-sm">
        <div className="flex flex-col gap-3 xl:flex-row xl:items-center">
          <div role="tablist" className="flex gap-1 overflow-x-auto rounded-xl bg-muted/60 p-1">
            {(['ALL', 'PENDING', 'APPROVED', 'REJECTED'] as const).map((s) => {
              const on = q.status === s
              const n = s === 'ALL' ? total : counts[s as PayoutStatus] ?? 0
              return (
                <button key={s} type="button" role="tab" aria-selected={on} onClick={() => update({ status: s })}
                  className={cn('relative whitespace-nowrap rounded-lg px-3 py-1.5 text-xs font-medium', on ? 'text-foreground' : 'text-muted-foreground hover:text-foreground')}>
                  {on && <motion.span layoutId="hist-status" className="absolute inset-0 rounded-lg bg-card shadow-sm" />}
                  <span className="relative flex items-center gap-1.5">{s === 'ALL' ? 'All' : statusMeta(s).label}<span className="rounded-full bg-muted px-1.5 text-[10px] tabular-nums text-muted-foreground">{n}</span></span>
                </button>
              )
            })}
          </div>
          <div className="relative min-w-0 flex-1">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search vendor, UPI ID, account name/number or #ID…" aria-label="Search withdrawals"
              className="h-9 w-full rounded-lg border border-border bg-background pl-9 pr-8 text-sm focus:outline-none focus:ring-2 focus:ring-ring" />
            {search && <button type="button" onClick={() => setSearch('')} aria-label="Clear" className="absolute right-2 top-1/2 flex h-6 w-6 -translate-y-1/2 items-center justify-center rounded text-muted-foreground hover:bg-muted"><X className="h-3.5 w-3.5" /></button>}
          </div>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <select aria-label="Method" value={q.method} onChange={(e) => update({ method: e.target.value as PayoutQuery['method'] })} className="h-9 rounded-lg border border-border bg-background px-2.5 text-sm">
            <option value="">Any method</option><option value="UPI">UPI</option><option value="BANK_TRANSFER">Bank transfer</option>
          </select>
          <span className="flex items-center gap-1.5 text-xs text-muted-foreground"><CalendarRange className="h-4 w-4" /> From</span>
          <input type="date" value={q.from} onChange={(e) => update({ from: e.target.value })} aria-label="From" className="h-9 rounded-lg border border-border bg-background px-2.5 text-sm" />
          <span className="text-xs text-muted-foreground">to</span>
          <input type="date" value={q.to} onChange={(e) => update({ to: e.target.value })} aria-label="To" className="h-9 rounded-lg border border-border bg-background px-2.5 text-sm" />
          <select aria-label="Sort" value={q.sort} onChange={(e) => update({ sort: e.target.value as PayoutQuery['sort'] })} className="h-9 rounded-lg border border-border bg-background px-2.5 text-sm">
            <option value="newest">Newest first</option><option value="oldest">Oldest first</option><option value="amount_high">Biggest amount</option><option value="amount_low">Smallest amount</option>
          </select>
          {filtered && <button type="button" onClick={() => { setSearch(''); setQ(ALL); setPage(0) }} className="text-xs font-medium text-muted-foreground hover:text-foreground">Reset</button>}
          {feed.data && <p className="ml-auto text-xs text-muted-foreground"><b className="text-foreground">{feed.data.totalElements}</b> found · <b className="text-foreground">{formatInrFull(feed.data.matchingAmount)}</b></p>}
        </div>
      </div>

      {feed.isError ? <ErrorState title="Couldn't load withdrawals" description="Check the connection and try again." onRetry={() => void feed.refetch()} />
        : feed.isLoading ? <div className="flex flex-col gap-2">{Array.from({ length: 6 }).map((_, i) => <div key={i} className="h-16 animate-pulse rounded-2xl bg-muted" />)}</div>
          : rows.length === 0 ? (
            <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-border py-16 text-center">
              <Wallet className="mb-3 h-10 w-10 text-muted-foreground/40" />
              <p className="text-sm font-medium text-foreground">{filtered ? 'No withdrawals match' : 'No withdrawals yet'}</p>
            </div>
          ) : (
            <div className="flex flex-col gap-2">
              {rows.map((r, i) => <HistoryRow key={r.id} row={r} index={i} onOpen={() => void navigate({ to: '/withdrawals/$withdrawalId', params: { withdrawalId: String(r.id) } })} />)}
            </div>
          )}
      <Pager page={page} totalPages={feed.data?.totalPages ?? 0} onPage={setPage} />
    </div>
  )
}

function HistoryRow({ row: w, index, onOpen }: { row: PayoutRow; index: number; onOpen: () => void }) {
  const s = statusMeta(w.status)
  const m = methodMeta(w.method)
  const name = w.vendorName ?? `Vendor #${w.vendorId}`
  return (
    <motion.button type="button" onClick={onOpen} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: Math.min(index, 12) * 0.03 }}
      className="group relative flex w-full items-center gap-3 overflow-hidden rounded-2xl border border-border bg-card px-4 py-3 text-left shadow-sm transition-all hover:-translate-y-0.5 hover:shadow-lg">
      <span className={cn('absolute inset-y-0 left-0 w-1 bg-gradient-to-b', s.tone)} aria-hidden />
      <span className={cn('flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br text-xs font-bold text-white', avatarGradient(w.vendorId))}>{vendorInitials(name)}</span>
      <span className="min-w-0 flex-1">
        <span className="flex items-center gap-2">
          <span className="truncate text-sm font-semibold text-foreground">{name}</span>
          <span className={cn('flex shrink-0 items-center gap-1 rounded-full px-2 py-px text-[10px] font-semibold', s.chip)}><s.icon className="h-3 w-3" />{s.label}</span>
        </span>
        <span className="mt-0.5 flex flex-wrap items-center gap-x-3 text-[11px] text-muted-foreground">
          <span className="flex items-center gap-1"><m.icon className="h-3 w-3" />{w.method === 'UPI' ? w.upiId : `${w.bankAccountName ?? ''} ··${(w.bankAccountNumber ?? '').slice(-4)}`}</span>
          <span className="font-mono">#{w.id}</span>
          {w.adminNote && <span className="truncate italic">“{w.adminNote}”</span>}
        </span>
      </span>
      <span className="shrink-0 text-right">
        <span className={cn('block text-base font-bold tabular-nums', w.status === 'REJECTED' ? 'text-muted-foreground line-through' : 'text-foreground')}>{formatInrFull(w.amount)}</span>
        <span className="block text-[11px] text-muted-foreground">{w.createdAt ? formatRelative(w.createdAt) : '—'}</span>
      </span>
      <Go className="h-4 w-4 shrink-0 text-muted-foreground/50 transition-transform group-hover:translate-x-0.5" />
    </motion.button>
  )
}

function Pager({ page, totalPages, onPage }: { page: number; totalPages: number; onPage: (p: number) => void }) {
  if (totalPages <= 1) return null
  return (
    <div className="flex items-center justify-end gap-1">
      <button type="button" onClick={() => onPage(Math.max(0, page - 1))} disabled={page === 0} aria-label="Previous page" className="flex h-8 w-8 items-center justify-center rounded-lg border border-border text-muted-foreground hover:bg-muted disabled:opacity-40"><ChevronLeft className="h-4 w-4" /></button>
      <span className="px-2 text-xs tabular-nums text-muted-foreground">Page {page + 1} of {totalPages}</span>
      <button type="button" onClick={() => onPage(Math.min(totalPages - 1, page + 1))} disabled={page >= totalPages - 1} aria-label="Next page" className="flex h-8 w-8 items-center justify-center rounded-lg border border-border text-muted-foreground hover:bg-muted disabled:opacity-40"><ChevronRight className="h-4 w-4" /></button>
    </div>
  )
}
