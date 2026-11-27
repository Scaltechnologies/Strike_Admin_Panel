import { useCallback, useEffect, useMemo, useState } from 'react'
import { Link, useNavigate } from '@tanstack/react-router'
import { motion } from 'framer-motion'
import {
  BadgeCheck, ChevronLeft, ChevronRight, Clock, FileSpreadsheet, LayoutGrid, List, RefreshCw, Search, ShieldQuestion, Store, UserPlus, X,
  type LucideIcon,
} from 'lucide-react'
import { ErrorState } from '@/components/common/ErrorState'
import { PermissionGuard } from '@/core/guards/PermissionGuard'
import { PERMISSIONS } from '@/constants/permissions'
import { cn } from '@/lib/utils'
import { hasPermission } from '@/core/auth/auth'
import { AddVendorDialog } from '@/features/onboarding/components/AddVendorDialog'
import { useVendors } from './hooks/useVendors'
import { useVendorCounts, useVendorSales } from './api/vendor-insights.api'
import { VendorTable } from './components/VendorTable'
import { VendorCard } from './components/VendorCard'
import type { VendorFilters, VendorRecord } from './types/vendor.types'

const PAGE_SIZE = 24
const EMPTY_FILTERS: VendorFilters = { q: '', status: '', kycStatus: '' }
const VIEW_KEY = 'strike:vendors:view'

type View = 'grid' | 'table'

const STATUS_TABS: { value: string; label: string; countKey: 'total' | 'ACTIVE' | 'PENDING' | 'SUSPENDED' | 'REJECTED'; dot?: string }[] = [
  { value: '', label: 'All vendors', countKey: 'total' },
  { value: 'ACTIVE', label: 'Active', countKey: 'ACTIVE', dot: 'bg-emerald-500' },
  { value: 'PENDING', label: 'Waiting', countKey: 'PENDING', dot: 'bg-amber-500' },
  { value: 'SUSPENDED', label: 'Suspended', countKey: 'SUSPENDED', dot: 'bg-orange-500' },
  { value: 'REJECTED', label: 'Rejected', countKey: 'REJECTED', dot: 'bg-red-500' },
]

function HeaderStat({ icon: Icon, label, value, tone, onClick, active }: {
  icon: LucideIcon; label: string; value: number | undefined; tone: string; onClick?: () => void; active?: boolean
}) {
  const Comp = onClick ? 'button' : 'div'
  return (
    <Comp type={onClick ? 'button' : undefined} onClick={onClick}
      className={cn(
        'flex items-center gap-3 rounded-2xl border border-white/10 bg-white/[0.06] px-4 py-3 text-left backdrop-blur-md transition-all',
        onClick && 'hover:-translate-y-0.5 hover:bg-white/[0.12]',
        active && 'ring-2 ring-white/50',
      )}>
      <span className={cn('flex h-9 w-9 items-center justify-center rounded-xl text-white shadow-lg', tone)}>
        <Icon className="h-4 w-4" aria-hidden />
      </span>
      <span>
        <span className="block text-xl font-bold leading-none text-white tabular-nums">{value ?? '—'}</span>
        <span className="mt-1 block text-[11px] text-white/60">{label}</span>
      </span>
    </Comp>
  )
}

export function VendorsPage() {
  const navigate = useNavigate()
  const [page, setPage] = useState(0)
  const [filters, setFilters] = useState<VendorFilters>(EMPTY_FILTERS)
  const [searchInput, setSearchInput] = useState('')
  const [adding, setAdding] = useState(false)
  const canOnboard = hasPermission('SEC_VENDORS')
  const [view, setView] = useState<View>(() => (localStorage.getItem(VIEW_KEY) === 'table' ? 'table' : 'grid'))

  useEffect(() => {
    const t = setTimeout(() => {
      setFilters((prev) => (prev.q === searchInput ? prev : { ...prev, q: searchInput }))
      setPage(0)
    }, 350)
    return () => clearTimeout(t)
  }, [searchInput])

  const { data, isLoading, isError, refetch, isFetching } = useVendors(page, PAGE_SIZE, filters)
  const counts = useVendorCounts()
  const vendors = useMemo(() => data?.content ?? [], [data])
  const ids = useMemo(() => vendors.map((v) => v.vendorId), [vendors])
  const sales = useVendorSales(ids)

  const openVendor = useCallback((v: VendorRecord) => {
    void navigate({ to: '/vendors/$vendorId', params: { vendorId: String(v.vendorId) }, search: { tab: undefined } })
  }, [navigate])

  const setFilter = (key: keyof VendorFilters, value: string) => {
    setFilters((prev) => ({ ...prev, [key]: value }))
    setPage(0)
  }
  const switchView = (v: View) => {
    setView(v)
    localStorage.setItem(VIEW_KEY, v)
  }
  const clearAll = () => {
    setSearchInput('')
    setFilters(EMPTY_FILTERS)
    setPage(0)
  }
  const filtered = !!(filters.q || filters.status || filters.kycStatus)
  const totalPages = data?.totalPages ?? 0
  const c = counts.data

  return (
    <PermissionGuard permission={PERMISSIONS.VENDORS.VIEW}>
      <div className="flex flex-col gap-5 p-4 sm:p-6">
        {/* ── Header ─────────────────────────────────────────────────── */}
        <motion.section initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}
          className="relative overflow-hidden rounded-3xl bg-[#0b0c10] p-6 text-white shadow-xl shadow-black/10 sm:p-7">
          <div className="auth-aurora pointer-events-none absolute inset-0 opacity-70" aria-hidden><span /><span /><span /></div>
          <div className="auth-grid pointer-events-none absolute inset-0" aria-hidden />
          <div className="relative z-10 flex flex-col gap-6 xl:flex-row xl:items-end xl:justify-between">
            <div className="flex items-start gap-4">
              <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-[#ffc400] via-[#ff6a00] to-[#e01a00] shadow-lg shadow-orange-600/40">
                <Store className="h-6 w-6" aria-hidden />
              </span>
              <div>
                <h1 className="text-2xl font-bold tracking-tight">Vendors</h1>
                <p className="mt-1 max-w-lg text-sm text-white/60">
                  Every restaurant and store on Strike. Open a vendor to see their full dashboard.
                </p>
                {canOnboard && (
                  <div className="mt-4 flex flex-wrap gap-2">
                    <button type="button" onClick={() => setAdding(true)}
                      className="btn-shine flex items-center gap-2 rounded-xl bg-gradient-to-r from-[#ff8a00] to-[#e01a00] px-4 py-2 text-sm font-semibold text-white shadow-lg shadow-orange-600/30 transition-transform hover:-translate-y-0.5">
                      <UserPlus className="h-4 w-4" /> Add vendor
                    </button>
                    <Link to="/vendors/import"
                      className="flex items-center gap-2 rounded-xl border border-white/15 bg-white/[0.08] px-4 py-2 text-sm font-semibold text-white backdrop-blur-md transition-colors hover:bg-white/[0.15]">
                      <FileSpreadsheet className="h-4 w-4" /> Bulk upload
                    </Link>
                  </div>
                )}
              </div>
            </div>
            <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
              <HeaderStat icon={Store} label="All vendors" value={c?.total} tone="bg-gradient-to-br from-orange-400 to-rose-500"
                onClick={() => setFilter('status', '')} active={!filters.status && !filters.kycStatus} />
              <HeaderStat icon={BadgeCheck} label="Active" value={c?.ACTIVE} tone="bg-gradient-to-br from-emerald-400 to-teal-600"
                onClick={() => setFilter('status', 'ACTIVE')} active={filters.status === 'ACTIVE'} />
              <HeaderStat icon={Clock} label="Waiting for approval" value={c?.PENDING} tone="bg-gradient-to-br from-amber-400 to-orange-600"
                onClick={() => setFilter('status', 'PENDING')} active={filters.status === 'PENDING'} />
              <HeaderStat icon={ShieldQuestion} label="KYC to review" value={c?.kycPending} tone="bg-gradient-to-br from-sky-400 to-indigo-600"
                onClick={() => setFilter('kycStatus', filters.kycStatus === 'PENDING' ? '' : 'PENDING')} active={filters.kycStatus === 'PENDING'} />
            </div>
          </div>
        </motion.section>

        {/* ── Toolbar ────────────────────────────────────────────────── */}
        <div className="flex flex-col gap-3 rounded-2xl border border-border bg-card p-3 shadow-sm lg:flex-row lg:items-center">
          <div role="tablist" aria-label="Vendor status" className="flex gap-1 overflow-x-auto rounded-xl bg-muted/60 p-1">
            {STATUS_TABS.map((t) => {
              const on = filters.status === t.value
              const count = c?.[t.countKey]
              return (
                <button key={t.label} type="button" role="tab" aria-selected={on} onClick={() => setFilter('status', t.value)}
                  className={cn('relative flex items-center gap-1.5 whitespace-nowrap rounded-lg px-3 py-1.5 text-xs font-medium transition-colors',
                    on ? 'text-foreground' : 'text-muted-foreground hover:text-foreground')}>
                  {on && <motion.span layoutId="vendor-status-tab" className="absolute inset-0 rounded-lg bg-card shadow-sm" transition={{ type: 'spring', stiffness: 500, damping: 35 }} />}
                  <span className="relative flex items-center gap-1.5">
                    {t.dot && <span className={cn('h-1.5 w-1.5 rounded-full', t.dot)} />}
                    {t.label}
                    {count != null && <span className="rounded-full bg-muted px-1.5 text-[10px] tabular-nums text-muted-foreground">{count}</span>}
                  </span>
                </button>
              )
            })}
          </div>

          <div className="relative min-w-0 flex-1">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" aria-hidden />
            <input value={searchInput} onChange={(e) => setSearchInput(e.target.value)} placeholder="Search by name, mobile or email…"
              aria-label="Search vendors"
              className="h-9 w-full rounded-lg border border-border bg-background pl-9 pr-8 text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring" />
            {searchInput && (
              <button type="button" onClick={() => setSearchInput('')} aria-label="Clear search"
                className="absolute right-2 top-1/2 flex h-6 w-6 -translate-y-1/2 items-center justify-center rounded text-muted-foreground hover:bg-muted">
                <X className="h-3.5 w-3.5" />
              </button>
            )}
          </div>

          <div className="flex items-center gap-2">
            <select aria-label="KYC" value={filters.kycStatus} onChange={(e) => setFilter('kycStatus', e.target.value)}
              className="h-9 rounded-lg border border-border bg-background px-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-ring">
              <option value="">Any KYC</option>
              <option value="PENDING">KYC to review</option>
              <option value="VERIFIED">KYC verified</option>
              <option value="REJECTED">KYC rejected</option>
            </select>
            <div className="flex rounded-lg border border-border p-0.5" role="radiogroup" aria-label="View">
              {([['grid', LayoutGrid, 'Cards'], ['table', List, 'Table']] as const).map(([v, Icon, label]) => (
                <button key={v} type="button" role="radio" aria-checked={view === v} aria-label={label} title={label} onClick={() => switchView(v)}
                  className={cn('flex h-7 w-8 items-center justify-center rounded-md transition-colors',
                    view === v ? 'bg-primary text-primary-foreground shadow-sm' : 'text-muted-foreground hover:text-foreground')}>
                  <Icon className="h-4 w-4" />
                </button>
              ))}
            </div>
            <button type="button" onClick={() => { void refetch(); void counts.refetch() }} aria-label="Refresh"
              className="flex h-9 w-9 items-center justify-center rounded-lg border border-border text-muted-foreground hover:bg-muted hover:text-foreground">
              <RefreshCw className={cn('h-4 w-4', isFetching && 'animate-spin')} />
            </button>
          </div>
        </div>

        {/* ── Results ────────────────────────────────────────────────── */}
        {isError && !isLoading ? (
          <ErrorState title="Couldn't load vendors" description="Check the connection and try again." onRetry={() => void refetch()} />
        ) : isLoading ? (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4">
            {Array.from({ length: 8 }).map((_, i) => <div key={i} className="h-60 animate-pulse rounded-2xl bg-muted" />)}
          </div>
        ) : vendors.length === 0 ? (
          <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-border py-20 text-center">
            <Store className="mb-3 h-10 w-10 text-muted-foreground/40" />
            <p className="text-sm font-medium text-foreground">No vendors match</p>
            {filtered && <button type="button" onClick={clearAll} className="mt-3 text-sm font-medium text-primary hover:underline">Clear filters</button>}
          </div>
        ) : view === 'grid' ? (
          <div className={cn('grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4 transition-opacity', isFetching && 'opacity-70')}>
            {vendors.map((v, i) => (
              <VendorCard key={v.vendorId} vendor={v} index={i} sales={sales.data?.[String(v.vendorId)]} onOpen={openVendor} />
            ))}
          </div>
        ) : (
          <VendorTable data={data} page={page} onPageChange={setPage} onRowClick={openVendor} isFetching={isFetching} />
        )}

        {view === 'grid' && totalPages > 1 && (
          <div className="flex items-center justify-between">
            <p className="text-xs text-muted-foreground">
              {page * PAGE_SIZE + 1}–{Math.min((page + 1) * PAGE_SIZE, data?.totalElements ?? 0)} of {data?.totalElements ?? 0}
            </p>
            <div className="flex items-center gap-1">
              <button type="button" onClick={() => setPage((p) => Math.max(0, p - 1))} disabled={page === 0} aria-label="Previous page"
                className="flex h-8 w-8 items-center justify-center rounded-lg border border-border text-muted-foreground hover:bg-muted disabled:opacity-40">
                <ChevronLeft className="h-4 w-4" />
              </button>
              <span className="px-2 text-xs tabular-nums text-muted-foreground">Page {page + 1} of {totalPages}</span>
              <button type="button" onClick={() => setPage((p) => Math.min(totalPages - 1, p + 1))} disabled={page >= totalPages - 1} aria-label="Next page"
                className="flex h-8 w-8 items-center justify-center rounded-lg border border-border text-muted-foreground hover:bg-muted disabled:opacity-40">
                <ChevronRight className="h-4 w-4" />
              </button>
            </div>
          </div>
        )}
        <AddVendorDialog open={adding} onOpenChange={setAdding} />
      </div>
    </PermissionGuard>
  )
}

export default VendorsPage
