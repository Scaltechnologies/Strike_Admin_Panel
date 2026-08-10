import { RefreshCw, AlertCircle } from 'lucide-react'
import { useDashboard, useRevenueAnalytics } from './hooks/useDashboard'
import { WelcomeSection } from './components/WelcomeSection'
import { KPICards } from './components/KPICards'
import { PendingActionsWidget } from './components/PendingActionsWidget'
import { RecentVendorsWidget } from './components/RecentVendorsWidget'
import { TopVendorsWidget } from './components/TopVendorsWidget'
import { RevenueChart } from '@/components/charts/RevenueChart'
import { VendorStatusChart } from '@/components/charts/VendorStatusChart'
import { cn } from '@/lib/utils'

export function DashboardPage() {
  const {
    data: dashboard,
    isLoading,
    isError,
    refetch,
    isFetching,
  } = useDashboard()

  const { data: revenueData, isLoading: revenueLoading } = useRevenueAnalytics()

  return (
    <div className="flex flex-col gap-6 p-4 sm:p-6">
      {/* Welcome */}
      <WelcomeSection />

      {/* Error banner */}
      {isError && !isLoading && (
        <div className="flex items-center gap-3 rounded-lg border border-destructive/30 bg-destructive/5 px-4 py-3">
          <AlertCircle className="h-4 w-4 shrink-0 text-destructive" aria-hidden />
          <p className="flex-1 text-sm text-destructive">
            Failed to load dashboard data. Some metrics may be unavailable.
          </p>
          <button
            onClick={() => void refetch()}
            disabled={isFetching}
            className={cn(
              'flex items-center gap-1.5 rounded-md px-2.5 py-1.5 text-xs font-medium text-destructive',
              'border border-destructive/30 transition-colors hover:bg-destructive/10',
              'disabled:opacity-50',
            )}
          >
            <RefreshCw className={cn('h-3 w-3', isFetching && 'animate-spin')} aria-hidden />
            Retry
          </button>
        </div>
      )}

      {/* KPI cards */}
      <KPICards data={dashboard} isLoading={isLoading} />

      {/* Charts row */}
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <RevenueChart data={revenueData?.monthly} isLoading={revenueLoading} />
        </div>
        <div>
          <VendorStatusChart data={dashboard?.stats?.vendors} isLoading={isLoading} />
        </div>
      </div>

      {/* Widgets row */}
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
        <PendingActionsWidget data={dashboard} isLoading={isLoading} />
        <RecentVendorsWidget data={dashboard} isLoading={isLoading} />
        <TopVendorsWidget data={dashboard} isLoading={isLoading} />
      </div>
    </div>
  )
}

export default DashboardPage
