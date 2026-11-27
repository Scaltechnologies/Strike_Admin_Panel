import { useEffect, useState } from 'react'
import { useNavigate } from '@tanstack/react-router'
import { motion } from 'framer-motion'
import { ArrowUpRight, ChevronLeft, ChevronRight, Clock, ImageOff, PackageX, Search, Store, UtensilsCrossed, X } from 'lucide-react'
import { cn } from '@/lib/utils'
import { ErrorState } from '@/components/common/ErrorState'
import { formatRelative } from '@/utils/helpers/date'
import { avatarGradient, vendorInitials } from '@/features/vendors/utils/vendor-meta'
import { useMenuStores, type StoreMenuSummary, type StoreSort } from '../api/menu-admin.api'
import { formatPrice, usableImage } from '../utils/menu-meta'

const PAGE_SIZE = 24

export function StoresPanel() {
  const navigate = useNavigate()
  const [search, setSearch] = useState('')
  const [q, setQ] = useState('')
  const [sort, setSort] = useState<StoreSort>('items')
  const [page, setPage] = useState(0)
  useEffect(() => {
    const t = setTimeout(() => { setQ(search.trim()); setPage(0) }, 350)
    return () => clearTimeout(t)
  }, [search])
  const stores = useMenuStores(q, sort, page, PAGE_SIZE)
  const list = stores.data?.content ?? []
  const totalPages = stores.data?.totalPages ?? 0
  const open = (s: StoreMenuSummary) => void navigate({ to: '/menus/$storeId', params: { storeId: String(s.storeId) }, search: {} })

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-col gap-3 rounded-2xl border border-border bg-card p-3 shadow-sm sm:flex-row sm:items-center">
        <div className="relative min-w-0 flex-1">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search store, vendor or area…" aria-label="Search stores"
            className="h-9 w-full rounded-lg border border-border bg-background pl-9 pr-8 text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring" />
          {search && (
            <button type="button" onClick={() => setSearch('')} aria-label="Clear search" className="absolute right-2 top-1/2 flex h-6 w-6 -translate-y-1/2 items-center justify-center rounded text-muted-foreground hover:bg-muted">
              <X className="h-3.5 w-3.5" />
            </button>
          )}
        </div>
        <select aria-label="Sort" value={sort} onChange={(e) => { setSort(e.target.value as StoreSort); setPage(0) }}
          className="h-9 rounded-lg border border-border bg-background px-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-ring">
          <option value="items">Biggest menus</option>
          <option value="pending">Most waiting for approval</option>
          <option value="updated">Recently updated</option>
          <option value="out_of_stock">Most out of stock</option>
          <option value="name">Name A–Z</option>
        </select>
      </div>

      {stores.isError ? (
        <ErrorState title="Couldn't load stores" description="Check the connection and try again." onRetry={() => void stores.refetch()} />
      ) : stores.isLoading ? (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4">{Array.from({ length: 8 }).map((_, i) => <div key={i} className="h-56 animate-pulse rounded-2xl bg-muted" />)}</div>
      ) : list.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-border py-16 text-center">
          <Store className="mb-3 h-10 w-10 text-muted-foreground/40" />
          <p className="text-sm font-medium text-foreground">No stores found</p>
        </div>
      ) : (
        <div className={cn('grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4', stores.isFetching && 'opacity-70')}>
          {list.map((s, i) => <StoreMenuCard key={s.storeId} store={s} index={i} onOpen={open} />)}
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

function StoreMenuCard({ store: s, index, onOpen }: { store: StoreMenuSummary; index: number; onOpen: (s: StoreMenuSummary) => void }) {
  const logo = usableImage(s.logoUrl)
  const vegPct = s.items > 0 ? Math.round((s.veg / s.items) * 100) : 0
  return (
    <motion.article role="link" tabIndex={0} aria-label={`Open ${s.name ?? 'store'} menu`}
      initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: Math.min(index, 12) * 0.04, type: 'spring', stiffness: 280, damping: 26 }}
      whileHover={{ y: -4 }} onClick={() => onOpen(s)} onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); onOpen(s) } }}
      className="group relative flex cursor-pointer flex-col overflow-hidden rounded-2xl border border-border bg-card shadow-sm transition-shadow hover:shadow-xl hover:shadow-black/[0.06] focus:outline-none focus-visible:ring-2 focus-visible:ring-ring">
      <div className={cn('relative h-16 bg-gradient-to-br', avatarGradient(s.storeId))}>
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_80%_-20%,rgba(255,255,255,0.35),transparent_60%)]" aria-hidden />
        <UtensilsCrossed className="absolute -bottom-3 right-3 h-16 w-16 rotate-12 text-white/15" aria-hidden />
        {s.pendingChanges > 0 && (
          <span className="absolute right-3 top-3 flex items-center gap-1 rounded-full bg-white/95 px-2 py-0.5 text-[10px] font-bold text-amber-700 shadow">
            <span className="relative flex h-2 w-2"><span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-amber-400 opacity-75" /><span className="relative inline-flex h-2 w-2 rounded-full bg-amber-500" /></span>
            {s.pendingChanges} waiting
          </span>
        )}
      </div>
      <div className="relative z-10 flex flex-1 flex-col gap-3 px-4 pb-4">
        <div className="-mt-7 flex items-start gap-3">
          <span className={cn('flex h-14 w-14 shrink-0 items-center justify-center overflow-hidden rounded-2xl bg-gradient-to-br text-base font-bold text-white shadow-lg ring-4 ring-card', avatarGradient(s.storeId + 3))}>
            {logo ? <img src={logo} alt="" className="h-full w-full object-cover" /> : vendorInitials(s.name)}
          </span>
          <div className="min-w-0 pt-8">
            <h3 className="truncate text-sm font-semibold text-foreground">{s.name ?? `Store #${s.storeId}`}</h3>
            <p className="truncate text-xs text-muted-foreground">{s.vendorName ?? '—'}{s.address ? ` · ${s.address}` : ''}</p>
          </div>
        </div>

        <div className="grid grid-cols-3 gap-1.5 text-center">
          <Mini label="Items" value={String(s.items)} />
          <Mini label="Categories" value={String(s.categories)} />
          <Mini label="Avg price" value={s.items ? formatPrice(Math.round(s.averagePrice)) : '—'} />
        </div>

        {s.items > 0 && (
          <div>
            <div className="flex justify-between text-[10px] text-muted-foreground">
              <span className="text-emerald-600 dark:text-emerald-400">{vegPct}% veg</span>
              <span className="text-rose-600 dark:text-rose-400">{100 - vegPct}% non-veg</span>
            </div>
            <div className="mt-1 flex h-1.5 overflow-hidden rounded-full bg-rose-500/80">
              <motion.span className="h-full bg-emerald-500" initial={{ width: 0 }} animate={{ width: `${vegPct}%` }} transition={{ duration: 0.9, delay: 0.2 + index * 0.03 }} />
            </div>
          </div>
        )}

        <div className="flex flex-wrap gap-1.5 text-[10px]">
          {s.items > 0 && <span className="rounded-full bg-muted px-2 py-0.5 text-muted-foreground">{formatPrice(s.minPrice)} – {formatPrice(s.maxPrice)}</span>}
          {s.outOfStock > 0 && <span className="flex items-center gap-1 rounded-full bg-amber-100 px-2 py-0.5 text-amber-700 dark:bg-amber-400/10 dark:text-amber-300"><PackageX className="h-3 w-3" />{s.outOfStock} out of stock</span>}
          {s.withoutPhoto > 0 && <span className="flex items-center gap-1 rounded-full bg-muted px-2 py-0.5 text-muted-foreground"><ImageOff className="h-3 w-3" />{s.withoutPhoto} no photo</span>}
          {s.items === 0 && <span className="rounded-full bg-muted px-2 py-0.5 text-muted-foreground">No menu yet</span>}
        </div>

        <div className="mt-auto flex items-center justify-between border-t border-border pt-2.5 text-[11px] text-muted-foreground">
          <span className="flex items-center gap-1"><Clock className="h-3 w-3" />{s.lastUpdatedAt ? `Updated ${formatRelative(s.lastUpdatedAt)}` : 'Never updated'}</span>
          <span className="flex items-center gap-0.5 font-medium text-primary opacity-0 transition-opacity group-hover:opacity-100">Open menu <ArrowUpRight className="h-3.5 w-3.5" /></span>
        </div>
      </div>
    </motion.article>
  )
}

function Mini({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl bg-muted/50 px-2 py-1.5">
      <p className="truncate text-sm font-bold tabular-nums text-foreground">{value}</p>
      <p className="text-[10px] text-muted-foreground">{label}</p>
    </div>
  )
}
