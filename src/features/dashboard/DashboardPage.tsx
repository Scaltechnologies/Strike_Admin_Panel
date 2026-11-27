import { motion } from 'framer-motion'
import { AlertCircle, RefreshCw } from 'lucide-react'
import { hasPermission } from '@/core/auth/auth'
import { cn } from '@/lib/utils'
import { useDashboard, usePaymentAnalytics, useRevenueAnalytics } from './hooks/useDashboard'
import { DashboardHero } from './components/DashboardHero'
import { KpiGrid } from './components/KpiGrid'
import { RevenueTrendCard } from './components/RevenueTrendCard'
import { VendorMixCard } from './components/VendorMixCard'
import { PaymentHealthCard } from './components/PaymentHealthCard'
import { TopVendorsCard } from './components/TopVendorsCard'
import { ActionCenterCard } from './components/ActionCenterCard'
import { LiveActivityCard } from './components/LiveActivityCard'
import { RecentSignupsCard } from './components/RecentSignupsCard'
import { staggerContainer, toNumber } from './utils/dashboard-format'

export function DashboardPage() {
  const dashboard = useDashboard()
  const revenue = useRevenueAnalytics()
  const payments = usePaymentAnalytics()
  const data = dashboard.data
  const canSeeActivity = hasPermission('SEC_AUDIT_LOGS')

  const refreshAll = () => {
    void dashboard.refetch()
    void revenue.refetch()
    void payments.refetch()
  }
  const refreshing = dashboard.isFetching || revenue.isFetching || payments.isFetching

  return (
    <motion.div variants={staggerContainer} initial="hidden" animate="show" className="flex flex-col gap-5 p-4 sm:p-6">
      <DashboardHero
        todayRevenue={data?.revenue ? toNumber(data.revenue.today) : undefined}
        todayPayments={data?.stats?.todayPayments != null ? toNumber(data.stats.todayPayments) : undefined}
        pendingVendors={toNumber(data?.pendingActions?.pendingVendors ?? data?.stats?.vendors?.pending)}
        pendingWithdrawals={toNumber(data?.pendingActions?.pendingWithdrawals)}
        updatedAt={dashboard.dataUpdatedAt}
        refreshing={refreshing}
        onRefresh={refreshAll}
      />

      {dashboard.isError && !dashboard.isLoading && (
        <div className="flex items-center gap-3 rounded-2xl border border-destructive/30 bg-destructive/5 px-4 py-3">
          <AlertCircle className="h-4 w-4 shrink-0 text-destructive" aria-hidden />
          <p className="flex-1 text-sm text-destructive">Some dashboard figures couldn&apos;t be loaded.</p>
          <button type="button" onClick={refreshAll} disabled={refreshing}
            className="flex items-center gap-1.5 rounded-lg border border-destructive/30 px-2.5 py-1.5 text-xs font-medium text-destructive hover:bg-destructive/10 disabled:opacity-50">
            <RefreshCw className={cn('h-3 w-3', refreshing && 'animate-spin')} aria-hidden />
            Try again
          </button>
        </div>
      )}

      <KpiGrid data={data} monthly={revenue.data?.monthly} loading={dashboard.isLoading} />

      <div className="grid grid-cols-1 gap-5 xl:grid-cols-3">
        <div className="xl:col-span-2">
          <RevenueTrendCard monthly={revenue.data?.monthly} loading={revenue.isLoading} />
        </div>
        <VendorMixCard vendors={data?.stats?.vendors} loading={dashboard.isLoading} />
      </div>

      <div className="grid grid-cols-1 gap-5 md:grid-cols-2 xl:grid-cols-3">
        <ActionCenterCard data={data} loading={dashboard.isLoading} />
        <PaymentHealthCard data={payments.data} loading={payments.isLoading} />
        <TopVendorsCard vendors={data?.topVendors} loading={dashboard.isLoading} />
      </div>

      <div className={cn('grid grid-cols-1 gap-5', canSeeActivity && 'xl:grid-cols-3')}>
        {canSeeActivity && (
          <div className="xl:col-span-2">
            <LiveActivityCard />
          </div>
        )}
        <RecentSignupsCard vendors={data?.recentVendorRegistrations} loading={dashboard.isLoading} />
      </div>
    </motion.div>
  )
}

export default DashboardPage
