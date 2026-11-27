import { useState } from 'react'
import { Link } from '@tanstack/react-router'
import { motion } from 'framer-motion'
import { Activity, AlertTriangle, Crown, PieChart as PieIcon, Timer, TrendingUp, Users, Wallet } from 'lucide-react'
import { Area, AreaChart, CartesianGrid, Cell, Pie, PieChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'
import { cn } from '@/lib/utils'
import { Panel, Skeleton } from '@/features/dashboard/components/dashboard-ui'
import { staggerContainer } from '@/features/dashboard/utils/dashboard-format'
import { avatarGradient, formatInrFull, formatInrShort, vendorInitials } from '@/features/vendors/utils/vendor-meta'
import type { PayoutOverview } from '../api/withdrawal-insights.api'
import { humanDuration, methodMeta } from '../utils/payout-meta'

const axis = { fontSize: 11, fill: 'var(--color-muted-foreground)' }
const dayLabel = (d: string) => new Date(`${d}T00:00:00`).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })

export function PayoutInsights({ data, loading, days, onDays }: { data?: PayoutOverview; loading: boolean; days: number; onDays: (d: number) => void }) {
  return (
    <motion.div variants={staggerContainer} initial="hidden" animate="show" className="flex flex-col gap-5">
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <Fact icon={Timer} tone="from-sky-400 to-indigo-600" label="Average time to pay" value={humanDuration(data?.averageReviewSeconds)} loading={loading} />
        <Fact icon={Wallet} tone="from-violet-400 to-fuchsia-600" label="Vendors can still withdraw" value={formatInrShort(data?.stillWithdrawable)} hint="earned online − commission − paid − waiting" loading={loading} />
        <Fact icon={TrendingUp} tone="from-emerald-400 to-teal-600" label="Average request" value={formatInrShort(data?.averageAmount)} hint={`biggest ${formatInrShort(data?.largestAmount)}`} loading={loading} />
        <Fact icon={Users} tone="from-amber-400 to-orange-600" label="Vendors who withdrew" value={String(data?.vendors ?? 0)} hint={`${data?.rejected ?? 0} requests rejected`} loading={loading} />
      </div>

      <Panel title="Requested vs paid" subtitle="Money vendors asked for and money paid out, per day" icon={<Activity className="h-4 w-4" />}
        action={
          <div className="flex rounded-lg bg-muted/60 p-0.5">
            {[7, 30, 90].map((d) => (
              <button key={d} type="button" onClick={() => onDays(d)} className={cn('relative rounded-md px-2.5 py-1 text-xs font-medium', days === d ? 'text-foreground' : 'text-muted-foreground')}>
                {days === d && <motion.span layoutId="wd-days" className="absolute inset-0 rounded-md bg-card shadow-sm" />}<span className="relative">{d}d</span>
              </button>
            ))}
          </div>
        }>
        {loading && !data ? <Skeleton className="h-[260px] w-full" /> : (
          <div className="h-[260px]">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={data?.daily ?? []} margin={{ top: 8, right: 4, left: -8, bottom: 0 }}>
                <defs>
                  <linearGradient id="wd-req" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor="#f59e0b" stopOpacity={0.45} /><stop offset="100%" stopColor="#f59e0b" stopOpacity={0} /></linearGradient>
                  <linearGradient id="wd-paid" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor="#10b981" stopOpacity={0.5} /><stop offset="100%" stopColor="#10b981" stopOpacity={0} /></linearGradient>
                </defs>
                <CartesianGrid vertical={false} stroke="var(--color-border)" strokeDasharray="3 3" />
                <XAxis dataKey="day" tickFormatter={dayLabel} tickLine={false} axisLine={false} tick={axis} minTickGap={18} />
                <YAxis tickFormatter={(v: number) => formatInrShort(v)} tickLine={false} axisLine={false} width={56} tick={axis} />
                <Tooltip labelFormatter={(l) => dayLabel(String(l))} formatter={(v, n) => [formatInrFull(Number(v)), n === 'paid' ? 'Paid' : 'Requested']}
                  contentStyle={{ borderRadius: 12, border: '1px solid var(--color-border)', background: 'var(--color-popover)', fontSize: 12 }} />
                <Area type="monotone" dataKey="requested" stroke="#f59e0b" strokeWidth={2.5} fill="url(#wd-req)" animationDuration={1100} />
                <Area type="monotone" dataKey="paid" stroke="#10b981" strokeWidth={2.5} fill="url(#wd-paid)" animationDuration={1300} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        )}
      </Panel>

      <div className="grid grid-cols-1 gap-5 xl:grid-cols-3">
        <Methods data={data} loading={loading} />
        <TopVendors data={data} loading={loading} />
        <Panel title="Why requests were rejected" subtitle="The reasons vendors were given" icon={<AlertTriangle className="h-4 w-4" />} className="h-full">
          {loading && !data ? <Skeleton className="h-40 w-full" /> : (data?.rejectionReasons?.length ?? 0) === 0 ? <p className="py-10 text-center text-sm text-muted-foreground">Nothing rejected yet</p> : (
            <ul className="flex flex-col gap-2">
              {data!.rejectionReasons!.map((r, i) => (
                <motion.li key={r.reason} initial={{ opacity: 0, x: -8 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.06 }}
                  className="flex items-center justify-between gap-3 rounded-xl border border-rose-200/60 bg-rose-50/50 px-3 py-2 text-sm dark:border-rose-400/20 dark:bg-rose-400/5">
                  <span className="min-w-0 truncate">{r.reason}</span>
                  <span className="shrink-0 rounded-full bg-rose-100 px-2 py-0.5 text-xs font-semibold text-rose-700 dark:bg-rose-400/10 dark:text-rose-300">{r.count}×</span>
                </motion.li>
              ))}
            </ul>
          )}
        </Panel>
      </div>
    </motion.div>
  )
}

function Methods({ data, loading }: { data?: PayoutOverview; loading: boolean }) {
  const [active, setActive] = useState<number>()
  const rows = (data?.methods ?? []).map((m) => ({ ...m, label: methodMeta(m.method).label, color: methodMeta(m.method).color }))
  const total = rows.reduce((s, r) => s + Number(r.amount), 0)
  const focus = active != null ? rows[active] : undefined
  return (
    <Panel title="UPI vs bank" subtitle="How vendors want to be paid" icon={<PieIcon className="h-4 w-4" />} className="h-full">
      {loading && !data ? <Skeleton className="h-48 w-full" /> : total === 0 ? <p className="py-10 text-center text-sm text-muted-foreground">No payouts yet</p> : (
        <div className="flex flex-col items-center gap-3">
          <div className="relative h-[160px] w-[160px]">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={rows} dataKey="amount" nameKey="label" innerRadius="64%" outerRadius="92%" paddingAngle={rows.length > 1 ? 3 : 0} cornerRadius={6} stroke="none"
                  animationDuration={1000} onMouseEnter={(_, i) => setActive(i)} onMouseLeave={() => setActive(undefined)}>
                  {rows.map((r, i) => <Cell key={r.method} fill={r.color} fillOpacity={active == null || active === i ? 1 : 0.25} />)}
                </Pie>
              </PieChart>
            </ResponsiveContainer>
            <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center">
              <span className="text-lg font-bold tabular-nums text-foreground">{focus ? `${Math.round((Number(focus.amount) / total) * 100)}%` : formatInrShort(total)}</span>
              <span className="text-[11px] text-muted-foreground">{focus ? focus.label : 'requested'}</span>
            </div>
          </div>
          <ul className="flex w-full flex-col gap-1.5">
            {rows.map((r) => (
              <li key={r.method} className="flex items-center justify-between rounded-lg bg-muted/50 px-3 py-1.5 text-xs">
                <span className="flex items-center gap-2 text-muted-foreground"><span className="h-2.5 w-2.5 rounded-full" style={{ background: r.color }} />{r.label}</span>
                <span className="font-semibold tabular-nums text-foreground">{formatInrShort(r.amount)} · {r.count}</span>
              </li>
            ))}
          </ul>
        </div>
      )}
    </Panel>
  )
}

function TopVendors({ data, loading }: { data?: PayoutOverview; loading: boolean }) {
  const list = data?.topVendors ?? []
  const max = Math.max(1, ...list.map((v) => Number(v.amount)))
  return (
    <Panel title="Most paid out" subtitle="Vendors who received the most" icon={<Crown className="h-4 w-4" />} className="h-full">
      {loading && !data ? <Skeleton className="h-40 w-full" /> : list.length === 0 ? <p className="py-10 text-center text-sm text-muted-foreground">No payouts yet</p> : (
        <ol className="space-y-1.5">
          {list.map((v, i) => (
            <motion.li key={v.vendorId} initial={{ opacity: 0, x: -8 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.1 + i * 0.06 }}>
              <Link to="/vendors/$vendorId" params={{ vendorId: String(v.vendorId) }} search={{ tab: undefined }} className="flex items-center gap-3 rounded-xl p-2 hover:bg-muted/60">
                <span className={cn('flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br text-xs font-bold text-white', avatarGradient(v.vendorId))}>{vendorInitials(v.name)}</span>
                <span className="min-w-0 flex-1">
                  <span className="flex justify-between gap-2 text-sm"><span className="truncate font-medium">{v.name ?? `Vendor #${v.vendorId}`}</span><span className="shrink-0 font-semibold tabular-nums">{formatInrShort(v.amount)}</span></span>
                  <span className="mt-1 flex items-center gap-2">
                    <span className="h-1.5 flex-1 overflow-hidden rounded-full bg-muted"><motion.span className="block h-full rounded-full bg-gradient-to-r from-emerald-400 to-teal-600" initial={{ width: 0 }} animate={{ width: `${(Number(v.amount) / max) * 100}%` }} transition={{ duration: 1, delay: 0.2 + i * 0.08 }} /></span>
                    <span className="text-[11px] text-muted-foreground">{v.count} payouts</span>
                  </span>
                </span>
              </Link>
            </motion.li>
          ))}
        </ol>
      )}
    </Panel>
  )
}

function Fact({ icon: Icon, tone, label, value, hint, loading }: { icon: typeof Timer; tone: string; label: string; value: string; hint?: string; loading: boolean }) {
  return (
    <motion.div whileHover={{ y: -3 }} className="relative overflow-hidden rounded-2xl border border-border bg-card p-4 shadow-sm">
      <span className={cn('pointer-events-none absolute -right-6 -top-6 h-20 w-20 rounded-full bg-gradient-to-br opacity-15 blur-xl', tone)} aria-hidden />
      <span className={cn('flex h-8 w-8 items-center justify-center rounded-xl bg-gradient-to-br text-white shadow-md', tone)}><Icon className="h-4 w-4" /></span>
      {loading ? <Skeleton className="mt-3 h-7 w-20" /> : <p className="mt-3 text-2xl font-bold tabular-nums text-foreground">{value}</p>}
      <p className="mt-0.5 text-xs text-muted-foreground">{label}</p>
      {hint && <p className="mt-1 truncate text-[10px] text-muted-foreground/80">{hint}</p>}
    </motion.div>
  )
}
