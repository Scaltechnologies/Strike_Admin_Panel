import { useCallback, useState } from 'react'
import { useNavigate } from '@tanstack/react-router'
import { motion } from 'framer-motion'
import {
  ArrowDownRight, ArrowUpRight, CalendarCheck, Gauge, HandCoins, Hourglass, IndianRupee, LayoutDashboard, ListChecks, Timer, Users, type LucideIcon,
} from 'lucide-react'
import { ErrorBoundary } from '@/components/common/ErrorBoundary'
import { TabError } from '@/components/common/TabError'
import { cn } from '@/lib/utils'
import { formatRelative } from '@/utils/helpers/date'
import { formatInrShort } from '@/features/vendors/utils/vendor-meta'
import { useRedemptionOverview, type RedemptionRow } from './api/redemption-insights.api'
import { RedemptionFeed } from './components/RedemptionFeed'
import { RedemptionOverviewPanel } from './components/RedemptionOverviewPanel'
import { humanDuration } from './utils/redemption-meta'
import type { RedemptionsTab } from './utils/redemption-tabs'

const TABS: { id: RedemptionsTab; label: string; icon: LucideIcon }[] = [
  { id: 'overview', label: 'Dashboard', icon: LayoutDashboard },
  { id: 'activity', label: 'All redemptions', icon: ListChecks },
]

function HeaderStat({ icon: Icon, label, value, hint, tone, trend, pulse, onClick }: {
  icon: LucideIcon; label: string; value: string; hint?: string; tone: string; trend?: number | null; pulse?: boolean; onClick?: () => void
}) {
  const Comp = onClick ? 'button' : 'div'
  return (
    <Comp type={onClick ? 'button' : undefined} onClick={onClick}
      className={cn('flex items-center gap-3 rounded-2xl border border-white/10 bg-white/[0.06] px-4 py-3 text-left backdrop-blur-md transition-all', onClick && 'hover:-translate-y-0.5 hover:bg-white/[0.12]')}>
      <span className={cn('relative flex h-9 w-9 shrink-0 items-center justify-center rounded-xl text-white shadow-lg', tone)}>
        {pulse && <span className="absolute inset-0 animate-ping rounded-xl bg-amber-400/50" />}
        <Icon className="relative h-4 w-4" />
      </span>
      <span className="min-w-0">
        <motion.span key={value} initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} className="block truncate text-xl font-bold leading-none text-white tabular-nums">{value}</motion.span>
        <span className="mt-1 flex items-center gap-1.5 truncate text-[11px] text-white/60">
          {label}
          {trend != null && trend !== 0 && (
            <span className={cn('flex items-center text-[10px] font-bold', trend > 0 ? 'text-emerald-300' : 'text-rose-300')}>
              {trend > 0 ? <ArrowUpRight className="h-3 w-3" /> : <ArrowDownRight className="h-3 w-3" />}{Math.abs(trend)}%
            </span>
          )}
        </span>
        {hint && <span className="block truncate text-[10px] text-white/40">{hint}</span>}
      </span>
    </Comp>
  )
}

const change = (now?: number, before?: number) => (now == null || before == null || before === 0 ? null : Math.round(((now - before) / before) * 100))

export function RedemptionsPage({ tab = 'overview' }: { tab?: RedemptionsTab }) {
  const navigate = useNavigate()
  const [live, setLive] = useState(true)
  const [days, setDays] = useState(30)
  const overview = useRedemptionOverview(days, live)
  const o = overview.data
  const goTab = (id: RedemptionsTab) => void navigate({ to: '/redemptions', search: { tab: id === 'overview' ? undefined : id }, replace: true })
  const open = useCallback((r: RedemptionRow) => {
    void navigate({ to: '/redemptions/$redemptionId', params: { redemptionId: String(r.id) } })
  }, [navigate])

  return (
    <div className="flex flex-col gap-5 p-4 sm:p-6">
      <motion.section initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}
        className="relative overflow-hidden rounded-3xl bg-[#0b0c10] p-6 text-white shadow-xl shadow-black/10 sm:p-7">
        <div className="auth-aurora pointer-events-none absolute inset-0 opacity-70" aria-hidden><span /><span /><span /></div>
        <div className="auth-grid pointer-events-none absolute inset-0" aria-hidden />
        <HandCoins className="auth-float pointer-events-none absolute -right-6 -top-4 h-44 w-44 text-white/[0.04]" aria-hidden />
        <div className="relative z-10 flex flex-col gap-6">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
            <div className="flex items-start gap-4">
              <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-sky-300 via-indigo-500 to-violet-700 shadow-lg shadow-indigo-600/40">
                <HandCoins className="h-6 w-6" />
              </span>
              <div>
                <h1 className="text-2xl font-bold tracking-tight">Redemptions</h1>
                <p className="mt-1 max-w-xl text-sm text-white/60">
                  Every time a customer pays at a store with their card wallet.
                  {o?.lastRedemptionAt ? ` Last one ${formatRelative(o.lastRedemptionAt)}.` : ''}
                </p>
              </div>
            </div>
            <button type="button" onClick={() => setLive((v) => !v)} title={live ? 'Pause live updates' : 'Resume live updates'}
              className={cn('flex items-center gap-2 self-start rounded-full border px-3.5 py-1.5 text-xs font-semibold backdrop-blur-md transition-colors',
                live ? 'border-emerald-400/40 bg-emerald-400/15 text-emerald-200' : 'border-white/15 bg-white/[0.06] text-white/70')}>
              <span className="relative flex h-2 w-2">
                {live && <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75" />}
                <span className={cn('relative inline-flex h-2 w-2 rounded-full', live ? 'bg-emerald-400' : 'bg-white/50')} />
              </span>
              {live ? 'Live' : 'Paused'}
            </button>
          </div>
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 xl:grid-cols-6">
            <HeaderStat icon={CalendarCheck} label="Redeemed today" value={o ? formatInrShort(o.todayAmount) : '—'} hint={o ? `${o.todayCount} redemptions · vs yesterday` : undefined}
              trend={change(o?.todayAmount, o?.yesterdayAmount)} tone="bg-gradient-to-br from-sky-400 to-indigo-600" />
            <HeaderStat icon={IndianRupee} label="This month" value={o ? formatInrShort(o.monthAmount) : '—'} hint={o ? `${o.monthCount} redemptions` : undefined}
              tone="bg-gradient-to-br from-emerald-400 to-teal-600" />
            <HeaderStat icon={HandCoins} label="Redeemed all time" value={o ? formatInrShort(o.amount) : '—'} hint={o ? `${o.completed} completed of ${o.total}` : undefined}
              tone="bg-gradient-to-br from-pink-400 to-rose-600" onClick={() => goTab('activity')} />
            <HeaderStat icon={Gauge} label="Success rate" value={o?.successRate != null ? `${o.successRate}%` : '—'} hint={o ? `${(o.rejected ?? 0) + (o.failed ?? 0)} refused` : undefined}
              tone="bg-gradient-to-br from-lime-400 to-green-600" />
            <HeaderStat icon={Hourglass} label="Waiting for store" value={o ? String(o.pending ?? 0) : '—'} pulse={(o?.pending ?? 0) > 0}
              hint={o?.oldestPendingAt ? `oldest ${formatRelative(o.oldestPendingAt)}` : 'none waiting'} tone="bg-gradient-to-br from-amber-400 to-orange-600" onClick={() => goTab('activity')} />
            <HeaderStat icon={Timer} label="Avg store decision" value={o ? humanDuration(o.averageApprovalSeconds) : '—'}
              hint={o ? `${o.customers ?? 0} customers · ${o.stores ?? 0} stores` : undefined} tone="bg-gradient-to-br from-violet-400 to-fuchsia-600" />
          </div>
        </div>
      </motion.section>

      <nav aria-label="Redemption sections" className="sticky top-0 z-20 -mx-1 overflow-x-auto rounded-2xl border border-border bg-card/85 p-1.5 shadow-sm backdrop-blur-md">
        <div role="tablist" className="flex min-w-max items-center gap-1">
          {TABS.map(({ id, label, icon: Icon }) => {
            const on = tab === id
            return (
              <button key={id} type="button" role="tab" aria-selected={on} onClick={() => goTab(id)}
                className={cn('relative flex items-center gap-1.5 rounded-xl px-3.5 py-2 text-[13px] font-medium transition-colors', on ? 'text-white' : 'text-muted-foreground hover:bg-muted hover:text-foreground')}>
                {on && <motion.span layoutId="red-tab-pill" className="absolute inset-0 rounded-xl bg-gradient-to-r from-sky-500 to-indigo-600 shadow-md shadow-indigo-500/25" transition={{ type: 'spring', stiffness: 480, damping: 36 }} />}
                <Icon className="relative h-4 w-4" />
                <span className="relative">{label}</span>
                {id === 'activity' && (o?.pending ?? 0) > 0 && (
                  <span className={cn('relative rounded-full px-1.5 text-[10px] font-bold tabular-nums', on ? 'bg-white/25 text-white' : 'bg-amber-500 text-white')}>{o!.pending}</span>
                )}
              </button>
            )
          })}
          <span className="ml-auto hidden items-center gap-1.5 px-3 text-[11px] text-muted-foreground sm:flex">
            <Users className="h-3.5 w-3.5" /> avg {o ? formatInrShort(o.averageAmount) : '—'} · biggest {o ? formatInrShort(o.largestAmount) : '—'}
          </span>
        </div>
      </nav>

      <motion.div key={tab} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.25 }}>
        <ErrorBoundary key={tab} fallback={<TabError />}>
          {tab === 'overview'
            ? <RedemptionOverviewPanel data={o} loading={overview.isLoading} days={days} onDays={setDays} live={live} onOpen={open} onSeeAll={() => goTab('activity')} />
            : <RedemptionFeed live={live} onOpen={open} />}
        </ErrorBoundary>
      </motion.div>
    </div>
  )
}

export default RedemptionsPage
