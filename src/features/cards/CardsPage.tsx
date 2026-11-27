import { useCallback, useEffect, useMemo, useState } from 'react'
import { useNavigate } from '@tanstack/react-router'
import { motion } from 'framer-motion'
import {
  ChevronLeft, ChevronRight, CreditCard, IndianRupee, LayoutGrid, List, RefreshCw, Search, ShoppingBag, Users, Wallet, X,
  type LucideIcon,
} from 'lucide-react'
import { ErrorState } from '@/components/common/ErrorState'
import { cn } from '@/lib/utils'
import { formatRelative } from '@/utils/helpers/date'
import { formatInrShort, formatInrFull } from '@/features/vendors/utils/vendor-meta'
import { useVendors } from '@/features/vendors/hooks/useVendors'
import { useCardCatalog, useCardCounts, type CatalogCard, type CatalogQuery, type CardStatusFilter } from './api/card-insights.api'
import { CardTile } from './components/CardTile'
import { StrikeCardVisual } from './components/StrikeCardVisual'
import { cardTheme, validityLabel } from './utils/card-meta'

const PAGE_SIZE = 24
const VIEW_KEY = 'strike:cards:view'
const DEFAULT_QUERY: CatalogQuery = { q: '', vendorId: null, status: 'all', sort: 'newest' }

function HeaderStat({ icon: Icon, label, value, tone, onClick, active }: {
  icon: LucideIcon; label: string; value: string | number | undefined; tone: string; onClick?: () => void; active?: boolean
}) {
  const Comp = onClick ? 'button' : 'div'
  return (
    <Comp type={onClick ? 'button' : undefined} onClick={onClick}
      className={cn('flex items-center gap-3 rounded-2xl border border-white/10 bg-white/[0.06] px-4 py-3 text-left backdrop-blur-md transition-all',
        onClick && 'hover:-translate-y-0.5 hover:bg-white/[0.12]', active && 'ring-2 ring-white/50')}>
      <span className={cn('flex h-9 w-9 shrink-0 items-center justify-center rounded-xl text-white shadow-lg', tone)}><Icon className="h-4 w-4" /></span>
      <span className="min-w-0">
        <span className="block truncate text-xl font-bold leading-none text-white tabular-nums">{value ?? '—'}</span>
        <span className="mt-1 block truncate text-[11px] text-white/60">{label}</span>
      </span>
    </Comp>
  )
}

/** Three cards fanned out in the header, gently floating. */
function HeroDeck({ cards }: { cards: CatalogCard[] }) {
  if (cards.length === 0) return null
  // cards[0] (best seller) sits in front; the next two fan out behind it.
  const SPOTS = [
    { rotate: -2, x: 0, y: 0, z: 3 },
    { rotate: -14, x: -70, y: 18, z: 1 },
    { rotate: 10, x: 70, y: 22, z: 2 },
  ]
  return (
    <div className="relative hidden h-44 w-[340px] shrink-0 lg:block" aria-hidden>
      {cards.slice(0, 3).map((card, i) => {
        const f = SPOTS[i]
        return (
          <motion.div key={card.id} className="absolute left-1/2 top-2 w-56 -ml-28"
            initial={{ opacity: 0, y: 40, rotate: 0 }}
            animate={{ opacity: 1, y: [f.y, f.y - 8, f.y], x: f.x, rotate: f.rotate }}
            transition={{ opacity: { delay: 0.15 * i }, x: { delay: 0.15 * i, type: 'spring', stiffness: 120, damping: 14 }, rotate: { delay: 0.15 * i, type: 'spring', stiffness: 120, damping: 14 }, y: { duration: 5 + i, repeat: Infinity, ease: 'easeInOut', delay: i * 0.6 } }}
            style={{ zIndex: f.z }}>
            <StrikeCardVisual card={card} tilt={false} sheenDelay={i * 1.3} />
          </motion.div>
        )
      })}
    </div>
  )
}

function CardRow({ card, index, onOpen }: { card: CatalogCard; index: number; onOpen: (c: CatalogCard) => void }) {
  const theme = cardTheme(card)
  return (
    <motion.tr initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: Math.min(index, 15) * 0.02 }}
      onClick={() => onOpen(card)} className="cursor-pointer border-b border-border transition-colors last:border-0 hover:bg-muted/50">
      <td className="px-4 py-3">
        <div className="flex items-center gap-3">
          <span className="h-8 w-12 shrink-0 rounded-md shadow ring-1 ring-black/5" style={{ background: theme.background }} />
          <div className="min-w-0">
            <p className="truncate text-sm font-medium text-foreground">{card.name}</p>
            <p className="truncate text-xs text-muted-foreground">#{card.id} · {card.vendorName ?? card.storeName ?? '—'}</p>
          </div>
        </div>
      </td>
      <td className="px-4 py-3">
        <span className={cn('rounded-full px-2 py-0.5 text-[11px] font-semibold', card.isActive ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-400/10 dark:text-emerald-300' : 'bg-muted text-muted-foreground')}>
          {card.isActive ? 'On sale' : 'Paused'}
        </span>
      </td>
      <td className="px-4 py-3 text-sm tabular-nums text-foreground">{formatInrFull(card.cardPrice)} <span className="text-muted-foreground">→ {formatInrFull(card.walletAmount)}</span></td>
      <td className="px-4 py-3 text-xs text-muted-foreground">{validityLabel(card.validityInDays)}</td>
      <td className="px-4 py-3 text-sm tabular-nums text-foreground">{card.sold} <span className="text-xs text-muted-foreground">· {card.activeHolders} now</span></td>
      <td className="px-4 py-3 text-sm font-semibold tabular-nums text-foreground">{formatInrShort(card.revenue)}</td>
      <td className="px-4 py-3 text-xs text-muted-foreground">{card.lastSoldAt ? formatRelative(card.lastSoldAt) : '—'}</td>
    </motion.tr>
  )
}

export function CardsPage() {
  const navigate = useNavigate()
  const [query, setQuery] = useState<CatalogQuery>(DEFAULT_QUERY)
  const [search, setSearch] = useState('')
  const [page, setPage] = useState(0)
  const [view, setView] = useState<'grid' | 'table'>(() => (localStorage.getItem(VIEW_KEY) === 'table' ? 'table' : 'grid'))

  useEffect(() => {
    const t = setTimeout(() => {
      setQuery((q) => (q.q === search.trim() ? q : { ...q, q: search.trim() }))
      setPage(0)
    }, 350)
    return () => clearTimeout(t)
  }, [search])

  const catalog = useCardCatalog(query, page, PAGE_SIZE)
  const counts = useCardCounts()
  const vendors = useVendors(0, 100, { q: '', status: '', kycStatus: '' })
  const c = counts.data
  const cards = useMemo(() => catalog.data?.content ?? [], [catalog.data])
  const totalPages = catalog.data?.totalPages ?? 0
  const filtered = !!query.q || query.vendorId != null || query.status !== 'all'
  // The best seller on this page gets a badge, if it has sold at all.
  const topId = useMemo(() => {
    const best = cards.reduce<CatalogCard | null>((b, x) => (x.sold > (b?.sold ?? 0) ? x : b), null)
    return best && cards.length > 1 ? best.id : null
  }, [cards])
  const deck = useMemo(() => [...cards].sort((a, b) => b.sold - a.sold).slice(0, 3), [cards])

  const update = (patch: Partial<CatalogQuery>) => { setQuery((q) => ({ ...q, ...patch })); setPage(0) }
  const reset = () => { setSearch(''); setQuery(DEFAULT_QUERY); setPage(0) }
  const switchView = (v: 'grid' | 'table') => { setView(v); localStorage.setItem(VIEW_KEY, v) }
  const open = useCallback((card: CatalogCard) => {
    void navigate({ to: '/cards/$cardId', params: { cardId: String(card.id) } })
  }, [navigate])

  const total = c?.total
  const active = c?.active
  const STATUS_TABS: { value: CardStatusFilter; label: string; count?: number }[] = [
    { value: 'all', label: 'All cards', count: total },
    { value: 'active', label: 'On sale', count: active },
    { value: 'inactive', label: 'Paused', count: total != null && active != null ? total - active : undefined },
  ]

  return (
    <div className="flex flex-col gap-5 p-4 sm:p-6">
      <motion.section initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}
        className="relative overflow-hidden rounded-3xl bg-[#0b0c10] p-6 text-white shadow-xl shadow-black/10 sm:p-7">
        <div className="auth-aurora pointer-events-none absolute inset-0 opacity-70" aria-hidden><span /><span /><span /></div>
        <div className="auth-grid pointer-events-none absolute inset-0" aria-hidden />
        <div className="relative z-10 flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex min-w-0 flex-1 flex-col gap-6">
            <div className="flex items-start gap-4">
              <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-amber-300 via-orange-500 to-[#e01a00] shadow-lg shadow-orange-600/40">
                <CreditCard className="h-6 w-6" />
              </span>
              <div>
                <h1 className="text-2xl font-bold tracking-tight">Cards</h1>
                <p className="mt-1 max-w-lg text-sm text-white/60">Every membership card vendors sell on Strike. Tap a card to see who bought it, how it sells and how it&apos;s being used.</p>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 2xl:grid-cols-5">
              <HeaderStat icon={CreditCard} label={`Cards · ${c?.vendors ?? '—'} vendors`} value={total} tone="bg-gradient-to-br from-amber-400 to-orange-600"
                onClick={() => update({ status: 'all' })} active={query.status === 'all' && !filtered} />
              <HeaderStat icon={ShoppingBag} label="Times bought" value={c?.sold} tone="bg-gradient-to-br from-pink-400 to-rose-600"
                onClick={() => update({ sort: 'best_selling' })} active={query.sort === 'best_selling'} />
              <HeaderStat icon={IndianRupee} label="Card revenue" value={c ? formatInrShort(c.revenue) : undefined} tone="bg-gradient-to-br from-emerald-400 to-teal-600"
                onClick={() => update({ sort: 'top_revenue' })} active={query.sort === 'top_revenue'} />
              <HeaderStat icon={Users} label="People holding one" value={c?.activeHolders} tone="bg-gradient-to-br from-sky-400 to-indigo-600" />
              <HeaderStat icon={Wallet} label="Unspent wallet money" value={c ? formatInrShort(c.walletOutstanding) : undefined} tone="bg-gradient-to-br from-violet-400 to-fuchsia-600" />
            </div>
          </div>
          <HeroDeck cards={deck} />
        </div>
      </motion.section>

      <div className="flex flex-col gap-3 rounded-2xl border border-border bg-card p-3 shadow-sm">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-center">
          <div role="tablist" aria-label="Card status" className="flex gap-1 overflow-x-auto rounded-xl bg-muted/60 p-1">
            {STATUS_TABS.map((s) => {
              const on = query.status === s.value
              return (
                <button key={s.value} type="button" role="tab" aria-selected={on} onClick={() => update({ status: s.value })}
                  className={cn('relative whitespace-nowrap rounded-lg px-3 py-1.5 text-xs font-medium transition-colors', on ? 'text-foreground' : 'text-muted-foreground hover:text-foreground')}>
                  {on && <motion.span layoutId="card-status" className="absolute inset-0 rounded-lg bg-card shadow-sm" transition={{ type: 'spring', stiffness: 500, damping: 35 }} />}
                  <span className="relative flex items-center gap-1.5">
                    {s.label}
                    {s.count != null && <span className="rounded-full bg-muted px-1.5 text-[10px] tabular-nums text-muted-foreground">{s.count}</span>}
                  </span>
                </button>
              )
            })}
          </div>
          <div className="relative min-w-0 flex-1">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search by card name, description or vendor…" aria-label="Search cards"
              className="h-9 w-full rounded-lg border border-border bg-background pl-9 pr-8 text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring" />
            {search && (
              <button type="button" onClick={() => setSearch('')} aria-label="Clear search" className="absolute right-2 top-1/2 flex h-6 w-6 -translate-y-1/2 items-center justify-center rounded text-muted-foreground hover:bg-muted">
                <X className="h-3.5 w-3.5" />
              </button>
            )}
          </div>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <select aria-label="Vendor" value={query.vendorId ?? ''} onChange={(e) => update({ vendorId: e.target.value ? Number(e.target.value) : null })}
            className="h-9 max-w-[220px] rounded-lg border border-border bg-background px-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-ring">
            <option value="">All vendors</option>
            {(vendors.data?.content ?? []).map((v) => <option key={v.vendorId} value={v.vendorId}>{v.hotelName}</option>)}
          </select>
          <select aria-label="Sort" value={query.sort} onChange={(e) => update({ sort: e.target.value as CatalogQuery['sort'] })}
            className="h-9 rounded-lg border border-border bg-background px-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-ring">
            <option value="newest">Newest first</option>
            <option value="best_selling">Best selling</option>
            <option value="top_revenue">Most revenue</option>
            <option value="price_high">Price: high to low</option>
            <option value="price_low">Price: low to high</option>
            <option value="oldest">Oldest first</option>
          </select>
          {filtered && <button type="button" onClick={reset} className="text-xs font-medium text-muted-foreground hover:text-foreground">Reset</button>}
          <div className="ml-auto flex items-center gap-2">
            <div className="flex rounded-lg border border-border p-0.5" role="radiogroup" aria-label="View">
              {([['grid', LayoutGrid, 'Cards'], ['table', List, 'List']] as const).map(([v, Icon, label]) => (
                <button key={v} type="button" role="radio" aria-checked={view === v} aria-label={label} title={label} onClick={() => switchView(v)}
                  className={cn('flex h-7 w-8 items-center justify-center rounded-md transition-colors', view === v ? 'bg-primary text-primary-foreground shadow-sm' : 'text-muted-foreground hover:text-foreground')}>
                  <Icon className="h-4 w-4" />
                </button>
              ))}
            </div>
            <button type="button" onClick={() => { void catalog.refetch(); void counts.refetch() }} aria-label="Refresh"
              className="flex h-9 w-9 items-center justify-center rounded-lg border border-border text-muted-foreground hover:bg-muted hover:text-foreground">
              <RefreshCw className={cn('h-4 w-4', catalog.isFetching && 'animate-spin')} />
            </button>
          </div>
        </div>
      </div>

      {catalog.isError ? (
        <ErrorState title="Couldn't load cards" description="Check the connection and try again." onRetry={() => void catalog.refetch()} />
      ) : catalog.isLoading ? (
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4">
          {Array.from({ length: 8 }).map((_, i) => <div key={i} className="h-[330px] animate-pulse rounded-3xl bg-muted" />)}
        </div>
      ) : cards.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-border py-20 text-center">
          <CreditCard className="mb-3 h-10 w-10 text-muted-foreground/40" />
          <p className="text-sm font-medium text-foreground">{filtered ? 'No cards match' : 'No cards yet'}</p>
          <p className="mt-1 text-xs text-muted-foreground">{filtered ? 'Try a different search or filter.' : 'Cards appear here once vendors create them in the vendor app.'}</p>
          {filtered && <button type="button" onClick={reset} className="mt-3 text-sm font-medium text-primary hover:underline">Clear filters</button>}
        </div>
      ) : view === 'grid' ? (
        <div className={cn('grid grid-cols-1 gap-5 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4 transition-opacity', catalog.isFetching && 'opacity-70')}>
          {cards.map((card, i) => <CardTile key={card.id} card={card} index={i} onOpen={open} topSeller={card.id === topId} />)}
        </div>
      ) : (
        <div className="overflow-x-auto rounded-2xl border border-border bg-card shadow-sm">
          <table className="w-full min-w-[860px]">
            <thead>
              <tr className="border-b border-border bg-muted/40 text-left text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                <th className="px-4 py-3">Card</th><th className="px-4 py-3">Status</th><th className="px-4 py-3">Price → wallet</th>
                <th className="px-4 py-3">Validity</th><th className="px-4 py-3">Sold</th><th className="px-4 py-3">Revenue</th><th className="px-4 py-3">Last sold</th>
              </tr>
            </thead>
            <tbody>{cards.map((card, i) => <CardRow key={card.id} card={card} index={i} onOpen={open} />)}</tbody>
          </table>
        </div>
      )}

      {totalPages > 1 && (
        <div className="flex items-center justify-between">
          <p className="text-xs text-muted-foreground">
            {page * PAGE_SIZE + 1}–{Math.min((page + 1) * PAGE_SIZE, catalog.data?.totalElements ?? 0)} of {catalog.data?.totalElements ?? 0}
          </p>
          <div className="flex items-center gap-1">
            <button type="button" onClick={() => setPage((p) => Math.max(0, p - 1))} disabled={page === 0} aria-label="Previous page"
              className="flex h-8 w-8 items-center justify-center rounded-lg border border-border text-muted-foreground hover:bg-muted disabled:opacity-40"><ChevronLeft className="h-4 w-4" /></button>
            <span className="px-2 text-xs tabular-nums text-muted-foreground">Page {page + 1} of {totalPages}</span>
            <button type="button" onClick={() => setPage((p) => Math.min(totalPages - 1, p + 1))} disabled={page >= totalPages - 1} aria-label="Next page"
              className="flex h-8 w-8 items-center justify-center rounded-lg border border-border text-muted-foreground hover:bg-muted disabled:opacity-40"><ChevronRight className="h-4 w-4" /></button>
          </div>
        </div>
      )}
    </div>
  )
}

export default CardsPage
