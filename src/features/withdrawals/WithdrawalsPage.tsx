import { useState } from 'react'
import { useNavigate } from '@tanstack/react-router'
import { motion } from 'framer-motion'
import { BarChart3, CalendarCheck, CheckCircle2, Hourglass, IndianRupee, ListChecks, Timer, Wallet, type LucideIcon } from 'lucide-react'
import { ErrorBoundary } from '@/components/common/ErrorBoundary'
import { TabError } from '@/components/common/TabError'
import { cn } from '@/lib/utils'
import { formatRelative } from '@/utils/helpers/date'
import { AnimatedNumber } from '@/features/dashboard/components/dashboard-ui'
import { formatInrShort } from '@/features/vendors/utils/vendor-meta'
import { usePayoutOverview } from './api/withdrawal-insights.api'
import { PayoutHistory, PayoutQueue } from './components/PayoutLists'
import { PayoutInsights } from './components/PayoutInsights'
import { humanDuration } from './utils/payout-meta'
import type { WithdrawalsTab } from './utils/withdrawal-tabs'

const TABS: { id: WithdrawalsTab; label: string; icon: LucideIcon }[] = [
  { id: 'queue', label: 'Payout queue', icon: Hourglass },
  { id: 'history', label: 'All requests', icon: ListChecks },
  { id: 'insights', label: 'Insights', icon: BarChart3 },
]

function HeaderStat({ icon: Icon, label, value, hint, tone, pulse, onClick, money, text }: {
  icon: LucideIcon; label: string; value: number | undefined; hint?: string; tone: string; pulse?: boolean; onClick?: () => void; money?: boolean; text?: string
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
        {text != null ? <span className="block truncate text-xl font-bold leading-none text-white">{text}</span> : value == null ? <span className="block text-xl font-bold leading-none text-white">—</span>
          : <AnimatedNumber value={value} format={money ? formatInrShort : undefined} className="block truncate text-xl font-bold leading-none text-white" />}
        <span className="mt-1 block truncate text-[11px] text-white/60">{label}</span>
        {hint && <span className="block truncate text-[10px] text-white/40">{hint}</span>}
      </span>
    </Comp>
  )
}

export function WithdrawalsPage({ tab = 'queue' }: { tab?: WithdrawalsTab }) {
  const navigate = useNavigate()
  const [days, setDays] = useState(30)
  const overview = usePayoutOverview(days)
  const o = overview.data
  const goTab = (id: WithdrawalsTab) => void navigate({ to: '/withdrawals', search: { tab: id === 'queue' ? undefined : id }, replace: true })

  return (
    <div className="flex flex-col gap-5 p-4 sm:p-6">
      <motion.section initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}
        className="relative overflow-hidden rounded-3xl bg-[#0b0c10] p-6 text-white shadow-xl shadow-black/10 sm:p-7">
        <div className="auth-aurora pointer-events-none absolute inset-0 opacity-70" aria-hidden><span /><span /><span /></div>
        <div className="auth-grid pointer-events-none absolute inset-0" aria-hidden />
        <Wallet className="auth-float pointer-events-none absolute -right-6 -top-4 h-44 w-44 text-white/[0.04]" aria-hidden />
        <div className="relative z-10 flex flex-col gap-6">
          <div className="flex items-start gap-4">
            <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-emerald-300 via-teal-500 to-cyan-700 shadow-lg shadow-teal-600/40"><Wallet className="h-6 w-6" /></span>
            <div>
              <h1 className="text-2xl font-bold tracking-tight">Withdrawals</h1>
              <p className="mt-1 max-w-xl text-sm text-white/60">Vendors ask to be paid what they’ve earned. Check it’s covered, send the money, then mark it paid — they’re notified instantly.</p>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 xl:grid-cols-5">
            <HeaderStat icon={Hourglass} label="Waiting to be paid" value={o?.pendingAmount} money pulse={(o?.pending ?? 0) > 0}
              hint={o ? `${o.pending} request${o.pending === 1 ? '' : 's'}${o.oldestPendingAt ? ` · oldest ${formatRelative(o.oldestPendingAt)}` : ''}` : undefined}
              tone="bg-gradient-to-br from-amber-400 to-orange-600" onClick={() => goTab('queue')} />
            <HeaderStat icon={CalendarCheck} label="Paid this month" value={o?.paidThisMonth} money hint={o ? `${o.paidThisMonthCount} payouts · ${formatInrShort(o.paidToday)} today` : undefined}
              tone="bg-gradient-to-br from-emerald-400 to-teal-600" />
            <HeaderStat icon={IndianRupee} label="Paid all time" value={o?.paid} money hint={o ? `${o.approved} payouts` : undefined}
              tone="bg-gradient-to-br from-sky-400 to-indigo-600" onClick={() => goTab('history')} />
            <HeaderStat icon={Timer} label="Average time to pay" value={undefined} text={o ? humanDuration(o.averageReviewSeconds) : undefined} hint={o ? `${o.vendors} vendors paid` : undefined}
              tone="bg-gradient-to-br from-violet-400 to-fuchsia-600" />
            <HeaderStat icon={CheckCircle2} label="Decided today" value={o?.decidedToday} hint={o ? `${o.rejected} rejected all time` : undefined}
              tone="bg-gradient-to-br from-pink-400 to-rose-600" />
          </div>
        </div>
      </motion.section>

      <nav aria-label="Withdrawal sections" className="sticky top-0 z-20 -mx-1 overflow-x-auto rounded-2xl border border-border bg-card/85 p-1.5 shadow-sm backdrop-blur-md">
        <div role="tablist" className="flex min-w-max gap-1">
          {TABS.map(({ id, label, icon: Icon }) => {
            const on = tab === id
            return (
              <button key={id} type="button" role="tab" aria-selected={on} onClick={() => goTab(id)}
                className={cn('relative flex items-center gap-1.5 rounded-xl px-3.5 py-2 text-[13px] font-medium transition-colors', on ? 'text-white' : 'text-muted-foreground hover:bg-muted hover:text-foreground')}>
                {on && <motion.span layoutId="wd-tab-pill" className="absolute inset-0 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-600 shadow-md shadow-emerald-500/25" transition={{ type: 'spring', stiffness: 480, damping: 36 }} />}
                <Icon className="relative h-4 w-4" />
                <span className="relative">{label}</span>
                {id === 'queue' && (o?.pending ?? 0) > 0 && (
                  <span className={cn('relative rounded-full px-1.5 text-[10px] font-bold tabular-nums', on ? 'bg-white/25 text-white' : 'bg-amber-500 text-white')}>{o!.pending}</span>
                )}
              </button>
            )
          })}
        </div>
      </nav>

      <motion.div key={tab} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.25 }}>
        <ErrorBoundary key={tab} fallback={<TabError />}>
          {tab === 'queue' && <PayoutQueue />}
          {tab === 'history' && <PayoutHistory />}
          {tab === 'insights' && <PayoutInsights data={o} loading={overview.isLoading} days={days} onDays={setDays} />}
        </ErrorBoundary>
      </motion.div>
    </div>
  )
}

export default WithdrawalsPage
