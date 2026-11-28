import { useState } from 'react'
import { useNavigate } from '@tanstack/react-router'
import { motion } from 'framer-motion'
import { BarChart3, Inbox, IndianRupee, Plus, Radio, Ticket, TicketPercent, Users, type LucideIcon } from 'lucide-react'
import { ErrorBoundary } from '@/components/common/ErrorBoundary'
import { TabError } from '@/components/common/TabError'
import { cn } from '@/lib/utils'
import { AnimatedNumber } from '@/features/dashboard/components/dashboard-ui'
import { formatInrShort } from '@/features/vendors/utils/vendor-meta'
import { useCouponOverview, type CouponRow } from './api/coupon-insights.api'
import { CouponEditor } from './components/CouponEditor'
import { CouponGrid, CouponRequests } from './components/CouponLists'
import { CouponInsights } from './components/CouponInsights'
import type { CouponsTab } from './utils/coupon-meta'

const TABS: { id: CouponsTab; label: string; icon: LucideIcon }[] = [
  { id: 'coupons', label: 'Coupons', icon: Ticket },
  { id: 'requests', label: 'Store requests', icon: Inbox },
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

export function CouponsPage({ tab = 'coupons' }: { tab?: CouponsTab }) {
  const navigate = useNavigate()
  const [days, setDays] = useState(30)
  const [editing, setEditing] = useState<CouponRow | null | undefined>(undefined)
  const overview = useCouponOverview(days)
  const o = overview.data
  const waiting = Number(o?.states?.WAITING ?? 0)
  const goTab = (id: CouponsTab) => void navigate({ to: '/coupons', search: { tab: id === 'coupons' ? undefined : id }, replace: true })

  return (
    <div className="flex flex-col gap-5 p-4 sm:p-6">
      <motion.section initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}
        className="relative overflow-hidden rounded-3xl bg-[#0b0c10] p-6 text-white shadow-xl shadow-black/10 sm:p-7">
        <div className="auth-aurora pointer-events-none absolute inset-0 opacity-70" aria-hidden><span /><span /><span /></div>
        <div className="auth-grid pointer-events-none absolute inset-0" aria-hidden />
        <TicketPercent className="auth-float pointer-events-none absolute -right-6 -top-4 h-44 w-44 text-white/[0.04]" aria-hidden />
        <div className="relative z-10 flex flex-col gap-6">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div className="flex items-start gap-4">
              <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-orange-300 via-[#ff4d1c] to-[#e01a00] shadow-lg shadow-orange-600/40"><TicketPercent className="h-6 w-6" /></span>
              <div>
                <h1 className="text-2xl font-bold tracking-tight">Coupons</h1>
                <p className="mt-1 max-w-xl text-sm text-white/60">Discount codes customers type when they buy a card. Make Strike-wide offers, approve the ones stores ask for, and see what each one brought in.</p>
              </div>
            </div>
            <motion.button type="button" whileHover={{ y: -2 }} whileTap={{ scale: 0.97 }} onClick={() => setEditing(null)}
              className="inline-flex items-center gap-2 rounded-xl bg-white px-4 py-2.5 text-sm font-semibold text-[#0b0c10] shadow-lg">
              <Plus className="h-4 w-4" /> New coupon
            </motion.button>
          </div>
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 xl:grid-cols-5">
            <HeaderStat icon={Radio} label="Live right now" value={o?.states?.LIVE} hint={o ? `${o.states?.SCHEDULED ?? 0} starting later` : undefined} tone="bg-gradient-to-br from-emerald-400 to-teal-600" />
            <HeaderStat icon={Ticket} label="Used this month" value={o?.uses_month} hint={o ? `${o.uses_all ?? 0} all time` : undefined} tone="bg-gradient-to-br from-orange-400 to-red-600" onClick={() => goTab('insights')} />
            <HeaderStat icon={IndianRupee} label="Customers saved this month" value={o?.discount_month} money hint={o ? `${formatInrShort(o.discount_all ?? 0)} all time` : undefined} tone="bg-gradient-to-br from-sky-400 to-indigo-600" />
            <HeaderStat icon={Users} label={`Customers, last ${days} days`} value={o?.customers} tone="bg-gradient-to-br from-pink-400 to-rose-600" />
            <HeaderStat icon={Inbox} label="Store requests waiting" value={o ? waiting : undefined} pulse={waiting > 0} tone="bg-gradient-to-br from-amber-400 to-orange-600" onClick={() => goTab('requests')} />
          </div>
        </div>
      </motion.section>

      <nav aria-label="Coupon sections" className="sticky top-0 z-20 -mx-1 overflow-x-auto rounded-2xl border border-border bg-card/85 p-1.5 shadow-sm backdrop-blur-md">
        <div role="tablist" className="flex min-w-max gap-1">
          {TABS.map(({ id, label, icon: Icon }) => {
            const on = tab === id
            return (
              <button key={id} type="button" role="tab" aria-selected={on} onClick={() => goTab(id)}
                className={cn('relative flex items-center gap-1.5 rounded-xl px-3.5 py-2 text-[13px] font-medium transition-colors', on ? 'text-white' : 'text-muted-foreground hover:bg-muted hover:text-foreground')}>
                {on && <motion.span layoutId="cpn-tab-pill" className="absolute inset-0 rounded-xl bg-gradient-to-r from-[#e01a00] to-[#ff6a00] shadow-md shadow-red-500/25" transition={{ type: 'spring', stiffness: 480, damping: 36 }} />}
                <Icon className="relative h-4 w-4" />
                <span className="relative">{label}</span>
                {id === 'requests' && waiting > 0 && <span className={cn('relative rounded-full px-1.5 text-[10px] font-bold', on ? 'bg-white/25 text-white' : 'bg-amber-500 text-white')}>{waiting}</span>}
              </button>
            )
          })}
        </div>
      </nav>

      <motion.div key={tab} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.25 }}>
        <ErrorBoundary key={tab} fallback={<TabError />}>
          {tab === 'coupons' && <CouponGrid counts={o?.states} onEdit={setEditing} />}
          {tab === 'requests' && <CouponRequests />}
          {tab === 'insights' && <CouponInsights data={o} loading={overview.isLoading} days={days} onDays={setDays} />}
        </ErrorBoundary>
      </motion.div>

      <CouponEditor open={editing !== undefined} coupon={editing} onClose={() => setEditing(undefined)} />
    </div>
  )
}

export default CouponsPage
