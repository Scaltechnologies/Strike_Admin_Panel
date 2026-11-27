import { useEffect, useMemo, useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { CheckCheck, ChevronLeft, ChevronRight, Loader2, PartyPopper, Search, ShieldOff, X } from 'lucide-react'
import { cn } from '@/lib/utils'
import { ErrorState } from '@/components/common/ErrorState'
import { useBulkApprove, useMenuChanges, type ChangeAction, type ChangeQuery, type ChangeStatus } from '../api/menu-admin.api'
import { useCategoryOptions } from '../hooks/useCategoryOptions'
import { ACTION_META, STATUS_META } from '../utils/menu-meta'
import { ChangeCard } from './ChangeCard'

const PAGE_SIZE = 20
const ACTIONS: { value: ChangeAction | ''; label: string }[] = [
  { value: '', label: 'All types' },
  { value: 'CREATE', label: ACTION_META.CREATE.label },
  { value: 'UPDATE', label: ACTION_META.UPDATE.label },
  { value: 'DELETE', label: ACTION_META.DELETE.label },
  { value: 'IMAGE', label: ACTION_META.IMAGE.label },
]

/**
 * The approval queue (status PENDING, oldest first) or the decided history. Used on the Menus
 * page and, filtered to one store, on that store's menu page.
 */
export function ApprovalsPanel({ status, storeId, approvalOff, compact }: {
  status: 'PENDING' | 'DECIDED'
  storeId?: number
  approvalOff?: boolean
  compact?: boolean
}) {
  const [search, setSearch] = useState('')
  const [q, setQ] = useState('')
  const [action, setAction] = useState<ChangeAction | ''>('')
  const [historyStatus, setHistoryStatus] = useState<ChangeStatus | 'DECIDED'>('DECIDED')
  const [page, setPage] = useState(0)
  const [selected, setSelected] = useState<Set<number>>(new Set())
  useEffect(() => {
    const t = setTimeout(() => { setQ(search.trim()); setPage(0) }, 350)
    return () => clearTimeout(t)
  }, [search])

  const pendingView = status === 'PENDING'
  const query: ChangeQuery = { status: status === 'DECIDED' ? historyStatus : status, storeId, action, q }
  const changes = useMenuChanges(query, page, PAGE_SIZE)
  const bulk = useBulkApprove()
  const list = useMemo(() => changes.data?.content ?? [], [changes.data])
  const { options, names } = useCategoryOptions(changes.data?.categoryNames)
  const totalPages = changes.data?.totalPages ?? 0

  const toggle = (id: number, on: boolean) => setSelected((s) => { const n = new Set(s); if (on) n.add(id); else n.delete(id); return n })
  const allSelected = list.length > 0 && list.every((c) => selected.has(c.id))
  const approveSelected = () => bulk.mutate([...selected], { onSuccess: () => setSelected(new Set()) })

  return (
    <div className="flex flex-col gap-4">
      {!compact && (
        <div className="flex flex-col gap-3 rounded-2xl border border-border bg-card p-3 shadow-sm lg:flex-row lg:items-center">
          <div className="relative min-w-0 flex-1">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search item, store or who asked…" aria-label="Search changes"
              className="h-9 w-full rounded-lg border border-border bg-background pl-9 pr-8 text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring" />
            {search && (
              <button type="button" onClick={() => setSearch('')} aria-label="Clear search" className="absolute right-2 top-1/2 flex h-6 w-6 -translate-y-1/2 items-center justify-center rounded text-muted-foreground hover:bg-muted">
                <X className="h-3.5 w-3.5" />
              </button>
            )}
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <div role="tablist" aria-label="Change type" className="flex gap-1 overflow-x-auto rounded-xl bg-muted/60 p-1">
              {ACTIONS.map((a) => {
                const on = action === a.value
                return (
                  <button key={a.value || 'all'} type="button" role="tab" aria-selected={on} onClick={() => { setAction(a.value); setPage(0) }}
                    className={cn('relative whitespace-nowrap rounded-lg px-3 py-1.5 text-xs font-medium transition-colors', on ? 'text-foreground' : 'text-muted-foreground hover:text-foreground')}>
                    {on && <motion.span layoutId={`chg-type-${status}`} className="absolute inset-0 rounded-lg bg-card shadow-sm" transition={{ type: 'spring', stiffness: 500, damping: 35 }} />}
                    <span className="relative">{a.label}</span>
                  </button>
                )
              })}
            </div>
            {status === 'DECIDED' && (
              <select aria-label="Decision" value={historyStatus} onChange={(e) => { setHistoryStatus(e.target.value as ChangeStatus | 'DECIDED'); setPage(0) }}
                className="h-9 rounded-lg border border-border bg-background px-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-ring">
                <option value="DECIDED">Every decision</option>
                <option value="APPROVED">{STATUS_META.APPROVED.label}</option>
                <option value="REJECTED">{STATUS_META.REJECTED.label}</option>
                <option value="WITHDRAWN">{STATUS_META.WITHDRAWN.label}</option>
              </select>
            )}
          </div>
        </div>
      )}

      {pendingView && list.length > 1 && (
        <div className="flex flex-wrap items-center gap-3 px-1">
          <label className="flex cursor-pointer items-center gap-2 text-xs font-medium text-muted-foreground">
            <input type="checkbox" checked={allSelected} onChange={(e) => setSelected(e.target.checked ? new Set(list.map((c) => c.id)) : new Set())}
              className="h-4 w-4 rounded accent-[#e01a00]" />
            Select all on this page
          </label>
          <AnimatePresence>
            {selected.size > 0 && (
              <motion.button type="button" initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.9 }}
                disabled={bulk.isPending} onClick={approveSelected}
                className="btn-shine flex h-8 items-center gap-1.5 rounded-lg bg-gradient-to-r from-emerald-500 to-teal-600 px-3 text-xs font-semibold text-white shadow-md shadow-emerald-500/25 disabled:opacity-60">
                {bulk.isPending ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <CheckCheck className="h-3.5 w-3.5" />}
                Approve {selected.size} selected
              </motion.button>
            )}
          </AnimatePresence>
        </div>
      )}

      {changes.isError ? (
        <ErrorState title="Couldn't load menu changes" description="Check the connection and try again." onRetry={() => void changes.refetch()} />
      ) : changes.isLoading ? (
        <div className="flex flex-col gap-3">{Array.from({ length: 3 }).map((_, i) => <div key={i} className="h-44 animate-pulse rounded-2xl bg-muted" />)}</div>
      ) : list.length === 0 ? (
        <EmptyQueue pending={pendingView} filtered={!!q || !!action} approvalOff={approvalOff} compact={compact} />
      ) : (
        <motion.div layout className={cn('grid grid-cols-1 gap-4', !compact && '2xl:grid-cols-2', changes.isFetching && 'opacity-80')}>
          <AnimatePresence mode="popLayout">
            {list.map((c) => (
              <ChangeCard key={c.id} change={c} categoryNames={names} categoryOptions={options} showStore={!storeId}
                selected={selected.has(c.id)} onSelect={pendingView ? toggle : undefined} />
            ))}
          </AnimatePresence>
        </motion.div>
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

function EmptyQueue({ pending, filtered, approvalOff, compact }: { pending: boolean; filtered: boolean; approvalOff?: boolean; compact?: boolean }) {
  if (compact) return <p className="rounded-xl border border-dashed border-border py-6 text-center text-sm text-muted-foreground">Nothing waiting for approval</p>
  return (
    <motion.div initial={{ opacity: 0, scale: 0.97 }} animate={{ opacity: 1, scale: 1 }}
      className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-border bg-card py-16 text-center">
      {pending && !filtered ? (
        <>
          <motion.span initial={{ rotate: -20, scale: 0.5 }} animate={{ rotate: 0, scale: 1 }} transition={{ type: 'spring', stiffness: 260, damping: 12 }}
            className="flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-emerald-400 to-teal-600 text-white shadow-lg shadow-emerald-500/30">
            {approvalOff ? <ShieldOff className="h-8 w-8" /> : <PartyPopper className="h-8 w-8" />}
          </motion.span>
          <p className="mt-4 text-base font-semibold text-foreground">{approvalOff ? 'Approval is turned off' : 'All caught up!'}</p>
          <p className="mt-1 max-w-sm text-sm text-muted-foreground">
            {approvalOff ? 'Stores change their menus directly right now. Turn approval on in the Settings tab.' : 'No menu changes are waiting. New requests from stores will appear here.'}
          </p>
        </>
      ) : (
        <p className="text-sm text-muted-foreground">{filtered ? 'Nothing matches these filters.' : 'No decisions yet.'}</p>
      )}
    </motion.div>
  )
}
