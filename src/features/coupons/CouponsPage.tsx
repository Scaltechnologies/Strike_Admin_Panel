import { useState, useCallback } from 'react'
import { Tag, CheckCircle2, XCircle, BarChart2, Plus, Clock } from 'lucide-react'
import { cn } from '@/lib/utils'
import { useCouponList, useCouponStats, usePendingCoupons } from './hooks/useCoupons'
import { CouponTable } from './components/CouponTable'
import { PendingCouponsTable } from './components/PendingCouponsTable'
import { CouponDrawer } from './components/CouponDrawer'
import { CouponForm } from './components/CouponForm'
import type { CouponResponse } from './types/coupon.types'

const PAGE_SIZE = 20

type Tab = 'all' | 'pending'

interface StatCardProps {
  label: string
  value: number | undefined
  icon: React.ElementType
  color: string
  isLoading: boolean
}

function StatCard({ label, value, icon: Icon, color, isLoading }: StatCardProps) {
  return (
    <div className="flex items-center gap-3 rounded-xl border border-border bg-card p-4 shadow-sm">
      <div className={cn('flex h-10 w-10 shrink-0 items-center justify-center rounded-xl', color)}>
        <Icon className="h-5 w-5" aria-hidden />
      </div>
      <div>
        <p className="text-xs text-muted-foreground">{label}</p>
        {isLoading ? (
          <div className="mt-1 h-5 w-12 animate-pulse rounded bg-muted" />
        ) : (
          <p className="text-xl font-bold text-foreground">{value?.toLocaleString() ?? '—'}</p>
        )}
      </div>
    </div>
  )
}

export function CouponsPage() {
  const [tab, setTab] = useState<Tab>('all')
  const [page, setPage] = useState(0)
  const [pendingPage, setPendingPage] = useState(0)
  const [selected, setSelected] = useState<CouponResponse | null>(null)
  const [showCreate, setShowCreate] = useState(false)

  const { data, isLoading, refetch } = useCouponList(page, PAGE_SIZE)
  const { data: stats, isLoading: statsLoading } = useCouponStats()
  const {
    data: pendingData,
    isLoading: pendingLoading,
    refetch: refetchPending,
  } = usePendingCoupons(pendingPage, PAGE_SIZE)
  // Cheap always-on query just to badge the tab with a live pending count.
  const { data: pendingCountData } = usePendingCoupons(0, 1)

  const handleCloseDrawer = useCallback(() => setSelected(null), [])

  const rows = data?.content ?? []
  const totalPages = data?.totalPages ?? 0
  const totalElements = data?.totalElements ?? 0

  const pendingRows = pendingData?.content ?? []
  const pendingTotalPages = pendingData?.totalPages ?? 0
  const pendingTotalElements = pendingData?.totalElements ?? 0
  const pendingCount = pendingCountData?.totalElements ?? 0

  return (
    <div className="flex h-full flex-col gap-6 p-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold text-foreground">Coupons</h1>
          <p className="mt-0.5 text-sm text-muted-foreground">
            Manage discount coupons and promotions
          </p>
        </div>
        <button
          onClick={() => setShowCreate(true)}
          className="flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
        >
          <Plus className="h-4 w-4" aria-hidden />
          New Coupon
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <StatCard
          label="Total"
          value={stats?.totalCoupons}
          icon={Tag}
          color="bg-blue-100 text-blue-600 dark:bg-blue-400/10 dark:text-blue-400"
          isLoading={statsLoading}
        />
        <StatCard
          label="Active"
          value={stats?.activeCoupons}
          icon={CheckCircle2}
          color="bg-green-100 text-green-600 dark:bg-green-400/10 dark:text-green-400"
          isLoading={statsLoading}
        />
        <StatCard
          label="Inactive"
          value={stats ? stats.totalCoupons - stats.activeCoupons : undefined}
          icon={XCircle}
          color="bg-gray-100 text-gray-500 dark:bg-gray-400/10 dark:text-gray-400"
          isLoading={statsLoading}
        />
        <StatCard
          label="Total Used"
          value={stats?.totalUsages}
          icon={BarChart2}
          color="bg-violet-100 text-violet-600 dark:bg-violet-400/10 dark:text-violet-400"
          isLoading={statsLoading}
        />
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-1 border-b border-border">
        <button
          onClick={() => setTab('all')}
          className={cn(
            'flex items-center gap-2 border-b-2 px-3 py-2 text-sm font-medium transition-colors',
            tab === 'all'
              ? 'border-primary text-foreground'
              : 'border-transparent text-muted-foreground hover:text-foreground',
          )}
        >
          <Tag className="h-3.5 w-3.5" />
          All Coupons
        </button>
        <button
          onClick={() => setTab('pending')}
          className={cn(
            'flex items-center gap-2 border-b-2 px-3 py-2 text-sm font-medium transition-colors',
            tab === 'pending'
              ? 'border-primary text-foreground'
              : 'border-transparent text-muted-foreground hover:text-foreground',
          )}
        >
          <Clock className="h-3.5 w-3.5" />
          Pending Requests
          {pendingCount > 0 && (
            <span className="flex h-5 min-w-5 items-center justify-center rounded-full bg-amber-100 px-1.5 text-xs font-semibold text-amber-700 dark:bg-amber-400/10 dark:text-amber-400">
              {pendingCount}
            </span>
          )}
        </button>
      </div>

      {/* Table */}
      <div className="overflow-hidden rounded-xl border border-border bg-card shadow-sm">
        {tab === 'all' ? (
          <CouponTable
            data={rows}
            isLoading={isLoading}
            page={page}
            totalPages={totalPages}
            totalElements={totalElements}
            pageSize={PAGE_SIZE}
            onPageChange={setPage}
            onRefresh={() => void refetch()}
            onView={setSelected}
          />
        ) : (
          <PendingCouponsTable
            data={pendingRows}
            isLoading={pendingLoading}
            page={pendingPage}
            totalPages={pendingTotalPages}
            totalElements={pendingTotalElements}
            pageSize={PAGE_SIZE}
            onPageChange={setPendingPage}
            onRefresh={() => void refetchPending()}
          />
        )}
      </div>

      {/* Drawer */}
      <CouponDrawer coupon={selected} onClose={handleCloseDrawer} />

      {/* Create form */}
      {showCreate && <CouponForm onClose={() => setShowCreate(false)} />}
    </div>
  )
}
