import { useState, useCallback, useMemo } from 'react'
import { Receipt, Clock, IndianRupee, Radio } from 'lucide-react'
import { cn } from '@/lib/utils'
import { useRedemptionList, useRedemptionStats, useStoreLookup, useUserLookup } from './hooks/useRedemptions'
import { RedemptionTable } from './components/RedemptionTable'
import { RedemptionDrawer } from './components/RedemptionDrawer'
import type { RedemptionRecord } from './types/redemption.types'

const PAGE_SIZE = 20

const STATUS_TABS = [
  { value: '', label: 'All' },
  { value: 'PENDING', label: 'Pending' },
  { value: 'COMPLETED', label: 'Completed' },
  { value: 'REJECTED', label: 'Rejected' },
  { value: 'FAILED', label: 'Failed' },
  { value: 'REVERSED', label: 'Reversed' },
]

function StatCard({ label, value, icon: Icon, color, isLoading, prefix = '' }: {
  label: string; value: number | undefined; icon: React.ElementType; color: string; isLoading: boolean; prefix?: string
}) {
  return (
    <div className="flex items-center gap-3 rounded-xl border border-border bg-card p-4 shadow-sm">
      <div className={cn('flex h-10 w-10 shrink-0 items-center justify-center rounded-xl', color)}>
        <Icon className="h-5 w-5" aria-hidden />
      </div>
      <div>
        <p className="text-xs text-muted-foreground">{label}</p>
        {isLoading ? (
          <div className="mt-1 h-5 w-20 animate-pulse rounded bg-muted" />
        ) : (
          <p className="text-xl font-bold text-foreground">
            {value != null ? `${prefix}${Number(value).toLocaleString('en-IN', { maximumFractionDigits: 0 })}` : '—'}
          </p>
        )}
      </div>
    </div>
  )
}

export function RedemptionsPage() {
  const [page, setPage] = useState(0)
  const [statusFilter, setStatusFilter] = useState('')
  const [live, setLive] = useState(true)
  const [selected, setSelected] = useState<RedemptionRecord | null>(null)

  const { data, isLoading, refetch } = useRedemptionList(page, PAGE_SIZE, statusFilter || undefined, undefined, live)
  const { data: stats, isLoading: statsLoading } = useRedemptionStats()

  const rows = useMemo(() => data?.data?.content ?? [], [data])
  const { map: storeMap, loading: storeLoading } = useStoreLookup(rows.map((r) => r.storeId))
  const userMap = useUserLookup(rows.map((r) => r.userId))
  const pendingNow = useMemo(() => rows.filter((r) => r.status === 'PENDING').length, [rows])

  const handleCloseDrawer = useCallback(() => setSelected(null), [])
  const handleStatusChange = useCallback((value: string) => { setStatusFilter(value); setPage(0) }, [])

  return (
    <div className="flex h-full flex-col gap-6 p-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-xl font-semibold text-foreground">Redemptions</h1>
          <p className="mt-0.5 text-sm text-muted-foreground">
            Live feed of card redemptions across every store
          </p>
        </div>
        <button
          onClick={() => setLive((v) => !v)}
          className={cn(
            'flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs font-medium transition-colors',
            live
              ? 'border-green-600/20 bg-green-50 text-green-700 dark:border-green-400/30 dark:bg-green-400/10 dark:text-green-400'
              : 'border-border bg-muted text-muted-foreground hover:bg-muted/70',
          )}
          title={live ? 'Pause live updates' : 'Resume live updates'}
        >
          <span className="relative flex h-2 w-2">
            {live && <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-green-500 opacity-75" />}
            <span className={cn('relative inline-flex h-2 w-2 rounded-full', live ? 'bg-green-500' : 'bg-muted-foreground')} />
          </span>
          {live ? 'Live' : 'Paused'}
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
        <StatCard label="Total Redemptions" value={stats?.totalRedemptions} icon={Receipt} color="bg-blue-100 text-blue-600 dark:bg-blue-400/10 dark:text-blue-400" isLoading={statsLoading} />
        <StatCard label="Total Amount Redeemed" value={stats?.totalAmount} icon={IndianRupee} color="bg-violet-100 text-violet-600 dark:bg-violet-400/10 dark:text-violet-400" isLoading={statsLoading} prefix="₹" />
        <StatCard label="Pending Right Now" value={pendingNow} icon={Clock} color="bg-amber-100 text-amber-600 dark:bg-amber-400/10 dark:text-amber-400" isLoading={isLoading && rows.length === 0} />
      </div>

      {/* Status filter tabs */}
      <div className="flex items-center justify-between gap-3">
        <div className="flex overflow-x-auto rounded-xl border border-border bg-card p-1 gap-1 w-fit">
          {STATUS_TABS.map((tab) => (
            <button
              key={tab.value}
              onClick={() => handleStatusChange(tab.value)}
              className={cn(
                'rounded-lg px-4 py-1.5 text-sm font-medium transition-colors whitespace-nowrap',
                statusFilter === tab.value
                  ? 'bg-primary text-primary-foreground shadow-sm'
                  : 'text-muted-foreground hover:bg-muted hover:text-foreground',
              )}
            >
              {tab.label}
            </button>
          ))}
        </div>
        {live && (
          <span className="hidden items-center gap-1.5 text-xs text-muted-foreground sm:flex">
            <Radio className="h-3.5 w-3.5 animate-pulse text-green-500" />
            Refreshing every 6s
          </span>
        )}
      </div>

      <div className="overflow-hidden rounded-xl border border-border bg-card shadow-sm">
        <RedemptionTable
          data={rows}
          isLoading={isLoading}
          page={page}
          totalPages={data?.data?.totalPages ?? 0}
          totalElements={data?.data?.totalElements ?? 0}
          pageSize={PAGE_SIZE}
          onPageChange={setPage}
          onRefresh={() => void refetch()}
          onView={setSelected}
          storeMap={storeMap}
          storeLoading={storeLoading}
          userMap={userMap}
        />
      </div>

      <RedemptionDrawer
        redemption={selected}
        store={selected ? storeMap.get(selected.storeId) : undefined}
        storeLoading={selected ? storeLoading.has(selected.storeId) : false}
        userMap={userMap}
        onClose={handleCloseDrawer}
      />
    </div>
  )
}
