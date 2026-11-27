import { motion } from 'framer-motion'
import { Bar, CartesianGrid, Cell, ComposedChart, Line, Pie, PieChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'
import { Banknote, CreditCard, HandCoins, IndianRupee, Percent, ShoppingBag, Store, TrendingUp, type LucideIcon } from 'lucide-react'
import { cn } from '@/lib/utils'
import { AnimatedNumber, Panel, Skeleton, Sparkline } from '@/features/dashboard/components/dashboard-ui'
import { riseIn, staggerContainer, toNumber } from '@/features/dashboard/utils/dashboard-format'
import type { VendorInsights } from '../api/vendor-insights.api'
import { formatInrFull, formatInrShort } from '../utils/vendor-meta'

const monthLabel = (ym: string) => {
  const [y, m] = ym.split('-').map(Number)
  return y && m ? new Date(y, m - 1, 1).toLocaleDateString('en-IN', { month: 'short', year: '2-digit' }) : ym
}

function Tile({ icon: Icon, label, value, format, sub, gradient, children }: {
  icon: LucideIcon; label: string; value: number; format: (n: number) => string; sub?: React.ReactNode; gradient: string; children?: React.ReactNode
}) {
  return (
    <motion.div variants={riseIn} whileHover={{ y: -4 }} transition={{ type: 'spring', stiffness: 400, damping: 25 }}
      className="group relative overflow-hidden rounded-2xl border border-border bg-card p-4 shadow-sm transition-shadow hover:shadow-xl hover:shadow-black/[0.05] dark:hover:shadow-black/30">
      <div className="flex items-start justify-between gap-2">
        <p className="text-xs font-medium text-muted-foreground">{label}</p>
        <span className={cn('flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br text-white shadow-md transition-transform duration-300 group-hover:-rotate-6 group-hover:scale-110', gradient)}>
          <Icon className="h-4 w-4" aria-hidden />
        </span>
      </div>
      <p className="-mt-1 text-2xl font-bold tracking-tight text-foreground"><AnimatedNumber value={value} format={format} /></p>
      {sub && <p className="mt-0.5 truncate text-xs text-muted-foreground">{sub}</p>}
      {children}
    </motion.div>
  )
}

export function VendorKpis({ data, loading }: { data?: VendorInsights; loading: boolean }) {
  if (loading || !data) {
    return (
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-5">
        {Array.from({ length: 5 }).map((_, i) => <Skeleton key={i} className="h-32 rounded-2xl" />)}
      </div>
    )
  }
  const commission = toNumber(data.commissionTotal)
  const settled = toNumber(data.commissionSettled)
  const spark = data.monthly.map((m) => toNumber(m.revenue))
  return (
    <motion.div variants={staggerContainer} initial="hidden" animate="show" className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-5">
      <Tile icon={IndianRupee} label="Total sales" value={toNumber(data.grossRevenue)} format={formatInrShort}
        gradient="from-[#ffc400] via-[#ff6a00] to-[#e01a00]" sub="Cards sold, online + pay at store">
        {spark.length > 1 && <div className="-mb-1 mt-2"><Sparkline values={spark} color="#ff6a00" /></div>}
      </Tile>
      <Tile icon={ShoppingBag} label="Cards sold" value={toNumber(data.cardsSold)} format={(n) => Math.round(n).toLocaleString('en-IN')}
        gradient="from-sky-400 to-indigo-600"
        sub={<>{toNumber(data.onlineSales).toLocaleString('en-IN')} online · {toNumber(data.payAtStoreSales).toLocaleString('en-IN')} at store</>} />
      <Tile icon={Percent} label="Strike commission" value={commission} format={formatInrShort} gradient="from-emerald-400 to-teal-600"
        sub={`${Number(data.commissionRate ?? 0)}% fee`}>
        {commission > 0 && (
          <div className="mt-2.5">
            <div className="h-1.5 overflow-hidden rounded-full bg-muted">
              <motion.div className="h-full rounded-full bg-gradient-to-r from-emerald-400 to-teal-500"
                initial={{ width: 0 }} animate={{ width: `${(settled / commission) * 100}%` }} transition={{ duration: 1, delay: 0.3 }} />
            </div>
            <p className="mt-1 text-[11px] text-muted-foreground">{formatInrShort(data.commissionPending)} not settled yet</p>
          </div>
        )}
      </Tile>
      <Tile icon={Banknote} label="Paid out to vendor" value={toNumber(data.withdrawals?.paidOut)} format={formatInrShort}
        gradient="from-violet-500 to-fuchsia-600"
        sub={toNumber(data.withdrawals?.pendingAmount) > 0
          ? <span className="font-medium text-amber-600 dark:text-amber-400">{formatInrShort(data.withdrawals.pendingAmount)} waiting for approval</span>
          : `${toNumber(data.withdrawals?.count)} withdrawal request${toNumber(data.withdrawals?.count) === 1 ? '' : 's'}`} />
      <Tile icon={HandCoins} label="Pay-at-store commission due" value={toNumber(data.payAtStoreOutstanding)} format={formatInrShort}
        gradient="from-amber-400 to-orange-600" sub="Owed to Strike from in-store sales" />
    </motion.div>
  )
}

function TrendTooltip({ active, payload, label }: { active?: boolean; payload?: { dataKey: string; value: number }[]; label?: string }) {
  if (!active || !payload?.length || !label) return null
  const get = (k: string) => payload.find((p) => p.dataKey === k)?.value ?? 0
  return (
    <div className="rounded-xl border border-border bg-card/95 p-3 text-xs shadow-xl backdrop-blur">
      <p className="mb-1.5 font-semibold text-foreground">{monthLabel(label)}</p>
      <p className="text-muted-foreground">Sales <span className="font-semibold text-foreground">{formatInrFull(get('revenue'))}</span></p>
      <p className="text-muted-foreground">Cards sold <span className="font-semibold text-foreground">{get('sold')}</span></p>
      <p className="text-muted-foreground">Commission <span className="font-semibold text-foreground">{formatInrFull(get('commission'))}</span></p>
    </div>
  )
}

export function VendorSalesTrend({ data, loading }: { data?: VendorInsights; loading: boolean }) {
  const rows = (data?.monthly ?? []).map((m) => ({ month: m.month, revenue: toNumber(m.revenue), commission: toNumber(m.commission), sold: toNumber(m.sold) }))
  return (
    <Panel title="Sales by month" subtitle="Card sales (bars) and cards sold (line), last 12 months" icon={<TrendingUp className="h-4 w-4" />} className="h-full">
      {loading ? <Skeleton className="h-[260px] w-full rounded-xl" /> : rows.length === 0 ? (
        <div className="flex h-[260px] items-center justify-center rounded-xl border border-dashed border-border text-sm text-muted-foreground">
          No sales yet
        </div>
      ) : (
        <div className="h-[260px]">
          <ResponsiveContainer width="100%" height="100%">
            <ComposedChart data={rows} margin={{ top: 8, right: 0, left: -8, bottom: 0 }}>
              <defs>
                <linearGradient id="vendor-bar" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#ffb000" />
                  <stop offset="100%" stopColor="#ff5a00" />
                </linearGradient>
              </defs>
              <CartesianGrid vertical={false} stroke="var(--color-border)" strokeDasharray="3 3" />
              <XAxis dataKey="month" tickFormatter={monthLabel} tickLine={false} axisLine={false} tick={{ fontSize: 11, fill: 'var(--color-muted-foreground)' }} />
              <YAxis yAxisId="left" tickFormatter={(v: number) => formatInrShort(v)} tickLine={false} axisLine={false} width={60} tick={{ fontSize: 11, fill: 'var(--color-muted-foreground)' }} />
              <YAxis yAxisId="right" orientation="right" allowDecimals={false} tickLine={false} axisLine={false} width={32} tick={{ fontSize: 11, fill: 'var(--color-muted-foreground)' }} />
              <Tooltip content={<TrendTooltip />} cursor={{ fill: 'var(--color-muted)', opacity: 0.5 }} />
              <Bar yAxisId="left" dataKey="revenue" fill="url(#vendor-bar)" radius={[6, 6, 0, 0]} maxBarSize={34} animationDuration={1100} />
              <Line yAxisId="right" type="monotone" dataKey="sold" stroke="#6366f1" strokeWidth={2.5} dot={{ r: 3, fill: '#6366f1' }} activeDot={{ r: 5 }} animationDuration={1300} />
              <Line yAxisId="left" type="monotone" dataKey="commission" stroke="#10b981" strokeWidth={0} dot={false} activeDot={false} legendType="none" />
            </ComposedChart>
          </ResponsiveContainer>
        </div>
      )}
    </Panel>
  )
}

export function VendorSalesMix({ data, loading }: { data?: VendorInsights; loading: boolean }) {
  const online = toNumber(data?.onlineRevenue)
  const store = toNumber(data?.payAtStoreRevenue)
  const total = online + store
  const slices = [
    { key: 'online', label: 'Online', value: online, color: '#6366f1', icon: CreditCard },
    { key: 'store', label: 'Pay at store', value: store, color: '#ff6a00', icon: Store },
  ]
  return (
    <Panel title="How customers pay" subtitle="Share of sales" icon={<CreditCard className="h-4 w-4" />} className="h-full">
      {loading ? <Skeleton className="mx-auto h-44 w-44 rounded-full" /> : total === 0 ? (
        <div className="flex h-56 items-center justify-center text-sm text-muted-foreground">No sales yet</div>
      ) : (
        <>
          <div className="relative mx-auto h-44 w-44">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={slices.filter((s) => s.value > 0)} dataKey="value" innerRadius="64%" outerRadius="90%" paddingAngle={3} cornerRadius={6} stroke="none" animationDuration={1100}>
                  {slices.filter((s) => s.value > 0).map((s) => <Cell key={s.key} fill={s.color} />)}
                </Pie>
              </PieChart>
            </ResponsiveContainer>
            <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center">
              <p className="text-xl font-bold text-foreground">{formatInrShort(total)}</p>
              <p className="text-[11px] text-muted-foreground">total sales</p>
            </div>
          </div>
          <ul className="mt-4 space-y-3">
            {slices.map(({ key, label, value, color, icon: Icon }) => (
              <li key={key}>
                <div className="flex items-center justify-between text-xs">
                  <span className="flex items-center gap-2 text-foreground"><Icon className="h-3.5 w-3.5" style={{ color }} />{label}</span>
                  <span className="tabular-nums text-muted-foreground"><span className="font-semibold text-foreground">{formatInrShort(value)}</span> · {((value / total) * 100).toFixed(0)}%</span>
                </div>
                <div className="mt-1 h-1.5 overflow-hidden rounded-full bg-muted">
                  <motion.div className="h-full rounded-full" style={{ backgroundColor: color }} initial={{ width: 0 }} animate={{ width: `${(value / total) * 100}%` }} transition={{ duration: 1, delay: 0.3 }} />
                </div>
              </li>
            ))}
          </ul>
        </>
      )}
    </Panel>
  )
}
