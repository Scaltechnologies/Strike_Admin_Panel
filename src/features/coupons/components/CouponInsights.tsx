import { Link } from '@tanstack/react-router'
import { motion } from 'framer-motion'
import { Area, CartesianGrid, ComposedChart, Line, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'
import { AlarmClock, Gauge, IndianRupee, PieChart as PieIcon, Sparkles, Ticket, TrendingUp, Trophy, Users } from 'lucide-react'
import { cn } from '@/lib/utils'
import { Panel } from '@/features/dashboard/components/dashboard-ui'
import { staggerContainer } from '@/features/dashboard/utils/dashboard-format'
import { DonutCard, KpiTile } from '@/features/analytics/components/AnalyticsCharts'
import { formatInrShort } from '@/features/vendors/utils/vendor-meta'
import type { CouponOverview, CouponState } from '../api/coupon-insights.api'
import { STATE_META, money } from '../utils/coupon-meta'

const axis = { fontSize: 11, fill: 'var(--color-muted-foreground)' }
const dayLabel = (d: string) => new Date(`${d}T00:00:00`).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })
const STATE_COLOR: Record<CouponState, string> = { LIVE: '#00b894', SCHEDULED: '#257de0', PAUSED: '#f2a600', USED_UP: '#6a4ce2', EXPIRED: '#94a3b8', WAITING: '#f47230', REJECTED: '#ec4647' }

export function CouponInsights({ data, loading, days, onDays }: { data: CouponOverview | undefined; loading: boolean; days: number; onDays: (d: number) => void }) {
  const series = data?.series ?? []
  const uses = Number(data?.uses ?? 0)
  const avg = uses ? Number(data?.discount ?? 0) / uses : 0
  const topMax = Math.max(1, ...(data?.top ?? []).map((t) => Number(t.uses)))
  return (
    <motion.div variants={staggerContainer} initial="hidden" animate="show" className="flex flex-col gap-5">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <p className="text-sm text-muted-foreground">Compared with the {days} days before</p>
        <div className="flex gap-1 rounded-xl border border-border bg-card p-1">
          {[7, 30, 90, 365].map((d) => (
            <button key={d} type="button" onClick={() => onDays(d)} className={cn('rounded-lg px-3 py-1 text-xs font-medium', days === d ? 'bg-foreground text-background' : 'text-muted-foreground hover:bg-muted')}>
              {d === 365 ? '12 months' : `${d} days`}
            </button>
          ))}
        </div>
      </div>

      <motion.div variants={staggerContainer} className="grid grid-cols-2 gap-3 md:grid-cols-3 xl:grid-cols-5">
        <KpiTile label="Times used" icon={Ticket} tone="from-orange-400 to-red-600" now={data?.uses} before={data?.uses_previous} spark={series.map((s) => Number(s.uses))} loading={loading} />
        <KpiTile label="Customers saved" icon={IndianRupee} tone="from-emerald-400 to-teal-600" money now={data?.discount} before={data?.discount_previous} loading={loading} />
        <KpiTile label="Sales with a coupon" icon={TrendingUp} tone="from-sky-400 to-indigo-600" money now={data?.revenue} before={data?.revenue_previous} loading={loading} />
        <KpiTile label="Customers who used one" icon={Users} tone="from-pink-400 to-rose-600" now={data?.customers} loading={loading} />
        <KpiTile label="Average saving" icon={Gauge} tone="from-violet-500 to-fuchsia-600" money now={avg} loading={loading} />
      </motion.div>

      <div className="grid gap-5 xl:grid-cols-3">
        <Panel title="Uses and savings each day" subtitle={`Last ${days} days, India time`} icon={<TrendingUp className="h-4 w-4" />} className="xl:col-span-2">
          <div className="mb-3 flex flex-wrap gap-4 text-xs">
            <span className="inline-flex items-center gap-1.5"><span className="h-2.5 w-2.5 rounded-sm bg-[#257de0]" />Sales with a coupon</span>
            <span className="inline-flex items-center gap-1.5"><span className="h-0.5 w-4 bg-[#f47230]" />Customers saved</span>
          </div>
          <div className="h-64">
            {loading ? <div className="h-full animate-pulse rounded-xl bg-muted" /> : (
              <ResponsiveContainer width="100%" height="100%">
                <ComposedChart data={series} margin={{ top: 4, right: 4, left: 0, bottom: 0 }}>
                  <defs><linearGradient id="cpnRev" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor="#257de0" stopOpacity={0.25} /><stop offset="100%" stopColor="#257de0" stopOpacity={0} /></linearGradient></defs>
                  <CartesianGrid vertical={false} stroke="var(--color-border)" strokeDasharray="3 3" />
                  <XAxis dataKey="day" tickFormatter={dayLabel} tickLine={false} axisLine={false} tick={axis} minTickGap={24} />
                  <YAxis tickFormatter={(v: number) => formatInrShort(v)} tickLine={false} axisLine={false} width={58} tick={axis} />
                  <Tooltip content={({ active, payload, label }) => {
                    if (!active || !payload?.length) return null
                    const r = payload[0].payload as NonNullable<CouponOverview['series']>[number]
                    return (
                      <div className="rounded-xl border border-border bg-popover px-3 py-2 text-xs shadow-lg">
                        <p className="mb-1 font-semibold">{dayLabel(String(label))}</p>
                        <p>{r.uses} use{Number(r.uses) === 1 ? '' : 's'}</p>
                        <p><span className="mr-1 inline-block h-2 w-2 rounded-full bg-[#257de0]" />Sales {money(r.revenue)}</p>
                        <p><span className="mr-1 inline-block h-2 w-2 rounded-full bg-[#f47230]" />Saved {money(r.discount)}</p>
                      </div>
                    )
                  }} />
                  <Area type="monotone" dataKey="revenue" stroke="#257de0" strokeWidth={2} fill="url(#cpnRev)" animationDuration={900} />
                  <Line type="monotone" dataKey="discount" stroke="#f47230" strokeWidth={2} dot={false} animationDuration={900} />
                </ComposedChart>
              </ResponsiveContainer>
            )}
          </div>
        </Panel>
        <DonutCard title="Coupons right now" subtitle={`${data?.total ?? 0} in total`} icon={<PieIcon className="h-4 w-4" />} loading={loading}
          rows={(Object.keys(STATE_COLOR) as CouponState[]).map((s) => ({ name: STATE_META[s].label, value: Number(data?.states?.[s] ?? 0), color: STATE_COLOR[s] }))} />
      </div>

      <div className="grid gap-5 lg:grid-cols-3">
        <Panel title="Most used" subtitle={`Last ${days} days`} icon={<Trophy className="h-4 w-4" />}>
          {(data?.top?.length ?? 0) === 0 ? <p className="py-8 text-center text-sm text-muted-foreground">No coupon was used in this period.</p> : (
            <ul className="space-y-2.5">
              {data!.top!.map((t, i) => (
                <li key={t.id}>
                  <Link to="/coupons/$couponId" params={{ couponId: String(t.id) }} className="block rounded-lg px-1.5 py-1 transition-colors hover:bg-muted/50">
                    <div className="mb-1 flex items-center justify-between gap-2 text-xs">
                      <span className="inline-flex min-w-0 items-center gap-2"><span className="text-muted-foreground">{i + 1}</span><span className="font-mono font-bold">{t.code}</span><span className="truncate text-muted-foreground">{t.title}</span></span>
                      <span className="shrink-0 tabular-nums"><b>{t.uses}</b> · {money(t.discount)} saved</span>
                    </div>
                    <div className="h-1.5 overflow-hidden rounded-full bg-muted">
                      <motion.div initial={{ width: 0 }} animate={{ width: `${(Number(t.uses) / topMax) * 100}%` }} transition={{ delay: i * 0.05, type: 'spring', stiffness: 120, damping: 20 }} className="h-full rounded-full bg-[#257de0]" />
                    </div>
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </Panel>
        <Panel title="Ending this week" subtitle="Live coupons that stop within 7 days" icon={<AlarmClock className="h-4 w-4" />}>
          {(data?.expiringSoon?.length ?? 0) === 0 ? <p className="py-8 text-center text-sm text-muted-foreground">Nothing ends this week.</p> : (
            <ul className="divide-y divide-border">
              {data!.expiringSoon!.map((c) => (
                <li key={c.id}><Link to="/coupons/$couponId" params={{ couponId: String(c.id) }} className="flex items-center justify-between gap-3 py-2 text-sm hover:text-primary">
                  <span className="min-w-0"><span className="font-mono font-bold">{c.code}</span> <span className="text-xs text-muted-foreground">{c.title}</span></span>
                  <span className="shrink-0 text-xs text-amber-700 dark:text-amber-300">{new Date(c.validUntil).toLocaleDateString('en-IN', { weekday: 'short', day: 'numeric', month: 'short' })}</span>
                </Link></li>
              ))}
            </ul>
          )}
        </Panel>
        <Panel title="Almost used up" subtitle="80% or more of the allowed customers" icon={<Sparkles className="h-4 w-4" />}>
          {(data?.nearlyUsedUp?.length ?? 0) === 0 ? <p className="py-8 text-center text-sm text-muted-foreground">No coupon is close to its limit.</p> : (
            <ul className="space-y-3">
              {data!.nearlyUsedUp!.map((c) => {
                const pct = Math.min(100, (c.usedCount / c.maxUses) * 100)
                return (
                  <li key={c.id}><Link to="/coupons/$couponId" params={{ couponId: String(c.id) }} className="block hover:text-primary">
                    <div className="mb-1 flex justify-between text-xs"><span className="font-mono font-bold">{c.code}</span><span className="tabular-nums">{c.usedCount} / {c.maxUses}</span></div>
                    <div className="h-1.5 overflow-hidden rounded-full bg-muted"><div className={cn('h-full rounded-full', pct >= 95 ? 'bg-[#ec4647]' : 'bg-[#f2a600]')} style={{ width: `${pct}%` }} /></div>
                  </Link></li>
                )
              })}
            </ul>
          )}
        </Panel>
      </div>
    </motion.div>
  )
}
