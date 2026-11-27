import { useCallback, useEffect, useState } from 'react'
import { useNavigate } from '@tanstack/react-router'
import { motion } from 'framer-motion'
import {
  ChevronLeft, ChevronRight, CreditCard, IndianRupee, LayoutGrid, List, RefreshCw, Search, ShoppingBag, Sparkles, Users, X,
  type LucideIcon,
} from 'lucide-react'
import { ErrorState } from '@/components/common/ErrorState'
import { PermissionGuard } from '@/core/guards/PermissionGuard'
import { PERMISSIONS } from '@/constants/permissions'
import { cn } from '@/lib/utils'
import { formatDate, formatRelative } from '@/utils/helpers/date'
import { formatInrShort } from '@/features/vendors/utils/vendor-meta'
import { useUserCounts, useUserDirectory, type DirectoryQuery, type DirectoryUser, type UserSegment } from './api/user-insights.api'
import { UserCard } from './components/UserCard'
import { UserAvatar } from './components/UserAvatar'
import { displayName, spendTier, userStatus } from './utils/user-meta'

const PAGE_SIZE = 24
const VIEW_KEY = 'strike:users:view'
const DEFAULT_QUERY: DirectoryQuery = { q: '', status: 'all', segment: 'all', sort: 'newest' }

const SEGMENTS: { value: UserSegment; label: string; countKey?: 'total' | 'buyers' | 'cardHolders' | 'newThisWeek' }[] = [
  { value: 'all', label: 'All customers', countKey: 'total' },
  { value: 'buyers', label: 'Buyers', countKey: 'buyers' },
  { value: 'card_holders', label: 'Card holders', countKey: 'cardHolders' },
  { value: 'new', label: 'New this week', countKey: 'newThisWeek' },
  { value: 'no_purchases', label: 'No purchases yet' },
]

function HeaderStat({ icon: Icon, label, value, tone, onClick, active }: {
  icon: LucideIcon; label: string; value: string | number | undefined; tone: string; onClick?: () => void; active?: boolean
}) {
  const Comp = onClick ? 'button' : 'div'
  return (
    <Comp type={onClick ? 'button' : undefined} onClick={onClick}
      className={cn('flex items-center gap-3 rounded-2xl border border-white/10 bg-white/[0.06] px-4 py-3 text-left backdrop-blur-md transition-all',
        onClick && 'hover:-translate-y-0.5 hover:bg-white/[0.12]', active && 'ring-2 ring-white/50')}>
      <span className={cn('flex h-9 w-9 items-center justify-center rounded-xl text-white shadow-lg', tone)}><Icon className="h-4 w-4" /></span>
      <span>
        <span className="block text-xl font-bold leading-none text-white tabular-nums">{value ?? '—'}</span>
        <span className="mt-1 block text-[11px] text-white/60">{label}</span>
      </span>
    </Comp>
  )
}

function UserRow({ user, onOpen, index }: { user: DirectoryUser; onOpen: (u: DirectoryUser) => void; index: number }) {
  const status = userStatus(user)
  const tier = spendTier(Number(user.spent))
  const name = displayName(user)
  return (
    <motion.tr initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: Math.min(index, 15) * 0.02 }}
      onClick={() => onOpen(user)} className="cursor-pointer border-b border-border transition-colors last:border-0 hover:bg-muted/50">
      <td className="px-4 py-3">
        <div className="flex items-center gap-3">
          <UserAvatar id={user.id} name={name} photo={user.profilePicUrl} dot={status.dot} className="h-9 w-9 rounded-full text-xs" />
          <div className="min-w-0">
            <p className="flex items-center gap-1.5 truncate text-sm font-medium text-foreground">
              {name}{tier && <span className={cn('rounded-full px-1.5 py-px text-[9px] font-bold uppercase', tier.cls)}>{tier.label}</span>}
            </p>
            <p className="truncate text-xs text-muted-foreground">#{user.id} · {user.mobileNumber}</p>
          </div>
        </div>
      </td>
      <td className="px-4 py-3"><span className={cn('rounded-full px-2 py-0.5 text-[11px] font-semibold', status.chip)}>{status.label}</span></td>
      <td className="px-4 py-3 text-sm font-semibold tabular-nums text-foreground">{formatInrShort(user.spent)}<span className="ml-1 text-xs font-normal text-muted-foreground">· {user.purchases}</span></td>
      <td className="px-4 py-3 text-sm tabular-nums text-foreground">{user.activeCards}</td>
      <td className="px-4 py-3 text-sm tabular-nums text-foreground">{formatInrShort(user.walletBalance)}</td>
      <td className="px-4 py-3 text-xs text-muted-foreground">{user.lastPurchaseAt ? formatRelative(user.lastPurchaseAt) : '—'}</td>
      <td className="px-4 py-3 text-xs text-muted-foreground">{user.createdAt ? formatDate(user.createdAt) : '—'}</td>
    </motion.tr>
  )
}

export function UsersPage() {
  const navigate = useNavigate()
  const [query, setQuery] = useState<DirectoryQuery>(DEFAULT_QUERY)
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

  const directory = useUserDirectory(query, page, PAGE_SIZE)
  const counts = useUserCounts()
  const c = counts.data
  const users = directory.data?.content ?? []
  const totalPages = directory.data?.totalPages ?? 0
  const filtered = query.q || query.status !== 'all' || query.segment !== 'all'

  const update = (patch: Partial<DirectoryQuery>) => { setQuery((q) => ({ ...q, ...patch })); setPage(0) }
  const reset = () => { setSearch(''); setQuery(DEFAULT_QUERY); setPage(0) }
  const switchView = (v: 'grid' | 'table') => { setView(v); localStorage.setItem(VIEW_KEY, v) }
  const open = useCallback((u: DirectoryUser) => {
    void navigate({ to: '/users/$userId', params: { userId: String(u.id) }, search: { tab: undefined } })
  }, [navigate])

  return (
    <PermissionGuard permission={PERMISSIONS.USERS.VIEW}>
      <div className="flex flex-col gap-5 p-4 sm:p-6">
        <motion.section initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}
          className="relative overflow-hidden rounded-3xl bg-[#0b0c10] p-6 text-white shadow-xl shadow-black/10 sm:p-7">
          <div className="auth-aurora pointer-events-none absolute inset-0 opacity-70" aria-hidden><span /><span /><span /></div>
          <div className="auth-grid pointer-events-none absolute inset-0" aria-hidden />
          <div className="relative z-10 flex flex-col gap-6 xl:flex-row xl:items-end xl:justify-between">
            <div className="flex items-start gap-4">
              <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-pink-400 via-rose-500 to-[#e01a00] shadow-lg shadow-rose-600/40">
                <Users className="h-6 w-6" />
              </span>
              <div>
                <h1 className="text-2xl font-bold tracking-tight">Customers</h1>
                <p className="mt-1 max-w-lg text-sm text-white/60">Everyone using the Strike app. Open a customer to see their purchases, cards and everything they did.</p>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
              <HeaderStat icon={Users} label="Customers" value={c?.total} tone="bg-gradient-to-br from-pink-400 to-rose-600"
                onClick={() => update({ segment: 'all' })} active={query.segment === 'all' && query.status === 'all'} />
              <HeaderStat icon={ShoppingBag} label="Have bought cards" value={c?.buyers} tone="bg-gradient-to-br from-amber-400 to-orange-600"
                onClick={() => update({ segment: 'buyers' })} active={query.segment === 'buyers'} />
              <HeaderStat icon={CreditCard} label="Hold an active card" value={c?.cardHolders} tone="bg-gradient-to-br from-sky-400 to-indigo-600"
                onClick={() => update({ segment: 'card_holders' })} active={query.segment === 'card_holders'} />
              <HeaderStat icon={IndianRupee} label="Total spent" value={c ? formatInrShort(c.totalSpent) : undefined} tone="bg-gradient-to-br from-emerald-400 to-teal-600"
                onClick={() => update({ sort: 'top_spenders' })} active={query.sort === 'top_spenders'} />
            </div>
          </div>
        </motion.section>

        <div className="flex flex-col gap-3 rounded-2xl border border-border bg-card p-3 shadow-sm">
          <div className="flex flex-col gap-3 lg:flex-row lg:items-center">
            <div role="tablist" aria-label="Customer groups" className="flex gap-1 overflow-x-auto rounded-xl bg-muted/60 p-1">
              {SEGMENTS.map((s) => {
                const on = query.segment === s.value
                const count = s.countKey ? c?.[s.countKey] : undefined
                return (
                  <button key={s.value} type="button" role="tab" aria-selected={on} onClick={() => update({ segment: s.value })}
                    className={cn('relative whitespace-nowrap rounded-lg px-3 py-1.5 text-xs font-medium transition-colors', on ? 'text-foreground' : 'text-muted-foreground hover:text-foreground')}>
                    {on && <motion.span layoutId="user-seg" className="absolute inset-0 rounded-lg bg-card shadow-sm" transition={{ type: 'spring', stiffness: 500, damping: 35 }} />}
                    <span className="relative flex items-center gap-1.5">
                      {s.value === 'new' && <Sparkles className="h-3 w-3 text-amber-500" />}
                      {s.label}
                      {count != null && <span className="rounded-full bg-muted px-1.5 text-[10px] tabular-nums text-muted-foreground">{count}</span>}
                    </span>
                  </button>
                )
              })}
            </div>
            <div className="relative min-w-0 flex-1">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search by name, mobile, email or ID…" aria-label="Search customers"
                className="h-9 w-full rounded-lg border border-border bg-background pl-9 pr-8 text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring" />
              {search && (
                <button type="button" onClick={() => setSearch('')} aria-label="Clear search" className="absolute right-2 top-1/2 flex h-6 w-6 -translate-y-1/2 items-center justify-center rounded text-muted-foreground hover:bg-muted">
                  <X className="h-3.5 w-3.5" />
                </button>
              )}
            </div>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <select aria-label="Status" value={query.status} onChange={(e) => update({ status: e.target.value as DirectoryQuery['status'] })}
              className="h-9 rounded-lg border border-border bg-background px-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-ring">
              <option value="all">Any status</option>
              <option value="active">Active</option>
              <option value="banned">Banned</option>
              <option value="unverified">Not verified</option>
            </select>
            <select aria-label="Sort" value={query.sort} onChange={(e) => update({ sort: e.target.value as DirectoryQuery['sort'] })}
              className="h-9 rounded-lg border border-border bg-background px-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-ring">
              <option value="newest">Newest first</option>
              <option value="oldest">Oldest first</option>
              <option value="top_spenders">Top spenders</option>
              <option value="last_purchase">Recently bought</option>
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
              <button type="button" onClick={() => { void directory.refetch(); void counts.refetch() }} aria-label="Refresh"
                className="flex h-9 w-9 items-center justify-center rounded-lg border border-border text-muted-foreground hover:bg-muted hover:text-foreground">
                <RefreshCw className={cn('h-4 w-4', directory.isFetching && 'animate-spin')} />
              </button>
            </div>
          </div>
        </div>

        {directory.isError ? (
          <ErrorState title="Couldn't load customers" description="Check the connection and try again." onRetry={() => void directory.refetch()} />
        ) : directory.isLoading ? (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4">
            {Array.from({ length: 8 }).map((_, i) => <div key={i} className="h-60 animate-pulse rounded-2xl bg-muted" />)}
          </div>
        ) : users.length === 0 ? (
          <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-border py-20 text-center">
            <Users className="mb-3 h-10 w-10 text-muted-foreground/40" />
            <p className="text-sm font-medium text-foreground">No customers match</p>
            {filtered && <button type="button" onClick={reset} className="mt-3 text-sm font-medium text-primary hover:underline">Clear filters</button>}
          </div>
        ) : view === 'grid' ? (
          <div className={cn('grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4 transition-opacity', directory.isFetching && 'opacity-70')}>
            {users.map((u, i) => <UserCard key={u.id} user={u} index={i} onOpen={open} />)}
          </div>
        ) : (
          <div className="overflow-x-auto rounded-2xl border border-border bg-card shadow-sm">
            <table className="w-full min-w-[820px]">
              <thead>
                <tr className="border-b border-border bg-muted/40 text-left text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                  <th className="px-4 py-3">Customer</th><th className="px-4 py-3">Status</th><th className="px-4 py-3">Spent · buys</th>
                  <th className="px-4 py-3">Active cards</th><th className="px-4 py-3">Wallet</th><th className="px-4 py-3">Last bought</th><th className="px-4 py-3">Joined</th>
                </tr>
              </thead>
              <tbody>{users.map((u, i) => <UserRow key={u.id} user={u} index={i} onOpen={open} />)}</tbody>
            </table>
          </div>
        )}

        {totalPages > 1 && (
          <div className="flex items-center justify-between">
            <p className="text-xs text-muted-foreground">
              {page * PAGE_SIZE + 1}–{Math.min((page + 1) * PAGE_SIZE, directory.data?.totalElements ?? 0)} of {directory.data?.totalElements ?? 0}
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
    </PermissionGuard>
  )
}

export default UsersPage
