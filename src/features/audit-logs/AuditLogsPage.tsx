import { useCallback, useEffect, useState } from 'react'
import { ChevronLeft, ChevronRight, Download, FileSearch, RefreshCw, ShieldCheck } from 'lucide-react'
import { cn } from '@/lib/utils'
import { ErrorState } from '@/components/common/ErrorState'
import { useAuditFacets, useAuditLogList, useAuditStats, useExportAuditLogs } from './hooks/useAuditLogs'
import { AuditOverview } from './components/AuditOverview'
import { AuditFiltersBar } from './components/AuditFiltersBar'
import { AuditTimeline } from './components/AuditTimeline'
import { AuditDetailDrawer } from './components/AuditDetailDrawer'
import type { AuditFilters, AuditLogResponse } from './types/audit-log.types'

const PAGE_SIZE = 25
const DEFAULT_FILTERS: AuditFilters = { range: '7d' }
const nf = new Intl.NumberFormat()

export function AuditLogsPage() {
  const [filters, setFilters] = useState<AuditFilters>(DEFAULT_FILTERS)
  const [search, setSearch] = useState('')
  const [page, setPage] = useState(0)
  const [live, setLive] = useState(false)
  const [selected, setSelected] = useState<AuditLogResponse | null>(null)

  // Search as you type, without a request per keystroke.
  useEffect(() => {
    const t = setTimeout(() => {
      setFilters((f) => (f.q === (search || undefined) ? f : { ...f, q: search || undefined }))
      setPage(0)
    }, 350)
    return () => clearTimeout(t)
  }, [search])

  const updateFilters = useCallback((patch: Partial<AuditFilters>) => {
    setFilters((f) => ({ ...f, ...patch }))
    setPage(0)
  }, [])

  const resetFilters = useCallback(() => {
    setFilters(DEFAULT_FILTERS)
    setSearch('')
    setPage(0)
  }, [])

  const list = useAuditLogList(filters, page, PAGE_SIZE, live)
  const stats = useAuditStats(filters.range, live)
  const facets = useAuditFacets()
  const exporter = useExportAuditLogs()

  const logs = list.data?.content ?? []
  const total = list.data?.totalElements ?? 0
  const totalPages = list.data?.totalPages ?? 0
  const from = total === 0 ? 0 : page * PAGE_SIZE + 1
  const to = Math.min((page + 1) * PAGE_SIZE, total)

  const filterActor = (email: string) => {
    setSelected(null)
    updateFilters({ actorEmail: email, actorType: undefined })
  }
  const filterEntity = (entityType: string, entityId: number | null) => {
    setSelected(null)
    updateFilters({ entityType, entityId: entityId ?? undefined })
  }

  return (
    <div className="flex h-full flex-col gap-5 p-6">
      {/* Header */}
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="flex items-start gap-3">
          <span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-gradient-to-br from-[#ffc400] via-[#ff6a00] to-[#e01a00] shadow-lg shadow-orange-500/25">
            <ShieldCheck className="h-5 w-5 text-white" aria-hidden />
          </span>
          <div>
            <h1 className="text-xl font-semibold text-foreground">Audit Logs</h1>
            <p className="mt-0.5 text-sm text-muted-foreground">
              Everything admins, store owners and store managers did, with who, when, where and what changed
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button type="button" onClick={() => setLive((v) => !v)} aria-pressed={live}
            className={cn(
              'flex h-9 items-center gap-2 rounded-lg border px-3 text-sm font-medium transition-colors',
              live ? 'border-emerald-300 bg-emerald-50 text-emerald-700 dark:border-emerald-400/30 dark:bg-emerald-400/10 dark:text-emerald-300'
                : 'border-border text-muted-foreground hover:bg-muted hover:text-foreground',
            )}>
            <span className="relative flex h-2 w-2">
              {live && <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75" />}
              <span className={cn('relative inline-flex h-2 w-2 rounded-full', live ? 'bg-emerald-500' : 'bg-muted-foreground/50')} />
            </span>
            {live ? 'Live' : 'Go live'}
          </button>
          <button type="button" onClick={() => { void list.refetch(); void stats.refetch() }} aria-label="Refresh"
            className="flex h-9 w-9 items-center justify-center rounded-lg border border-border text-muted-foreground hover:bg-muted hover:text-foreground">
            <RefreshCw className={cn('h-4 w-4', (list.isFetching || stats.isFetching) && 'animate-spin')} />
          </button>
          <button type="button" onClick={() => exporter.mutate(filters)} disabled={exporter.isPending || total === 0}
            className="flex h-9 items-center gap-2 rounded-lg bg-primary px-3.5 text-sm font-semibold text-primary-foreground shadow-sm hover:bg-primary/90 disabled:opacity-60">
            <Download className="h-4 w-4" />
            {exporter.isPending ? 'Preparing…' : 'Export CSV'}
          </button>
        </div>
      </div>

      <AuditOverview
        stats={stats.data}
        loading={stats.isLoading}
        activeActorType={filters.actorType}
        onActorType={(actorType) => updateFilters({ actorType })}
        onFailedOnly={() => updateFilters({ outcome: 'FAILED' })}
        onAction={(action) => updateFilters({ action })}
        onActor={(email) => updateFilters({ actorEmail: email, actorType: undefined })}
      />

      <AuditFiltersBar
        filters={filters}
        search={search}
        onSearch={setSearch}
        onChange={updateFilters}
        onReset={resetFilters}
        facets={facets.data}
      />

      <div className="overflow-hidden rounded-2xl border border-border bg-card shadow-sm">
        <div className="flex items-center justify-between border-b border-border px-5 py-3">
          <p className="text-sm font-medium text-foreground">
            {list.isLoading ? 'Loading activity…' : `${nf.format(total)} ${total === 1 ? 'entry' : 'entries'}`}
          </p>
          {list.isFetching && !list.isLoading && <span className="text-xs text-muted-foreground">Updating…</span>}
        </div>

        {list.isError ? (
          <ErrorState onRetry={() => void list.refetch()} />
        ) : !list.isLoading && logs.length === 0 ? (
          <div className="flex flex-col items-center justify-center px-6 py-16 text-center">
            <span className="mb-3 flex h-12 w-12 items-center justify-center rounded-2xl bg-muted">
              <FileSearch className="h-6 w-6 text-muted-foreground" aria-hidden />
            </span>
            <p className="text-sm font-medium text-foreground">No matching activity</p>
            <p className="mt-1 text-sm text-muted-foreground">Try a longer period or fewer filters.</p>
            <button type="button" onClick={resetFilters} className="mt-4 text-sm font-medium text-primary hover:underline">
              Reset filters
            </button>
          </div>
        ) : (
          <AuditTimeline logs={logs} loading={list.isLoading} selectedId={selected?.id} onSelect={setSelected} />
        )}

        {totalPages > 1 && (
          <div className="flex items-center justify-between border-t border-border px-5 py-3">
            <p className="text-xs text-muted-foreground">
              {nf.format(from)}–{nf.format(to)} of {nf.format(total)}
            </p>
            <div className="flex items-center gap-1">
              <button type="button" onClick={() => setPage((p) => Math.max(0, p - 1))} disabled={page === 0}
                aria-label="Previous page"
                className="flex h-8 w-8 items-center justify-center rounded-lg border border-border text-muted-foreground hover:bg-muted disabled:opacity-40">
                <ChevronLeft className="h-4 w-4" />
              </button>
              <span className="px-2 text-xs tabular-nums text-muted-foreground">Page {page + 1} of {nf.format(totalPages)}</span>
              <button type="button" onClick={() => setPage((p) => Math.min(totalPages - 1, p + 1))} disabled={page >= totalPages - 1}
                aria-label="Next page"
                className="flex h-8 w-8 items-center justify-center rounded-lg border border-border text-muted-foreground hover:bg-muted disabled:opacity-40">
                <ChevronRight className="h-4 w-4" />
              </button>
            </div>
          </div>
        )}
      </div>

      <AuditDetailDrawer
        log={selected}
        onClose={() => setSelected(null)}
        onFilterActor={filterActor}
        onFilterEntity={filterEntity}
      />
    </div>
  )
}
