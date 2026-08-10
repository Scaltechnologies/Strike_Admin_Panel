import { useState, useCallback } from 'react'
import { Tag, CheckCircle2, XCircle, BarChart2, Plus } from 'lucide-react'
import { cn } from '@/lib/utils'
import { useCouponList, useCouponStats } from './hooks/useCoupons'
import { CouponTable } from './components/CouponTable'
import { CouponDrawer } from './components/CouponDrawer'
import { CouponForm } from './components/CouponForm'
import type { CouponResponse } from './types/coupon.types'

const PAGE_SIZE = 20

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
  const [page, setPage] = useState(0)
  const [selected, setSelected] = useState<CouponResponse | null>(null)
  const [showCreate, setShowCreate] = useState(false)

  const { data, isLoading, refetch } = useCouponList(page, PAGE_SIZE)
  const { data: stats, isLoading: statsLoading } = useCouponStats()

  const handleCloseDrawer = useCallback(() => setSelected(null), [])

  const rows = data?.content ?? []
  const totalPages = data?.totalPages ?? 0
  const totalElements = data?.totalElements ?? 0

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

      {/* Table */}
      <div className="overflow-hidden rounded-xl border border-border bg-card shadow-sm">
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
      </div>

      {/* Drawer */}
      <CouponDrawer coupon={selected} onClose={handleCloseDrawer} />

      {/* Create form */}
      {showCreate && <CouponForm onClose={() => setShowCreate(false)} />}
    </div>
  )
}
