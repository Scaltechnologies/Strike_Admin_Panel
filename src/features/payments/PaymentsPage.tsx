import { useState, useCallback } from 'react'
import { Banknote, CheckCircle2, XCircle, RotateCcw, IndianRupee } from 'lucide-react'
import { cn } from '@/lib/utils'
import { usePaymentList, usePaymentStats } from './hooks/usePayments'
import { useUserLookup } from '@/features/redemptions/hooks/useRedemptions'
import { useVendorLookup } from '@/features/withdrawals/hooks/useWithdrawals'
import { PaymentTable } from './components/PaymentTable'
import { PaymentDrawer } from './components/PaymentDrawer'
import type { PaymentResponse } from './types/payment.types'

const PAGE_SIZE = 20

const STATUS_TABS = [
  { value: '', label: 'All' },
  { value: 'PENDING', label: 'Pending' },
  { value: 'COMPLETED', label: 'Completed' },
  { value: 'FAILED', label: 'Failed' },
  { value: 'REFUNDED', label: 'Refunded' },
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

export function PaymentsPage() {
  const [page, setPage] = useState(0)
  const [statusFilter, setStatusFilter] = useState('')
  const [selected, setSelected] = useState<PaymentResponse | null>(null)

  const { data, isLoading, refetch } = usePaymentList(page, PAGE_SIZE, statusFilter || undefined)
  const { data: stats, isLoading: statsLoading } = usePaymentStats()
  const userMap = useUserLookup((data?.content ?? []).map((p) => p.userId))
  const vendorMap = useVendorLookup((data?.content ?? []).map((p) => p.vendorId))

  const handleClose = useCallback(() => setSelected(null), [])

  return (
    <div className="flex h-full flex-col gap-6 p-6">
      <div>
        <h1 className="text-xl font-semibold text-foreground">Payments</h1>
        <p className="mt-0.5 text-sm text-muted-foreground">Monitor transactions and issue refunds</p>
      </div>

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
        <StatCard label="Total" value={stats?.totalPayments} icon={Banknote} color="bg-blue-100 text-blue-600 dark:bg-blue-400/10 dark:text-blue-400" isLoading={statsLoading} />
        <StatCard label="Completed" value={stats?.completedPayments} icon={CheckCircle2} color="bg-green-100 text-green-600 dark:bg-green-400/10 dark:text-green-400" isLoading={statsLoading} />
        <StatCard label="Failed" value={stats?.failedPayments} icon={XCircle} color="bg-red-100 text-red-600 dark:bg-red-400/10 dark:text-red-400" isLoading={statsLoading} />
        <StatCard label="Refunded" value={stats?.refundedPayments} icon={RotateCcw} color="bg-violet-100 text-violet-600 dark:bg-violet-400/10 dark:text-violet-400" isLoading={statsLoading} />
        <StatCard label="Total Revenue" value={stats?.totalRevenue} icon={IndianRupee} color="bg-amber-100 text-amber-600 dark:bg-amber-400/10 dark:text-amber-400" isLoading={statsLoading} prefix="₹" />
      </div>

      <div className="flex overflow-x-auto rounded-xl border border-border bg-card p-1 gap-1 w-fit">
        {STATUS_TABS.map((tab) => (
          <button
            key={tab.value}
            onClick={() => { setStatusFilter(tab.value); setPage(0) }}
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

      <div className="overflow-hidden rounded-xl border border-border bg-card shadow-sm">
        <PaymentTable
          data={data?.content ?? []}
          userMap={userMap}
          isLoading={isLoading}
          page={page}
          totalPages={data?.totalPages ?? 0}
          totalElements={data?.totalElements ?? 0}
          pageSize={PAGE_SIZE}
          onPageChange={setPage}
          onRefresh={() => void refetch()}
          onView={setSelected}
        />
      </div>

      <PaymentDrawer payment={selected} userMap={userMap} vendorMap={vendorMap} onClose={handleClose} />
    </div>
  )
}
