import { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import { CalendarRange, ChevronLeft, ChevronRight, HandCoins, Search, X } from 'lucide-react'
import { cn } from '@/lib/utils'
import { ErrorState } from '@/components/common/ErrorState'
import { formatInrFull } from '@/features/vendors/utils/vendor-meta'
import { useRedemptionFeed, type FeedQuery, type FeedStatus, type RedemptionRow } from '../api/redemption-insights.api'
import { RedemptionRowCard } from './RedemptionRowCard'

const PAGE_SIZE = 20
const DEFAULT: FeedQuery = { status: 'ALL', q: '', from: '', to: '', sort: 'newest' }

const STATUS_TABS: { value: FeedStatus; label: string; keys?: string[] }[] = [
  { value: 'ALL', label: 'All' },
  { value: 'PENDING', label: 'Waiting', keys: ['PENDING'] },
  { value: 'COMPLETED', label: 'Completed', keys: ['COMPLETED'] },
  { value: 'REFUSED', label: 'Rejected / failed', keys: ['REJECTED', 'FAILED', 'REVERSED'] },
  { value: 'CANCELLED', label: 'Cancelled', keys: ['CANCELLED'] },
]

/** Every redemption, searchable and filterable, refreshing live. */
export function RedemptionFeed({ live, onOpen }: { live: boolean; onOpen: (r: RedemptionRow) => void }) {
  const [query, setQuery] = useState<FeedQuery>(DEFAULT)
  const [search, setSearch] = useState('')
  const [page, setPage] = useState(0)
  useEffect(() => {
    const t = setTimeout(() => { setQuery((q) => (q.q === search.trim() ? q : { ...q, q: search.trim() })); setPage(0) }, 350)
    return () => clearTimeout(t)
  }, [search])
  const feed = useRedemptionFeed(query, page, PAGE_SIZE, live)
  const rows = feed.data?.content ?? []
  const counts = feed.data?.statusCounts ?? {}
  const totalAll = Object.values(counts).reduce<number>((s, n) => s + (n ?? 0), 0)
  const totalPages = feed.data?.totalPages ?? 0
  const filtered = query.status !== 'ALL' || !!query.q || !!query.from || !!query.to
  const update = (p: Partial<FeedQuery>) => { setQuery((q) => ({ ...q, ...p })); setPage(0) }
  const reset = () => { setSearch(''); setQuery(DEFAULT); setPage(0) }

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-col gap-3 rounded-2xl border border-border bg-card p-3 shadow-sm">
        <div className="flex flex-col gap-3 xl:flex-row xl:items-center">
          <div role="tablist" aria-label="Status" className="flex gap-1 overflow-x-auto rounded-xl bg-muted/60 p-1">
            {STATUS_TABS.map((t) => {
              const on = query.status === t.value
              const n = t.keys ? t.keys.reduce((s, k) => s + (counts[k as keyof typeof counts] ?? 0), 0) : totalAll
              return (
                <button key={t.value} type="button" role="tab" aria-selected={on} onClick={() => update({ status: t.value })}
                  className={cn('relative whitespace-nowrap rounded-lg px-3 py-1.5 text-xs font-medium transition-colors', on ? 'text-foreground' : 'text-muted-foreground hover:text-foreground')}>
                  {on && <motion.span layoutId="red-status" className="absolute inset-0 rounded-lg bg-card shadow-sm" transition={{ type: 'spring', stiffness: 500, damping: 35 }} />}
                  <span className="relative flex items-center gap-1.5">
                    {t.value === 'PENDING' && n > 0 && <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-amber-500" />}
                    {t.label}
                    <span className="rounded-full bg-muted px-1.5 text-[10px] tabular-nums text-muted-foreground">{n}</span>
                  </span>
                </button>
              )
            })}
          </div>
          <div className="relative min-w-0 flex-1">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search customer, mobile, store, card or #ID…" aria-label="Search redemptions"
              className="h-9 w-full rounded-lg border border-border bg-background pl-9 pr-8 text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring" />
            {search && (
              <button type="button" onClick={() => setSearch('')} aria-label="Clear search" className="absolute right-2 top-1/2 flex h-6 w-6 -translate-y-1/2 items-center justify-center rounded text-muted-foreground hover:bg-muted">
                <X className="h-3.5 w-3.5" />
              </button>
            )}
          </div>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <span className="flex items-center gap-1.5 text-xs text-muted-foreground"><CalendarRange className="h-4 w-4" /> From</span>
          <input type="date" value={query.from} onChange={(e) => update({ from: e.target.value })} aria-label="From date"
            className="h-9 rounded-lg border border-border bg-background px-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-ring" />
          <span className="text-xs text-muted-foreground">to</span>
          <input type="date" value={query.to} onChange={(e) => update({ to: e.target.value })} aria-label="To date"
            className="h-9 rounded-lg border border-border bg-background px-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-ring" />
          <select aria-label="Sort" value={query.sort} onChange={(e) => update({ sort: e.target.value as FeedQuery['sort'] })}
            className="h-9 rounded-lg border border-border bg-background px-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-ring">
            <option value="newest">Newest first</option>
            <option value="oldest">Oldest first</option>
            <option value="amount_high">Biggest amount</option>
            <option value="amount_low">Smallest amount</option>
          </select>
          {filtered && <button type="button" onClick={reset} className="text-xs font-medium text-muted-foreground hover:text-foreground">Reset</button>}
          {feed.data && (
            <p className="ml-auto text-xs text-muted-foreground">
              <span className="font-semibold text-foreground">{feed.data.totalElements}</span> found
              {feed.data.matchingCompleted ? <> · <span className="font-semibold text-foreground">{formatInrFull(feed.data.matchingAmount)}</span> redeemed</> : null}
            </p>
          )}
        </div>
      </div>

      {feed.isError ? (
        <ErrorState title="Couldn't load redemptions" description="Check the connection and try again." onRetry={() => void feed.refetch()} />
      ) : feed.isLoading ? (
        <div className="flex flex-col gap-2">{Array.from({ length: 6 }).map((_, i) => <div key={i} className="h-[68px] animate-pulse rounded-2xl bg-muted" />)}</div>
      ) : rows.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-border py-16 text-center">
          <HandCoins className="mb-3 h-10 w-10 text-muted-foreground/40" />
          <p className="text-sm font-medium text-foreground">{filtered ? 'No redemptions match' : 'No redemptions yet'}</p>
          {filtered && <button type="button" onClick={reset} className="mt-3 text-sm font-medium text-primary hover:underline">Clear filters</button>}
        </div>
      ) : (
        <div className={cn('flex flex-col gap-2 transition-opacity', feed.isFetching && !live && 'opacity-70')}>
          {rows.map((r, i) => <RedemptionRowCard key={r.id} row={r} index={i} onOpen={onOpen} />)}
        </div>
      )}

      {totalPages > 1 && (
        <div className="flex items-center justify-end gap-1">
          <button type="button" onClick={() => setPage((p) => Math.max(0, p - 1))} disabled={page === 0} aria-label="Previous page"
            className="flex h-8 w-8 items-center justify-center rounded-lg border border-border text-muted-foreground hover:bg-muted disabled:opacity-40"><ChevronLeft className="h-4 w-4" /></button>
          <span className="px-2 text-xs tabular-nums text-muted-foreground">Page {page + 1} of {totalPages}</span>
          <button type="button" onClick={() => setPage((p) => Math.min(totalPages - 1, p + 1))} disabled={page >= totalPages - 1} aria-label="Next page"
            className="flex h-8 w-8 items-center justify-center rounded-lg border border-border text-muted-foreground hover:bg-muted disabled:opacity-40"><ChevronRight className="h-4 w-4" /></button>
        </div>
      )}
    </div>
  )
}
