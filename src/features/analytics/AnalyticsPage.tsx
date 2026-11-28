import { useMemo, useState } from 'react'
import { motion } from 'framer-motion'
import {
  BadgePercent, BarChart3, CalendarRange, CreditCard, Download, Flame, Grid3x3, HandCoins, IndianRupee, PieChart as PieIcon, Receipt, RefreshCw,
  RotateCcw, ShoppingBag, Store, Tags, TicketPercent, TrendingUp, UserPlus, Users, Wallet, Waves,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { Panel } from '@/features/dashboard/components/dashboard-ui'
import { staggerContainer } from '@/features/dashboard/utils/dashboard-format'
import { formatInrFull, formatInrShort } from '@/features/vendors/utils/vendor-meta'
import { downloadCsv } from '@/features/onboarding/csv'
import { SERIES, useAnalyticsInsights, type SeriesMetric } from './api/analytics-insights.api'
import {
  CompareChart, Delta, DonutCard, Funnel, Heatmap, KpiTile, MiniStat, PriceBands, TopVendors,
} from './components/AnalyticsCharts'
import { METRICS, bucketLabel, change } from './utils/analytics-format'

type Preset = '7d' | '30d' | '90d' | 'month' | '12m' | 'custom'
const PRESETS: { id: Preset; label: string }[] = [
  { id: '7d', label: '7 days' }, { id: '30d', label: '30 days' }, { id: '90d', label: '90 days' },
  { id: 'month', label: 'This month' }, { id: '12m', label: '12 months' }, { id: 'custom', label: 'Custom' },
]

const iso = (d: Date) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
function rangeFor(p: Preset): { from: string; to: string } {
  const to = new Date()
  const from = new Date()
  if (p === '7d') from.setDate(to.getDate() - 6)
  else if (p === '30d') from.setDate(to.getDate() - 29)
  else if (p === '90d') from.setDate(to.getDate() - 89)
  else if (p === 'month') from.setDate(1)
  else if (p === '12m') { from.setFullYear(to.getFullYear() - 1); from.setDate(from.getDate() + 1) }
  return { from: iso(from), to: iso(to) }
}

const OUTCOME: Record<string, { label: string; color: string }> = {
  ACTIVE: { label: 'Still in use', color: SERIES[0] },
  EXHAUSTED: { label: 'Fully used', color: SERIES[2] },
  EXPIRED: { label: 'Expired', color: SERIES[3] },
  CANCELLED: { label: 'Cancelled', color: SERIES[7] },
}

export function AnalyticsPage() {
  const [preset, setPreset] = useState<Preset>('30d')
  const [custom, setCustom] = useState(rangeFor('30d'))
  const [metric, setMetric] = useState<SeriesMetric>('revenue')
  const range = preset === 'custom' ? custom : rangeFor(preset)
  const q = useAnalyticsInsights(range.from, range.to)
  const d = q.data
  const c = d?.current ?? {}
  const p = d?.previous ?? {}
  const loading = q.isLoading
  const spark = (k: SeriesMetric) => (d?.series ?? []).map((r) => Number(r[k] ?? 0))
  const returningPct = c.buyers ? Math.round(((c.returningBuyers ?? 0) / c.buyers) * 100) : 0
  const redeemPct = c.walletIssued ? Math.round(((c.redeemedAmount ?? 0) / c.walletIssued) * 100) : 0
  const takeRate = c.revenue ? Math.round(((c.strikeEarnings ?? 0) / c.revenue) * 1000) / 10 : 0

  const exportCsv = () => {
    if (!d) return
    downloadCsv(`strike-analytics-${d.from}-to-${d.to}.csv`, [
      ['Strike analytics', `${d.from} to ${d.to}`, `compared with ${d.previousFrom} to ${d.previousTo}`],
      [],
      ['Measure', 'This period', 'Previous period', 'Change %'],
      ...([
        ['Revenue (₹)', 'revenue'], ['Strike earnings (₹)', 'strikeEarnings'], ['Cards sold', 'cardsSold'], ['Average order (₹)', 'averageOrder'],
        ['Buyers', 'buyers'], ['Returning buyers', 'returningBuyers'], ['New customers', 'newCustomers'], ['New vendors', 'newVendors'],
        ['Wallet money spent (₹)', 'redeemedAmount'], ['Redemptions', 'redemptions'], ['Refunds', 'refunds'], ['Refunded (₹)', 'refundedAmount'],
        ['Discounts given (₹)', 'discounts'], ['Paid out to vendors (₹)', 'paidOut'],
      ] as const).map(([label, k]) => [label, c[k] ?? 0, p[k] ?? 0, change(c[k], p[k]) ?? 'new']),
      [],
      [`Per ${d.bucket}`, ...METRICS.map((m) => m.label), ...METRICS.map((m) => `${m.label} (previous)`)],
      ...d.series.map((r) => [r.key, ...METRICS.map((m) => r[m.id]), ...METRICS.map((m) => r[`prev_${m.id}`])]),
    ])
  }

  const paymentRows = useMemo(() => (d?.paymentMethods ?? []).map((m, i) => ({ name: m.name === 'PAY_AT_STORE' ? 'Paid at store' : 'Online', value: Number(m.amount), color: SERIES[i] })), [d])
  const storeRows = useMemo(() => (d?.storeTypes ?? []).map((m) => ({ name: m.name, value: Number(m.amount) })), [d])
  const outcomeRows = useMemo(() => (d?.cardOutcomes ?? []).map((m) => ({ name: OUTCOME[m.name]?.label ?? m.name, value: m.count, color: OUTCOME[m.name]?.color })), [d])

  return (
    <motion.div variants={staggerContainer} initial="hidden" animate="show" className="flex flex-col gap-5 p-4 sm:p-6">
      <motion.section initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}
        className="relative overflow-hidden rounded-3xl bg-[#0b0c10] p-6 text-white shadow-xl shadow-black/10 sm:p-7">
        <div className="auth-aurora pointer-events-none absolute inset-0 opacity-70" aria-hidden><span /><span /><span /></div>
        <div className="auth-grid pointer-events-none absolute inset-0" aria-hidden />
        <BarChart3 className="auth-float pointer-events-none absolute -right-4 -top-4 h-44 w-44 text-white/[0.04]" aria-hidden />
        <div className="relative z-10 flex flex-col gap-5">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
            <div className="flex items-start gap-4">
              <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-sky-300 via-blue-500 to-indigo-700 shadow-lg shadow-blue-600/40"><TrendingUp className="h-6 w-6" /></span>
              <div>
                <h1 className="text-2xl font-bold tracking-tight">Analytics</h1>
                <p className="mt-1 max-w-xl text-sm text-white/60">
                  How Strike is doing — every number compared with the period just before.
                  {d && <span className="text-white/80"> {bucketLabel(d.from, 'day')} – {bucketLabel(d.to, 'day')} vs {bucketLabel(d.previousFrom, 'day')} – {bucketLabel(d.previousTo, 'day')}.</span>}
                </p>
              </div>
            </div>
            <div className="flex gap-2 self-start">
              <button type="button" onClick={() => void q.refetch()} aria-label="Refresh" className="flex h-9 w-9 items-center justify-center rounded-xl border border-white/15 bg-white/[0.06] text-white/80 hover:bg-white/[0.12]">
                <RefreshCw className={cn('h-4 w-4', q.isFetching && 'animate-spin')} />
              </button>
              <button type="button" onClick={exportCsv} disabled={!d} className="flex h-9 items-center gap-2 rounded-xl border border-white/15 bg-white/[0.06] px-3 text-sm font-semibold text-white hover:bg-white/[0.12] disabled:opacity-50">
                <Download className="h-4 w-4" /> Export CSV
              </button>
            </div>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <div className="flex flex-wrap gap-1 rounded-2xl border border-white/10 bg-white/[0.06] p-1 backdrop-blur-md">
              {PRESETS.map((x) => (
                <button key={x.id} type="button" onClick={() => setPreset(x.id)}
                  className={cn('relative rounded-xl px-3 py-1.5 text-xs font-semibold transition-colors', preset === x.id ? 'text-black' : 'text-white/70 hover:text-white')}>
                  {preset === x.id && <motion.span layoutId="an-preset" className="absolute inset-0 rounded-xl bg-white shadow" transition={{ type: 'spring', stiffness: 500, damping: 35 }} />}
                  <span className="relative">{x.label}</span>
                </button>
              ))}
            </div>
            {preset === 'custom' && (
              <motion.div initial={{ opacity: 0, x: -8 }} animate={{ opacity: 1, x: 0 }} className="flex items-center gap-2 text-xs text-white/70">
                <CalendarRange className="h-4 w-4" />
                <input type="date" value={custom.from} max={custom.to} onChange={(e) => setCustom((s) => ({ ...s, from: e.target.value }))} className="h-9 rounded-lg border border-white/15 bg-white/10 px-2 text-white [color-scheme:dark]" />
                to
                <input type="date" value={custom.to} min={custom.from} onChange={(e) => setCustom((s) => ({ ...s, to: e.target.value }))} className="h-9 rounded-lg border border-white/15 bg-white/10 px-2 text-white [color-scheme:dark]" />
              </motion.div>
            )}
          </div>
        </div>
      </motion.section>

      <motion.div variants={staggerContainer} className="grid grid-cols-2 gap-3 md:grid-cols-3 xl:grid-cols-6">
        <KpiTile label="Revenue" icon={IndianRupee} tone="from-blue-400 to-indigo-600" now={c.revenue} before={p.revenue} money spark={spark('revenue')} loading={loading} onClick={() => setMetric('revenue')} active={metric === 'revenue'} />
        <KpiTile label="Strike earnings" icon={BadgePercent} tone="from-emerald-400 to-teal-600" now={c.strikeEarnings} before={p.strikeEarnings} money spark={spark('earnings')} hint={`${takeRate}% of revenue`} loading={loading} onClick={() => setMetric('earnings')} active={metric === 'earnings'} />
        <KpiTile label="Cards sold" icon={ShoppingBag} tone="from-orange-400 to-rose-600" now={c.cardsSold} before={p.cardsSold} spark={spark('sold')} loading={loading} onClick={() => setMetric('sold')} active={metric === 'sold'} />
        <KpiTile label="Wallet money spent" icon={HandCoins} tone="from-amber-400 to-orange-600" now={c.redeemedAmount} before={p.redeemedAmount} money spark={spark('redeemed')} hint={`${c.redemptions ?? 0} redemptions`} loading={loading} onClick={() => setMetric('redeemed')} active={metric === 'redeemed'} />
        <KpiTile label="New customers" icon={UserPlus} tone="from-pink-400 to-fuchsia-600" now={c.newCustomers} before={p.newCustomers} spark={spark('customers')} loading={loading} onClick={() => setMetric('customers')} active={metric === 'customers'} />
        <KpiTile label="Average order" icon={Receipt} tone="from-violet-400 to-purple-600" now={c.averageOrder} before={p.averageOrder} money loading={loading} />
        <KpiTile label="Buyers" icon={Users} tone="from-sky-400 to-blue-600" now={c.buyers} before={p.buyers} hint={`${returningPct}% came back`} loading={loading} />
        <KpiTile label="Stores that sold" icon={Store} tone="from-lime-400 to-green-600" now={c.sellingStores} before={p.sellingStores} loading={loading} />
        <KpiTile label="New vendors" icon={Flame} tone="from-rose-400 to-red-600" now={c.newVendors} before={p.newVendors} loading={loading} />
        <KpiTile label="Paid out to vendors" icon={Wallet} tone="from-teal-400 to-cyan-600" now={c.paidOut} before={p.paidOut} money loading={loading} />
        <KpiTile label="Discounts given" icon={TicketPercent} tone="from-yellow-400 to-amber-600" now={c.discounts} before={p.discounts} money invert loading={loading} />
        <KpiTile label="Refunds" icon={RotateCcw} tone="from-slate-400 to-slate-600" now={c.refunds} before={p.refunds} invert hint={formatInrFull(c.refundedAmount)} loading={loading} />
      </motion.div>

      <CompareChart data={d} loading={loading} metric={metric} onMetric={setMetric} />

      <div className="grid grid-cols-1 gap-5 lg:grid-cols-3">
        <DonutCard title="How customers pay" subtitle="Revenue by payment method" icon={<PieIcon className="h-4 w-4" />} rows={paymentRows} loading={loading} money />
        <DonutCard title="Revenue by store type" subtitle="Which kinds of stores sell most" icon={<Store className="h-4 w-4" />} rows={storeRows} loading={loading} money />
        <DonutCard title="What happened to cards sold" subtitle="Cards bought in this period, today" icon={<CreditCard className="h-4 w-4" />} rows={outcomeRows} loading={loading} />
      </div>

      <div className="grid grid-cols-1 gap-5 xl:grid-cols-3">
        <Panel title="Customer journey" subtitle="People who signed up in this period" icon={<Waves className="h-4 w-4" />} className="h-full">
          <Funnel rows={d?.funnel ?? []} loading={loading} />
        </Panel>
        <Panel title="When cards are bought" subtitle="Purchases by weekday and hour (India time) — hover a square" icon={<Grid3x3 className="h-4 w-4" />} className="h-full xl:col-span-2">
          <Heatmap cells={d?.heatmap ?? []} loading={loading} />
        </Panel>
      </div>

      <div className="grid grid-cols-1 gap-5 xl:grid-cols-3">
        <Panel title="Top vendors" subtitle="Revenue this period, with change vs the period before" icon={<TrendingUp className="h-4 w-4" />} className="h-full">
          <TopVendors rows={d?.topVendors ?? []} loading={loading} />
        </Panel>
        <Panel title="Card prices people pay" subtitle="Number of cards sold in each price range" icon={<Tags className="h-4 w-4" />} className="h-full">
          <PriceBands rows={d?.priceBands ?? []} loading={loading} />
          <div className="mt-4 flex flex-col gap-1.5">
            <p className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">Best-selling cards</p>
            {(d?.topCards ?? []).length === 0 ? <p className="text-xs text-muted-foreground">—</p> : d!.topCards.map((t, i) => (
              <div key={t.name} className="flex items-center justify-between gap-2 rounded-lg bg-muted/40 px-3 py-1.5 text-xs">
                <span className="flex min-w-0 items-center gap-2"><span className="w-3 text-muted-foreground">{i + 1}</span><span className="truncate font-medium text-foreground">{t.name}</span></span>
                <span className="shrink-0 tabular-nums text-muted-foreground"><b className="text-foreground">{formatInrShort(t.amount)}</b> · {t.count}</span>
              </div>
            ))}
          </div>
        </Panel>
        <Panel title="Money flow" subtitle="Where this period’s money went" icon={<Wallet className="h-4 w-4" />} className="h-full">
          <div className="grid grid-cols-2 gap-2">
            <MiniStat label="Customers paid" value={formatInrShort(c.revenue)} sub={<Delta value={change(c.revenue, p.revenue)} />} />
            <MiniStat label="Strike kept" value={formatInrShort(c.strikeEarnings)} sub={`${takeRate}% take rate`} />
            <MiniStat label="Loaded on wallets" value={formatInrShort(c.walletIssued)} sub="what cards give to spend" />
            <MiniStat label="Spent at stores" value={formatInrShort(c.redeemedAmount)} sub={`${redeemPct}% of loaded`} />
            <MiniStat label="Paid out to vendors" value={formatInrShort(c.paidOut)} sub={<Delta value={change(c.paidOut, p.paidOut)} />} />
            <MiniStat label="Refunded" value={formatInrShort(c.refundedAmount)} sub={`${c.refunds ?? 0} refunds`} />
          </div>
          <div className="mt-4">
            <p className="mb-1.5 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">Coupons used</p>
            {(d?.coupons ?? []).length === 0 ? <p className="text-xs text-muted-foreground">No coupons used in this period</p> : (
              <ul className="flex flex-col gap-1.5">
                {d!.coupons.map((cp) => (
                  <li key={cp.code} className="flex items-center justify-between gap-2 rounded-lg border border-dashed border-border px-3 py-1.5 text-xs">
                    <span className="font-mono font-semibold text-foreground">{cp.code}</span>
                    <span className="tabular-nums text-muted-foreground">{cp.uses}× · <b className="text-foreground">−{formatInrShort(cp.discount)}</b></span>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </Panel>
      </div>
    </motion.div>
  )
}

export default AnalyticsPage
