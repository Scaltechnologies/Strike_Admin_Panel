import { Users, Store, IndianRupee, ShoppingBag, CreditCard, ArrowDownCircle, TrendingUp, Percent, RefreshCw } from 'lucide-react'
import { cn } from '@/lib/utils'
import { useAnalyticsOverview, useRevenueAnalytics, useVendorPerformance, useCommissionAnalytics } from './hooks/useAnalytics'

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
            {value != null
              ? `${prefix}${Number(value).toLocaleString('en-IN', { maximumFractionDigits: 0 })}`
              : '—'}
          </p>
        )}
      </div>
    </div>
  )
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div>
      <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-muted-foreground">{title}</h2>
      {children}
    </div>
  )
}

function DataRow({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="flex items-center justify-between py-2.5 text-sm">
      <span className="text-muted-foreground">{label}</span>
      <span className="font-medium text-foreground">{value}</span>
    </div>
  )
}

export function AnalyticsPage() {
  const { data: overview, isLoading: overviewLoading, refetch: refetchOverview } = useAnalyticsOverview()
  const { data: revenue, isLoading: revenueLoading } = useRevenueAnalytics()
  const { data: vendors, isLoading: vendorsLoading } = useVendorPerformance()
  const { data: commissions, isLoading: commissionsLoading } = useCommissionAnalytics()

  return (
    <div className="flex h-full flex-col gap-6 p-6">
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-xl font-semibold text-foreground">Analytics</h1>
          <p className="mt-0.5 text-sm text-muted-foreground">Platform performance overview</p>
        </div>
        <button
          onClick={() => void refetchOverview()}
          className="flex items-center gap-1.5 rounded-lg border border-border px-3 py-2 text-sm text-muted-foreground hover:bg-muted hover:text-foreground"
        >
          <RefreshCw className="h-3.5 w-3.5" />
          Refresh
        </button>
      </div>

      {/* Overview KPIs */}
      <Section title="Overview">
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
          <StatCard label="Total Users" value={overview?.totalUsers} icon={Users} color="bg-blue-100 text-blue-600 dark:bg-blue-400/10 dark:text-blue-400" isLoading={overviewLoading} />
          <StatCard label="Vendors" value={overview?.totalVendors} icon={Store} color="bg-violet-100 text-violet-600 dark:bg-violet-400/10 dark:text-violet-400" isLoading={overviewLoading} />
          <StatCard label="Revenue" value={overview?.totalRevenue} icon={IndianRupee} color="bg-green-100 text-green-600 dark:bg-green-400/10 dark:text-green-400" isLoading={overviewLoading} prefix="₹" />
          <StatCard label="Orders" value={overview?.totalOrders} icon={ShoppingBag} color="bg-amber-100 text-amber-600 dark:bg-amber-400/10 dark:text-amber-400" isLoading={overviewLoading} />
          <StatCard label="Subscriptions" value={overview?.activeSubscriptions} icon={CreditCard} color="bg-cyan-100 text-cyan-600 dark:bg-cyan-400/10 dark:text-cyan-400" isLoading={overviewLoading} />
          <StatCard label="Pending W/D" value={overview?.pendingWithdrawals} icon={ArrowDownCircle} color="bg-red-100 text-red-600 dark:bg-red-400/10 dark:text-red-400" isLoading={overviewLoading} />
        </div>
      </Section>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Commission summary */}
        <div className="rounded-xl border border-border bg-card p-5 shadow-sm">
          <div className="mb-1 flex items-center gap-2">
            <Percent className="h-4 w-4 text-muted-foreground" />
            <h3 className="text-sm font-semibold text-foreground">Commissions</h3>
          </div>
          <div className="divide-y divide-border">
            {commissionsLoading ? (
              Array.from({ length: 4 }).map((_, i) => (
                <div key={i} className="flex items-center justify-between py-2.5">
                  <div className="h-4 w-32 animate-pulse rounded bg-muted" />
                  <div className="h-4 w-20 animate-pulse rounded bg-muted" />
                </div>
              ))
            ) : commissions ? (
              <>
                <DataRow label="Total Commissions" value={commissions.totalCommissions ?? '—'} />
                <DataRow label="Settled" value={commissions.settledCommissions ?? '—'} />
                <DataRow label="Pending" value={commissions.pendingCommissions ?? '—'} />
                <DataRow label="Total Amount" value={commissions.totalAmount != null ? `₹${Number(commissions.totalAmount).toLocaleString('en-IN', { maximumFractionDigits: 0 })}` : '—'} />
              </>
            ) : (
              <p className="py-6 text-center text-sm text-muted-foreground">No commission data</p>
            )}
          </div>
        </div>

        {/* Revenue breakdown */}
        <div className="rounded-xl border border-border bg-card p-5 shadow-sm">
          <div className="mb-1 flex items-center gap-2">
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
            <h3 className="text-sm font-semibold text-foreground">Revenue Periods</h3>
          </div>
          {revenueLoading ? (
            <div className="space-y-2 pt-2">
              {Array.from({ length: 4 }).map((_, i) => (
                <div key={i} className="flex items-center justify-between py-1">
                  <div className="h-4 w-24 animate-pulse rounded bg-muted" />
                  <div className="h-4 w-20 animate-pulse rounded bg-muted" />
                </div>
              ))}
            </div>
          ) : revenue && revenue.length > 0 ? (
            <div className="divide-y divide-border">
              {revenue.slice(0, 8).map((r, i) => (
                <DataRow
                  key={i}
                  label={String(r.period ?? `Period ${i + 1}`)}
                  value={r.revenue != null ? `₹${Number(r.revenue).toLocaleString('en-IN', { maximumFractionDigits: 0 })}` : '—'}
                />
              ))}
            </div>
          ) : (
            <p className="py-6 text-center text-sm text-muted-foreground">No revenue data</p>
          )}
        </div>
      </div>

      {/* Vendor performance table */}
      <div className="rounded-xl border border-border bg-card shadow-sm">
        <div className="border-b border-border px-5 py-4">
          <h3 className="text-sm font-semibold text-foreground">Vendor Performance</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border bg-muted/40">
                {['Vendor', 'Revenue', 'Orders', 'Commission'].map((h) => (
                  <th key={h} className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wide text-muted-foreground">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {vendorsLoading ? (
                Array.from({ length: 5 }).map((_, i) => (
                  <tr key={i}>
                    {Array.from({ length: 4 }).map((_, ci) => (
                      <td key={ci} className="px-4 py-3"><div className="h-4 animate-pulse rounded bg-muted" /></td>
                    ))}
                  </tr>
                ))
              ) : vendors && vendors.length > 0 ? (
                vendors.slice(0, 10).map((v, i) => (
                  <tr key={i} className="hover:bg-muted/30">
                    <td className="px-4 py-3">
                      <span className="font-medium text-foreground">{v.vendorName ?? `Vendor #${v.vendorId}`}</span>
                    </td>
                    <td className="px-4 py-3 text-foreground">
                      {v.totalRevenue != null ? `₹${Number(v.totalRevenue).toLocaleString('en-IN', { maximumFractionDigits: 0 })}` : '—'}
                    </td>
                    <td className="px-4 py-3 text-foreground">{v.totalOrders ?? '—'}</td>
                    <td className="px-4 py-3 text-foreground">
                      {v.commissionEarned != null ? `₹${Number(v.commissionEarned).toLocaleString('en-IN', { maximumFractionDigits: 0 })}` : '—'}
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={4} className="py-12 text-center text-sm text-muted-foreground">No vendor data</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
