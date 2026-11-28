import { useState } from 'react'
import { useNavigate } from '@tanstack/react-router'
import { motion } from 'framer-motion'
import { AlertTriangle, BarChart3, Banknote, CalendarDays, Hourglass, IndianRupee, ListChecks, RotateCcw, Scale, type LucideIcon } from 'lucide-react'
import { ErrorBoundary } from '@/components/common/ErrorBoundary'
import { TabError } from '@/components/common/TabError'
import { cn } from '@/lib/utils'
import { AnimatedNumber } from '@/features/dashboard/components/dashboard-ui'
import { formatInrShort } from '@/features/vendors/utils/vendor-meta'
import { usePaymentOverview } from './api/payment-insights.api'
import { PaymentFeed } from './components/PaymentFeed'
import { PaymentInsights } from './components/PaymentInsights'
import type { PaymentsTab } from './utils/payment-meta'

const TABS: { id: PaymentsTab; label: string; icon: LucideIcon }[] = [
  { id: 'all', label: 'All payments', icon: ListChecks },
  { id: 'refunds', label: 'Refunds', icon: RotateCcw },
  { id: 'insights', label: 'Insights', icon: BarChart3 },
]

function HeaderStat({ icon: Icon, label, value, hint, tone, money, pulse, onClick }: {
  icon: LucideIcon; label: string; value: number | undefined; hint?: string; tone: string; money?: boolean; pulse?: boolean; onClick?: () => void
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
        {value == null ? <span className="block text-xl font-bold leading-none text-white">—</span>
          : <AnimatedNumber value={Number(value)} format={money ? formatInrShort : undefined} className="block truncate text-xl font-bold leading-none text-white" />}
        <span className="mt-1 block truncate text-[11px] text-white/60">{label}</span>
        {hint && <span className="block truncate text-[10px] text-white/40">{hint}</span>}
      </span>
    </Comp>
  )
}

export function PaymentsPage({ tab = 'all' }: { tab?: PaymentsTab }) {
  const navigate = useNavigate()
  const [days, setDays] = useState(30)
  const overview = usePaymentOverview(days)
  const o = overview.data
  const goTab = (id: PaymentsTab) => void navigate({ to: '/payments', search: { tab: id === 'all' ? undefined : id }, replace: true })
  const attention = Number(o?.refunds_pending ?? 0) + Number(o?.refunds_failed ?? 0) + Number(o?.disputes_open ?? 0)

  return (
    <div className="flex flex-col gap-5 p-4 sm:p-6">
      <motion.section initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}
        className="relative overflow-hidden rounded-3xl bg-[#0b0c10] p-6 text-white shadow-xl shadow-black/10 sm:p-7">
        <div className="auth-aurora pointer-events-none absolute inset-0 opacity-70" aria-hidden><span /><span /><span /></div>
        <div className="auth-grid pointer-events-none absolute inset-0" aria-hidden />
        <Banknote className="auth-float pointer-events-none absolute -right-6 -top-4 h-44 w-44 text-white/[0.04]" aria-hidden />
        <div className="relative z-10 flex flex-col gap-6">
          <div className="flex items-start gap-4">
            <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-violet-400 via-fuchsia-500 to-pink-600 shadow-lg shadow-fuchsia-600/40"><Banknote className="h-6 w-6" /></span>
            <div>
              <h1 className="text-2xl font-bold tracking-tight">Payments</h1>
              <p className="mt-1 max-w-xl text-sm text-white/60">Every card purchase — online through Razorpay or paid at the store. Open any payment to see its full story, or refund it in a few clicks.</p>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 xl:grid-cols-5">
            <HeaderStat icon={IndianRupee} label="Collected today" value={o?.collected_today} money hint={o ? `${o.paid_today ?? 0} sale${Number(o.paid_today) === 1 ? '' : 's'}` : undefined} tone="bg-gradient-to-br from-sky-400 to-indigo-600" />
            <HeaderStat icon={CalendarDays} label="This month" value={o?.collected_month} money tone="bg-gradient-to-br from-emerald-400 to-teal-600" onClick={() => goTab('insights')} />
            <HeaderStat icon={Scale} label="Collected all time" value={o?.collected_all} money hint={o ? `${o.paid_all ?? 0} payments` : undefined} tone="bg-gradient-to-br from-amber-400 to-orange-600" />
            <HeaderStat icon={RotateCcw} label="Refunded all time" value={o?.refunded_all} money hint={o ? `${o.refunds_all ?? 0} refunds` : undefined} tone="bg-gradient-to-br from-violet-500 to-fuchsia-600" onClick={() => goTab('refunds')} />
            <HeaderStat icon={attention ? AlertTriangle : Hourglass} label="Needs a look" value={o ? attention : undefined} pulse={attention > 0}
              hint={o ? `${o.refunds_pending ?? 0} refunds on the way · ${o.refunds_failed ?? 0} failed · ${o.disputes_open ?? 0} disputes` : undefined}
              tone="bg-gradient-to-br from-pink-400 to-rose-600" onClick={() => goTab('refunds')} />
          </div>
        </div>
      </motion.section>

      <nav aria-label="Payment sections" className="sticky top-0 z-20 -mx-1 overflow-x-auto rounded-2xl border border-border bg-card/85 p-1.5 shadow-sm backdrop-blur-md">
        <div role="tablist" className="flex min-w-max gap-1">
          {TABS.map(({ id, label, icon: Icon }) => {
            const on = tab === id
            return (
              <button key={id} type="button" role="tab" aria-selected={on} onClick={() => goTab(id)}
                className={cn('relative flex items-center gap-1.5 rounded-xl px-3.5 py-2 text-[13px] font-medium transition-colors', on ? 'text-white' : 'text-muted-foreground hover:bg-muted hover:text-foreground')}>
                {on && <motion.span layoutId="pay-tab-pill" className="absolute inset-0 rounded-xl bg-gradient-to-r from-violet-600 to-fuchsia-600 shadow-md shadow-violet-500/25" transition={{ type: 'spring', stiffness: 480, damping: 36 }} />}
                <Icon className="relative h-4 w-4" />
                <span className="relative">{label}</span>
                {id === 'refunds' && attention > 0 && (
                  <span className={cn('relative rounded-full px-1.5 text-[10px] font-bold tabular-nums', on ? 'bg-white/25 text-white' : 'bg-amber-500 text-white')}>{attention}</span>
                )}
              </button>
            )
          })}
        </div>
      </nav>

      <motion.div key={tab} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.25 }}>
        <ErrorBoundary key={tab} fallback={<TabError />}>
          {tab === 'all' && <PaymentFeed key="all" mode="all" />}
          {tab === 'refunds' && <PaymentFeed key="refunds" mode="refunds" />}
          {tab === 'insights' && <PaymentInsights data={o} loading={overview.isLoading} days={days} onDays={setDays} />}
        </ErrorBoundary>
      </motion.div>
    </div>
  )
}

export default PaymentsPage
