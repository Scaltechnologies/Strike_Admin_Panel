import { motion } from 'framer-motion'
import {
  CalendarDays, CreditCard, IndianRupee, Percent, Receipt, Store, TrendingDown, TrendingUp, Users, UtensilsCrossed,
  type LucideIcon,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import type { AnalyticsMonthlyRevenue, DashboardData } from '../types/dashboard.types'
import { AnimatedNumber, Skeleton, Sparkline } from './dashboard-ui'
import { formatCount, formatInr, formatInrCompact, riseIn, staggerContainer, toNumber } from '../utils/dashboard-format'

interface KpiGridProps {
  data?: DashboardData
  monthly?: AnalyticsMonthlyRevenue[]
  loading: boolean
}

interface Tile {
  key: string
  label: string
  value: number
  format: (n: number) => string
  icon: LucideIcon
  gradient: string
  glow: string
  sub?: React.ReactNode
  spark?: number[]
  sparkColor?: string
  delta?: number | null
  progress?: { value: number; total: number; label: string; color: string }
}

/** % change between the last two complete-or-current months, or null if there's no baseline. */
function monthDelta(values: number[]): number | null {
  if (values.length < 2) return null
  const prev = values[values.length - 2]
  const last = values[values.length - 1]
  if (!prev) return null
  return ((last - prev) / prev) * 100
}

function DeltaChip({ delta }: { delta: number }) {
  const up = delta >= 0
  const Icon = up ? TrendingUp : TrendingDown
  return (
    <span className={cn(
      'inline-flex items-center gap-0.5 rounded-full px-1.5 py-0.5 text-[10px] font-semibold',
      up ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-400/10 dark:text-emerald-300'
        : 'bg-red-100 text-red-700 dark:bg-red-400/10 dark:text-red-300',
    )} title="Last complete month compared with the month before">
      <Icon className="h-3 w-3" aria-hidden />
      {Math.abs(delta) >= 1000 ? '999+' : Math.abs(delta).toFixed(Math.abs(delta) < 10 ? 1 : 0)}%
    </span>
  )
}

function KpiTile({ tile, loading }: { tile: Tile; loading: boolean }) {
  const Icon = tile.icon
  const pct = tile.progress && tile.progress.total > 0 ? (tile.progress.value / tile.progress.total) * 100 : 0
  return (
    <motion.div
      variants={riseIn}
      whileHover={{ y: -4 }}
      transition={{ type: 'spring', stiffness: 400, damping: 25 }}
      className="group relative overflow-hidden rounded-2xl border border-border bg-card p-4 shadow-sm transition-shadow hover:shadow-xl hover:shadow-black/[0.05] dark:hover:shadow-black/30"
    >
      {/* soft colour glow that brightens on hover */}
      <div className={cn('pointer-events-none absolute -right-10 -top-10 h-32 w-32 rounded-full opacity-[0.10] blur-2xl transition-opacity duration-500 group-hover:opacity-25', tile.glow)} aria-hidden />

      <div className="relative flex items-start justify-between gap-2">
        <p className="text-xs font-medium text-muted-foreground">{tile.label}</p>
        <span className={cn(
          'flex h-9 w-9 shrink-0 items-center justify-center rounded-xl text-white shadow-md transition-transform duration-300 group-hover:rotate-[-8deg] group-hover:scale-110',
          tile.gradient,
        )}>
          <Icon className="h-4 w-4" aria-hidden />
        </span>
      </div>

      {loading ? (
        <>
          <Skeleton className="mt-1 h-7 w-28" />
          <Skeleton className="mt-3 h-3 w-20" />
        </>
      ) : (
        <>
          <div className="relative -mt-1 flex items-center gap-2">
            <p className="text-2xl font-bold tracking-tight text-foreground" title={tile.format === formatInrCompact ? formatInr(tile.value) : undefined}>
              <AnimatedNumber value={tile.value} format={tile.format} />
            </p>
            {tile.delta != null && <DeltaChip delta={tile.delta} />}
          </div>
          {tile.sub && <p className="relative mt-0.5 truncate text-xs text-muted-foreground">{tile.sub}</p>}
          {tile.progress && (
            <div className="relative mt-3">
              <div className="h-1.5 overflow-hidden rounded-full bg-muted">
                <motion.div className={cn('h-full rounded-full', tile.progress.color)}
                  initial={{ width: 0 }} animate={{ width: `${Math.min(100, pct)}%` }}
                  transition={{ duration: 1.1, ease: 'easeOut', delay: 0.3 }} />
              </div>
              <p className="mt-1 text-[11px] text-muted-foreground">{tile.progress.label}</p>
            </div>
          )}
          {tile.spark && tile.spark.length > 1 && (
            <div className="relative mt-2 -mb-1">
              <Sparkline values={tile.spark} color={tile.sparkColor} />
            </div>
          )}
        </>
      )}
    </motion.div>
  )
}

export function KpiGrid({ data, monthly, loading }: KpiGridProps) {
  const s = data?.stats
  const r = data?.revenue
  const months = (monthly ?? []).slice(-8)
  const revSeries = months.map((m) => toNumber(m.subscriptionRevenue))
  const comSeries = months.map((m) => toNumber(m.commission))
  const prevMonth = revSeries.length >= 2 ? revSeries[revSeries.length - 2] : null

  // The current month isn't over yet, so the % change compares the last two complete months.
  const now = new Date()
  const thisMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`
  const lastIsCurrent = months.length > 0 && months[months.length - 1].month === thisMonth
  const complete = <T,>(series: T[]) => (lastIsCurrent ? series.slice(0, -1) : series)

  const commissionTotal = toNumber(s?.totalCommissionEarned)
  const commissionPending = toNumber(r?.commissionPending ?? s?.pendingCommission)
  const vendors = s?.vendors
  const stores = s?.stores && !s.stores.error ? s.stores : undefined

  const tiles: Tile[] = [
    {
      key: 'revenue', label: 'Total revenue', value: toNumber(r?.total ?? s?.totalSubscriptionRevenue),
      format: formatInrCompact, icon: IndianRupee,
      gradient: 'bg-gradient-to-br from-[#ffc400] via-[#ff6a00] to-[#e01a00] shadow-orange-500/30', glow: 'bg-orange-500',
      sub: 'All completed payments', spark: revSeries, sparkColor: '#ff6a00', delta: monthDelta(complete(revSeries)),
    },
    {
      key: 'month', label: 'This month', value: toNumber(r?.monthly), format: formatInrCompact, icon: CalendarDays,
      gradient: 'bg-gradient-to-br from-violet-500 to-fuchsia-600 shadow-violet-500/30', glow: 'bg-violet-500',
      sub: prevMonth != null ? <>Last month <span className="font-medium text-foreground">{formatInrCompact(prevMonth)}</span></> : 'Revenue so far this month',
    },
    {
      key: 'commission', label: 'Commission earned', value: commissionTotal, format: formatInrCompact, icon: Percent,
      gradient: 'bg-gradient-to-br from-emerald-500 to-teal-600 shadow-emerald-500/30', glow: 'bg-emerald-500',
      spark: comSeries, sparkColor: '#10b981', delta: monthDelta(complete(comSeries)),
      progress: commissionTotal > 0 ? {
        value: commissionTotal - commissionPending, total: commissionTotal, color: 'bg-gradient-to-r from-emerald-400 to-teal-500',
        label: `${formatInrCompact(commissionPending)} still to be settled`,
      } : undefined,
    },
    {
      key: 'subs', label: 'Active subscriptions', value: toNumber(s?.totalSubscriptions), format: formatCount, icon: CreditCard,
      gradient: 'bg-gradient-to-br from-sky-500 to-blue-600 shadow-sky-500/30', glow: 'bg-sky-500',
      sub: 'Cards members are using now',
    },
    {
      key: 'users', label: 'Members', value: toNumber(s?.totalUsers), format: formatCount, icon: Users,
      gradient: 'bg-gradient-to-br from-pink-500 to-rose-600 shadow-pink-500/30', glow: 'bg-pink-500',
      sub: 'Registered app users',
    },
    {
      key: 'vendors', label: 'Active vendors', value: toNumber(vendors?.active), format: formatCount, icon: Store,
      gradient: 'bg-gradient-to-br from-amber-500 to-orange-600 shadow-amber-500/30', glow: 'bg-amber-500',
      progress: vendors && vendors.total > 0 ? {
        value: vendors.active, total: vendors.total, color: 'bg-gradient-to-r from-amber-400 to-orange-500',
        label: `of ${formatCount(vendors.total)} vendors${vendors.pending ? ` · ${vendors.pending} waiting for approval` : ''}`,
      } : undefined,
    },
    {
      key: 'stores', label: 'Open stores', value: toNumber(stores?.active), format: formatCount, icon: UtensilsCrossed,
      gradient: 'bg-gradient-to-br from-lime-500 to-green-600 shadow-lime-500/30', glow: 'bg-lime-500',
      progress: stores && toNumber(stores.total) > 0 ? {
        value: toNumber(stores.active), total: toNumber(stores.total), color: 'bg-gradient-to-r from-lime-400 to-green-500',
        label: `of ${formatCount(toNumber(stores.total))} stores${toNumber(stores.temporarilyClosed) ? ` · ${formatCount(toNumber(stores.temporarilyClosed))} closed for now` : ''}`,
      } : undefined,
      sub: stores ? undefined : 'Store data unavailable',
    },
    {
      key: 'redemptions', label: 'Redemptions', value: toNumber(s?.totalRedemptions), format: formatCount, icon: Receipt,
      gradient: 'bg-gradient-to-br from-indigo-500 to-violet-600 shadow-indigo-500/30', glow: 'bg-indigo-500',
      sub: s?.totalRedemptionAmount != null
        ? <>Worth <span className="font-medium text-foreground">{formatInrCompact(toNumber(s.totalRedemptionAmount))}</span></>
        : 'Card benefits used at stores',
    },
  ]

  return (
    <motion.div variants={staggerContainer} className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
      {tiles.map((t) => <KpiTile key={t.key} tile={t} loading={loading} />)}
    </motion.div>
  )
}
