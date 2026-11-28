import { useState } from 'react'
import { motion } from 'framer-motion'
import { Area, Bar, BarChart, CartesianGrid, ComposedChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'
import { AlertTriangle, CheckCircle2, Clock, CreditCard, Gift, IndianRupee, PieChart as PieIcon, RotateCcw, ShoppingBag, TrendingUp, Users, XCircle } from 'lucide-react'
import { cn } from '@/lib/utils'
import { Panel } from '@/features/dashboard/components/dashboard-ui'
import { staggerContainer } from '@/features/dashboard/utils/dashboard-format'
import { DonutCard, KpiTile } from '@/features/analytics/components/AnalyticsCharts'
import { SERIES } from '@/features/analytics/api/analytics-insights.api'
import { formatInrShort } from '@/features/vendors/utils/vendor-meta'
import type { PaymentOverview } from '../api/payment-insights.api'
import { REFUND_METHOD, money, reasonLabel } from '../utils/payment-meta'

const axis = { fontSize: 11, fill: 'var(--color-muted-foreground)' }
const dayLabel = (d: string) => new Date(`${d}T00:00:00`).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })
const hourLabel = (h: number) => (h === 0 ? '12a' : h < 12 ? `${h}a` : h === 12 ? '12p' : `${h - 12}p`)

function MoneyChart({ data, loading }: { data: PaymentOverview | undefined; loading: boolean }) {
  const rows = data?.series ?? []
  const collected = rows.reduce((s, r) => s + Number(r.collected), 0)
  const refunded = rows.reduce((s, r) => s + Number(r.refunded), 0)
  return (
    <Panel title="Money in and refunds" subtitle={`Each day, last ${data?.days ?? 30} days (India time)`} icon={<TrendingUp className="h-4 w-4" />} className="xl:col-span-2">
      <div className="mb-3 flex flex-wrap gap-4 text-xs">
        <span className="inline-flex items-center gap-1.5"><span className="h-2.5 w-2.5 rounded-sm bg-[#257de0]" />Collected <b className="text-foreground">{money(collected)}</b></span>
        <span className="inline-flex items-center gap-1.5"><span className="h-2.5 w-2.5 rounded-sm bg-[#f47230]" />Refunded <b className="text-foreground">{money(refunded)}</b></span>
      </div>
      <div className="h-64">
        {loading ? <div className="h-full animate-pulse rounded-xl bg-muted" /> : (
          <ResponsiveContainer width="100%" height="100%">
            <ComposedChart data={rows} margin={{ top: 4, right: 4, left: 0, bottom: 0 }}>
              <defs>
                <linearGradient id="payIn" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor="#257de0" stopOpacity={0.28} /><stop offset="100%" stopColor="#257de0" stopOpacity={0} /></linearGradient>
              </defs>
              <CartesianGrid vertical={false} stroke="var(--color-border)" strokeDasharray="3 3" />
              <XAxis dataKey="day" tickFormatter={dayLabel} tickLine={false} axisLine={false} tick={axis} minTickGap={24} />
              <YAxis tickFormatter={(v: number) => formatInrShort(v)} tickLine={false} axisLine={false} width={58} tick={axis} />
              <Tooltip cursor={{ stroke: 'var(--color-muted-foreground)', strokeDasharray: '4 4' }}
                content={({ active, payload, label }) => {
                  if (!active || !payload?.length) return null
                  const r = payload[0].payload as NonNullable<PaymentOverview['series']>[number]
                  return (
                    <div className="rounded-xl border border-border bg-popover px-3 py-2 text-xs shadow-lg">
                      <p className="mb-1 font-semibold text-foreground">{dayLabel(String(label))}</p>
                      <p><span className="mr-1 inline-block h-2 w-2 rounded-full bg-[#257de0]" />Collected {money(r.collected)} · {r.count} sale{Number(r.count) === 1 ? '' : 's'}</p>
                      <p className="pl-3 text-muted-foreground">online {money(r.online)} · at store {money(r.store)}</p>
                      <p><span className="mr-1 inline-block h-2 w-2 rounded-full bg-[#f47230]" />Refunded {money(r.refunded)}</p>
                    </div>
                  )
                }} />
              <Area type="monotone" dataKey="collected" stroke="#257de0" strokeWidth={2} fill="url(#payIn)" animationDuration={900} />
              <Bar dataKey="refunded" fill="#f47230" radius={[4, 4, 0, 0]} maxBarSize={14} animationDuration={900} />
            </ComposedChart>
          </ResponsiveContainer>
        )}
      </div>
    </Panel>
  )
}

function Checkout({ data, loading }: { data: PaymentOverview | undefined; loading: boolean }) {
  const ok = Number(data?.attempts_success ?? 0)
  const failed = Number(data?.attempts_failed ?? 0)
  const gaveUp = Number(data?.attempts_abandoned ?? 0)
  const total = ok + failed + gaveUp
  const rate = total ? Math.round((ok / total) * 100) : null
  const rows = [
    { label: 'Paid', value: ok, color: '#00b894', icon: CheckCircle2 },
    { label: 'Failed', value: failed, color: '#ec4647', icon: XCircle },
    { label: 'Gave up / timed out', value: gaveUp, color: '#94a3b8', icon: Clock },
  ]
  return (
    <Panel title="Checkout success" subtitle="Of every checkout started" icon={<ShoppingBag className="h-4 w-4" />}>
      {loading ? <div className="h-48 animate-pulse rounded-xl bg-muted" /> : (
        <div className="flex flex-col gap-4">
          <div className="flex items-end gap-2">
            <span className="text-4xl font-bold tabular-nums text-foreground">{rate == null ? '—' : `${rate}%`}</span>
            <span className="pb-1 text-xs text-muted-foreground">{total ? `${ok} of ${total} checkouts paid` : 'No checkouts in this period'}</span>
          </div>
          <div className="flex h-3 overflow-hidden rounded-full bg-muted">
            {rows.map((r) => total > 0 && r.value > 0 && (
              <motion.div key={r.label} initial={{ width: 0 }} animate={{ width: `${(r.value / total) * 100}%` }} transition={{ type: 'spring', stiffness: 120, damping: 20 }}
                className="h-full first:rounded-l-full last:rounded-r-full [&:not(:first-child)]:ml-0.5" style={{ background: r.color }} title={`${r.label}: ${r.value}`} />
            ))}
          </div>
          <ul className="space-y-1.5">
            {rows.map((r) => (
              <li key={r.label} className="flex items-center justify-between rounded-lg px-2 py-1 text-xs hover:bg-muted/50">
                <span className="inline-flex items-center gap-1.5 text-muted-foreground"><span className="h-2.5 w-2.5 rounded-sm" style={{ background: r.color }} />{r.label}</span>
                <span className="font-semibold tabular-nums text-foreground">{r.value}{total ? ` · ${Math.round((r.value / total) * 100)}%` : ''}</span>
              </li>
            ))}
          </ul>
          {(data?.failureReasons?.length ?? 0) > 0 && (
            <div>
              <p className="mb-1.5 text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">Why payments failed</p>
              <ul className="space-y-1">
                {data!.failureReasons!.map((f) => (
                  <li key={f.reason} className="flex items-start justify-between gap-3 text-xs">
                    <span className="line-clamp-2 text-foreground/80">{f.reason}</span><span className="font-semibold tabular-nums">{f.count}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}
    </Panel>
  )
}

function Hours({ data, loading }: { data: PaymentOverview | undefined; loading: boolean }) {
  const rows = Array.from({ length: 24 }, (_, h) => ({ hour: h, count: Number(data?.hours?.find((x) => Number(x.hour) === h)?.count ?? 0) }))
  const peak = rows.reduce((a, b) => (b.count > a.count ? b : a), rows[0])
  return (
    <Panel title="When people pay" subtitle={peak.count ? `Busiest around ${hourLabel(peak.hour)}` : 'Hour of day, India time'} icon={<Clock className="h-4 w-4" />}>
      <div className="h-44">
        {loading ? <div className="h-full animate-pulse rounded-xl bg-muted" /> : (
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={rows} margin={{ top: 4, right: 0, left: -24, bottom: 0 }}>
              <XAxis dataKey="hour" tickFormatter={hourLabel} tickLine={false} axisLine={false} tick={{ ...axis, fontSize: 10 }} interval={2} />
              <YAxis allowDecimals={false} tickLine={false} axisLine={false} tick={axis} />
              <Tooltip cursor={{ fill: 'var(--color-muted)', opacity: 0.5 }} formatter={(v) => [`${v} payments`, '']} labelFormatter={(h) => `${hourLabel(Number(h))} – ${hourLabel((Number(h) + 1) % 24)}`} />
              <Bar dataKey="count" fill="#257de0" radius={[4, 4, 0, 0]} animationDuration={900} />
            </BarChart>
          </ResponsiveContainer>
        )}
      </div>
    </Panel>
  )
}

function ListPanel({ title, subtitle, icon, rows, empty }: { title: string; subtitle: string; icon: React.ReactNode; rows: { label: string; value: string; share: number; sub?: string }[]; empty: string }) {
  const [hover, setHover] = useState<string | null>(null)
  return (
    <Panel title={title} subtitle={subtitle} icon={icon}>
      {rows.length === 0 ? <p className="py-8 text-center text-sm text-muted-foreground">{empty}</p> : (
        <ul className="space-y-2.5">
          {rows.map((r, i) => (
            <li key={r.label} onMouseEnter={() => setHover(r.label)} onMouseLeave={() => setHover(null)} className={cn('rounded-lg px-1.5 py-1 transition-colors', hover === r.label && 'bg-muted/50')}>
              <div className="mb-1 flex items-center justify-between gap-3 text-xs">
                <span className="truncate font-medium text-foreground">{r.label}</span>
                <span className="shrink-0 tabular-nums text-muted-foreground">{r.sub ? `${r.sub} · ` : ''}<b className="text-foreground">{r.value}</b></span>
              </div>
              <div className="h-1.5 overflow-hidden rounded-full bg-muted">
                <motion.div initial={{ width: 0 }} animate={{ width: `${Math.max(3, r.share * 100)}%` }} transition={{ delay: i * 0.05, type: 'spring', stiffness: 120, damping: 20 }} className="h-full rounded-full bg-[#257de0]" />
              </div>
            </li>
          ))}
        </ul>
      )}
    </Panel>
  )
}

export function PaymentInsights({ data, loading, days, onDays }: { data: PaymentOverview | undefined; loading: boolean; days: number; onDays: (d: number) => void }) {
  const spark = (data?.series ?? []).map((r) => Number(r.collected))
  const refundRate = Number(data?.collected_period ?? 0) > 0 ? (Number(data?.refunded_period ?? 0) / Number(data?.collected_period)) * 100 : 0
  const topMax = Math.max(1, ...(data?.topCards ?? []).map((c) => Number(c.amount)))
  const reasonMax = Math.max(1, ...(data?.refundReasons ?? []).map((c) => Number(c.count)))
  return (
    <motion.div variants={staggerContainer} initial="hidden" animate="show" className="flex flex-col gap-5">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <p className="text-sm text-muted-foreground">Compared with the {days} days before</p>
        <div className="flex gap-1 rounded-xl border border-border bg-card p-1">
          {[7, 30, 90, 365].map((d) => (
            <button key={d} type="button" onClick={() => onDays(d)}
              className={cn('rounded-lg px-3 py-1 text-xs font-medium transition-colors', days === d ? 'bg-foreground text-background' : 'text-muted-foreground hover:bg-muted')}>
              {d === 365 ? '12 months' : `${d} days`}
            </button>
          ))}
        </div>
      </div>

      <motion.div variants={staggerContainer} className="grid grid-cols-2 gap-3 md:grid-cols-3 xl:grid-cols-6">
        <KpiTile label="Collected" icon={IndianRupee} tone="from-sky-400 to-indigo-600" money now={data?.collected_period} before={data?.collected_previous} spark={spark} loading={loading} />
        <KpiTile label="Card sales" icon={ShoppingBag} tone="from-emerald-400 to-teal-600" now={data?.paid_period} before={data?.paid_previous} loading={loading} />
        <KpiTile label="Paying customers" icon={Users} tone="from-pink-400 to-rose-600" now={data?.buyers_period} loading={loading} />
        <KpiTile label="Refunded" icon={RotateCcw} tone="from-violet-500 to-fuchsia-600" money now={data?.refunded_period} invert loading={loading}
          hint={`${data?.refunds_period ?? 0} refunds · ${refundRate.toFixed(1)}% of money in`} />
        <KpiTile label="Discounts given" icon={Gift} tone="from-amber-400 to-orange-600" money now={data?.discounts_period} loading={loading} />
        <KpiTile label="Average sale" icon={CreditCard} tone="from-cyan-400 to-blue-600" money
          now={data && Number(data.paid_period) ? Number(data.collected_period) / Number(data.paid_period) : 0}
          before={data && Number(data.paid_previous) ? Number(data.collected_previous) / Number(data.paid_previous) : undefined} loading={loading} />
      </motion.div>

      <div className="grid gap-5 xl:grid-cols-3">
        <MoneyChart data={data} loading={loading} />
        <Checkout data={data} loading={loading} />
      </div>

      <div className="grid gap-5 lg:grid-cols-2 xl:grid-cols-3">
        <DonutCard title="How customers pay" subtitle="Money collected in this period" icon={<PieIcon className="h-4 w-4" />} loading={loading} money
          rows={(data?.methods ?? []).map((m, i) => ({ name: m.method === 'PAY_AT_STORE' ? 'At the store' : 'Online (Razorpay)', value: Number(m.amount), color: SERIES[i] }))} />
        <DonutCard title="How refunds were paid back" subtitle="All time" icon={<RotateCcw className="h-4 w-4" />} loading={loading} money
          rows={(data?.refundMethods ?? []).map((m, i) => ({ name: REFUND_METHOD[m.method as keyof typeof REFUND_METHOD]?.short ?? m.method, value: Number(m.amount), color: SERIES[i] }))} />
        <Hours data={data} loading={loading} />
      </div>

      <div className="grid gap-5 lg:grid-cols-2">
        <ListPanel title="Best-selling cards" subtitle="Money collected in this period" icon={<CreditCard className="h-4 w-4" />} empty="No sales in this period."
          rows={(data?.topCards ?? []).map((c) => ({ label: c.name, value: money(c.amount), sub: `${c.count} sold`, share: Number(c.amount) / topMax }))} />
        <ListPanel title="Why refunds happen" subtitle="All time" icon={<AlertTriangle className="h-4 w-4" />} empty="No refunds yet."
          rows={(data?.refundReasons ?? []).map((r) => ({ label: reasonLabel(r.reason), value: `${r.count}`, sub: money(r.amount), share: Number(r.count) / reasonMax }))} />
      </div>
    </motion.div>
  )
}
