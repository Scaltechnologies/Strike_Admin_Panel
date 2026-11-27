import { useState } from 'react'
import { Link } from '@tanstack/react-router'
import { motion } from 'framer-motion'
import {
  Activity, AlertTriangle, ArrowUpRight, CalendarDays, Clock3, CreditCard, Crown, PieChart as PieIcon, Radio, Smartphone, UtensilsCrossed,
} from 'lucide-react'
import { Bar, BarChart, CartesianGrid, Cell, ComposedChart, Line, Pie, PieChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'
import { cn } from '@/lib/utils'
import { hasPermission } from '@/core/auth/auth'
import { Panel, Skeleton } from '@/features/dashboard/components/dashboard-ui'
import { staggerContainer } from '@/features/dashboard/utils/dashboard-format'
import { avatarGradient, formatInrFull, formatInrShort, vendorInitials } from '@/features/vendors/utils/vendor-meta'
import { useRedemptionFeed, type RedemptionOverview, type RedemptionRow } from '../api/redemption-insights.api'
import { STATUS_META, WEEKDAYS, hourLabel, initiatedLabel } from '../utils/redemption-meta'
import { RedemptionRowCard } from './RedemptionRowCard'

const axis = { fontSize: 11, fill: 'var(--color-muted-foreground)' }
const dayLabel = (d: string) => new Date(`${d}T00:00:00`).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })
const LATEST = { status: 'ALL' as const, q: '', from: '', to: '', sort: 'newest' as const }

export function RedemptionOverviewPanel({ data, loading, days, onDays, live, onOpen, onSeeAll }: {
  data?: RedemptionOverview
  loading: boolean
  days: number
  onDays: (d: number) => void
  live: boolean
  onOpen: (r: RedemptionRow) => void
  onSeeAll: () => void
}) {
  const latest = useRedemptionFeed(LATEST, 0, 6, live)
  return (
    <motion.div variants={staggerContainer} initial="hidden" animate="show" className="flex flex-col gap-5">
      <div className="grid grid-cols-1 gap-5 xl:grid-cols-3">
        <div className="xl:col-span-2"><Trend data={data} loading={loading} days={days} onDays={onDays} /></div>
        <StatusMix data={data} loading={loading} />
      </div>

      <div className="grid grid-cols-1 gap-5 xl:grid-cols-3">
        <Panel title="Live — latest redemptions" subtitle="Updates by itself every few seconds" icon={<Radio className="h-4 w-4" />} className="xl:col-span-2"
          action={<button type="button" onClick={onSeeAll} className="inline-flex items-center gap-0.5 text-xs font-medium text-primary hover:underline">See all <ArrowUpRight className="h-3 w-3" /></button>}>
          {latest.isLoading ? <div className="space-y-2">{Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-14 w-full" />)}</div>
            : (latest.data?.content.length ?? 0) === 0 ? <p className="py-10 text-center text-sm text-muted-foreground">No redemptions yet</p>
              : <div className="flex flex-col gap-2">{latest.data!.content.map((r, i) => <RedemptionRowCard key={r.id} row={r} index={i} onOpen={onOpen} compact />)}</div>}
        </Panel>
        <Panel title="Who starts redemptions" subtitle="Customer app or the store's vendor app" icon={<Smartphone className="h-4 w-4" />}>
          {loading ? <Skeleton className="h-40 w-full" /> : (
            <div className="flex flex-col gap-5">
              <InitiatedBy data={data} />
              <div>
                <p className="mb-2 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">At a glance</p>
                <dl className="grid grid-cols-2 gap-2">
                  {[
                    ['Average redemption', formatInrFull(data?.averageAmount)],
                    ['Biggest one', formatInrFull(data?.largestAmount)],
                    ['Customers who redeemed', String(data?.customers ?? 0)],
                    ['Stores used', String(data?.stores ?? 0)],
                    ['Yesterday', `${formatInrShort(data?.yesterdayAmount)} · ${data?.yesterdayCount ?? 0}`],
                    ['Refused / failed', String((data?.rejected ?? 0) + (data?.failed ?? 0))],
                  ].map(([label, value], i) => (
                    <motion.div key={label} initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 + i * 0.05 }}
                      className="rounded-xl bg-muted/50 px-3 py-2">
                      <dt className="truncate text-[11px] text-muted-foreground">{label}</dt>
                      <dd className="mt-0.5 truncate text-sm font-bold tabular-nums text-foreground">{value}</dd>
                    </motion.div>
                  ))}
                </dl>
              </div>
            </div>
          )}
        </Panel>
      </div>

      <div className="grid grid-cols-1 gap-5 xl:grid-cols-3">
        <div className="xl:col-span-2"><BusiestHours data={data} loading={loading} /></div>
        <Panel title="Busiest days" subtitle="Completed redemptions by weekday, last 90 days" icon={<CalendarDays className="h-4 w-4" />}>
          {loading ? <Skeleton className="h-48 w-full" /> : <Weekdays data={data} />}
        </Panel>
      </div>

      <div className="grid grid-cols-1 gap-5 lg:grid-cols-2 2xl:grid-cols-3">
        <TopStores data={data} loading={loading} />
        <Ranked title="Top cards" subtitle="Cards customers spend the most from" icon={<CreditCard className="h-4 w-4" />} loading={loading}
          rows={(data?.topCards ?? []).map((c) => ({ key: c.name, label: c.name, value: c.amount, hint: `${c.count} times` }))} tone="from-sky-400 to-indigo-600" />
        <Ranked title="Most redeemed dishes" subtitle="Items bought with card wallets" icon={<UtensilsCrossed className="h-4 w-4" />} loading={loading}
          rows={(data?.topItems ?? []).map((c) => ({ key: c.name, label: c.name, value: c.amount, hint: `${c.quantity} ordered` }))} tone="from-pink-400 to-rose-600" />
      </div>

      <Panel title="Why redemptions were refused" subtitle="Reasons given when a store rejected or a redemption failed" icon={<AlertTriangle className="h-4 w-4" />}>
        {loading ? <Skeleton className="h-24 w-full" /> : (data?.refusalReasons?.length ?? 0) === 0 ? (
          <p className="py-6 text-center text-sm text-muted-foreground">Nothing refused — great!</p>
        ) : (
          <ul className="grid grid-cols-1 gap-2 md:grid-cols-2">
            {data!.refusalReasons!.map((r, i) => (
              <motion.li key={r.reason} initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}
                className="flex items-center justify-between gap-3 rounded-xl border border-rose-200/60 bg-rose-50/50 px-3 py-2 text-sm dark:border-rose-400/20 dark:bg-rose-400/5">
                <span className="min-w-0 truncate text-foreground">{r.reason}</span>
                <span className="shrink-0 rounded-full bg-rose-100 px-2 py-0.5 text-xs font-semibold text-rose-700 dark:bg-rose-400/10 dark:text-rose-300">{r.count}×</span>
              </motion.li>
            ))}
          </ul>
        )}
      </Panel>
    </motion.div>
  )
}

function TrendTip({ active, payload, label }: { active?: boolean; payload?: { dataKey: string; value: number }[]; label?: string }) {
  if (!active || !payload?.length) return null
  const get = (k: string) => payload.find((p) => p.dataKey === k)?.value ?? 0
  return (
    <div className="rounded-xl border border-border bg-popover px-3 py-2 text-xs shadow-lg">
      <p className="mb-1.5 font-semibold text-foreground">{label ? dayLabel(label) : ''}</p>
      <p className="text-muted-foreground">Redeemed <span className="ml-2 font-semibold text-foreground">{formatInrFull(get('amount'))}</span></p>
      <p className="text-muted-foreground">Completed <span className="ml-2 font-semibold text-foreground">{get('completed')}</span></p>
      {get('refused') > 0 && <p className="text-rose-600">Refused <span className="ml-2 font-semibold">{get('refused')}</span></p>}
    </div>
  )
}

function Trend({ data, loading, days, onDays }: { data?: RedemptionOverview; loading: boolean; days: number; onDays: (d: number) => void }) {
  const rows = data?.daily ?? []
  const empty = rows.every((r) => !r.completed && !r.refused)
  return (
    <Panel title="Redemption trend" subtitle="Money spent from card wallets (bars) and redemptions (line), per day" icon={<Activity className="h-4 w-4" />} className="h-full"
      action={
        <div className="flex rounded-lg bg-muted/60 p-0.5">
          {[7, 30, 90].map((d) => (
            <button key={d} type="button" onClick={() => onDays(d)}
              className={cn('relative rounded-md px-2.5 py-1 text-xs font-medium', days === d ? 'text-foreground' : 'text-muted-foreground hover:text-foreground')}>
              {days === d && <motion.span layoutId="red-days" className="absolute inset-0 rounded-md bg-card shadow-sm" />}
              <span className="relative">{d}d</span>
            </button>
          ))}
        </div>
      }>
      {loading && !data ? <Skeleton className="h-[260px] w-full" /> : empty ? (
        <div className="flex h-[260px] items-center justify-center rounded-xl border border-dashed border-border text-sm text-muted-foreground">No redemptions in the last {days} days</div>
      ) : (
        <div className="h-[260px]">
          <ResponsiveContainer width="100%" height="100%">
            <ComposedChart data={rows} margin={{ top: 8, right: 0, left: -8, bottom: 0 }}>
              <defs>
                <linearGradient id="red-bar" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#38bdf8" />
                  <stop offset="100%" stopColor="#4f46e5" />
                </linearGradient>
              </defs>
              <CartesianGrid vertical={false} stroke="var(--color-border)" strokeDasharray="3 3" />
              <XAxis dataKey="day" tickFormatter={dayLabel} tickLine={false} axisLine={false} tick={axis} interval="preserveStartEnd" minTickGap={18} />
              <YAxis yAxisId="l" tickFormatter={(v: number) => formatInrShort(v)} tickLine={false} axisLine={false} width={56} tick={axis} />
              <YAxis yAxisId="r" orientation="right" allowDecimals={false} tickLine={false} axisLine={false} width={28} tick={axis} />
              <Tooltip content={<TrendTip />} cursor={{ fill: 'var(--color-muted)', opacity: 0.5 }} />
              <Bar yAxisId="l" dataKey="amount" fill="url(#red-bar)" radius={[5, 5, 0, 0]} maxBarSize={26} animationDuration={1000} />
              <Bar yAxisId="r" dataKey="refused" fill="#f43f5e" radius={[3, 3, 0, 0]} maxBarSize={6} animationDuration={1200} />
              <Line yAxisId="r" type="monotone" dataKey="completed" stroke="#f59e0b" strokeWidth={2.5} dot={false} animationDuration={1300} />
            </ComposedChart>
          </ResponsiveContainer>
        </div>
      )}
    </Panel>
  )
}

function StatusMix({ data, loading }: { data?: RedemptionOverview; loading: boolean }) {
  const [active, setActive] = useState<number>()
  const slices = ([
    ['COMPLETED', data?.completed], ['PENDING', data?.pending], ['REJECTED', data?.rejected], ['FAILED', data?.failed], ['CANCELLED', data?.cancelled],
  ] as const).map(([k, v]) => ({ key: k, label: STATUS_META[k].label, color: STATUS_META[k].color, value: v ?? 0 })).filter((s) => s.value > 0)
  const total = slices.reduce((s, x) => s + x.value, 0)
  const focus = active != null ? slices[active] : undefined
  return (
    <Panel title="How redemptions ended" subtitle="Every redemption so far" icon={<PieIcon className="h-4 w-4" />} className="h-full">
      {loading && !data ? <Skeleton className="h-[260px] w-full" /> : total === 0 ? (
        <div className="flex h-[260px] items-center justify-center rounded-xl border border-dashed border-border text-sm text-muted-foreground">No redemptions yet</div>
      ) : (
        <div className="flex flex-col items-center gap-3">
          <div className="relative h-[170px] w-[170px]">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={slices} dataKey="value" nameKey="label" innerRadius="64%" outerRadius="92%" paddingAngle={slices.length > 1 ? 3 : 0} cornerRadius={6} stroke="none"
                  animationDuration={1100} onMouseEnter={(_, i) => setActive(i)} onMouseLeave={() => setActive(undefined)}>
                  {slices.map((s, i) => <Cell key={s.key} fill={s.color} fillOpacity={active == null || active === i ? 1 : 0.25} style={{ transition: 'fill-opacity 250ms ease' }} />)}
                </Pie>
              </PieChart>
            </ResponsiveContainer>
            <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center">
              <span className="text-2xl font-bold tabular-nums text-foreground">{focus ? `${Math.round((focus.value / total) * 100)}%` : total}</span>
              <span className="text-[11px] text-muted-foreground">{focus ? focus.label : 'redemptions'}</span>
            </div>
          </div>
          <ul className="grid w-full grid-cols-1 gap-1.5">
            {slices.map((s) => (
              <li key={s.key} className="flex items-center justify-between rounded-lg bg-muted/50 px-3 py-1.5 text-xs">
                <span className="flex items-center gap-2 text-muted-foreground"><span className="h-2.5 w-2.5 rounded-full" style={{ background: s.color }} />{s.label}</span>
                <span className="font-semibold tabular-nums text-foreground">{s.value}</span>
              </li>
            ))}
          </ul>
        </div>
      )}
    </Panel>
  )
}

function BusiestHours({ data, loading }: { data?: RedemptionOverview; loading: boolean }) {
  const rows = data?.hourly ?? []
  const max = Math.max(0, ...rows.map((r) => r.count))
  const peak = rows.find((r) => r.count === max && max > 0)
  return (
    <Panel title="Busiest hours" subtitle={peak ? `Peak around ${hourLabel(peak.hour)} (India time) · last 90 days` : 'Completed redemptions by hour (India time) · last 90 days'}
      icon={<Clock3 className="h-4 w-4" />} className="h-full">
      {loading && !data ? <Skeleton className="h-[220px] w-full" /> : max === 0 ? (
        <div className="flex h-[220px] items-center justify-center rounded-xl border border-dashed border-border text-sm text-muted-foreground">No completed redemptions in the last 90 days</div>
      ) : (
        <div className="h-[220px]">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={rows} margin={{ top: 8, right: 4, left: -24, bottom: 0 }}>
              <CartesianGrid vertical={false} stroke="var(--color-border)" strokeDasharray="3 3" />
              <XAxis dataKey="hour" tickFormatter={(h: number) => (h % 3 === 0 ? hourLabel(h) : '')} tickLine={false} axisLine={false} tick={axis} interval={0} />
              <YAxis allowDecimals={false} tickLine={false} axisLine={false} tick={axis} />
              <Tooltip labelFormatter={(h) => hourLabel(Number(h))} formatter={(v) => [`${v} redemptions`, '']}
                contentStyle={{ borderRadius: 12, border: '1px solid var(--color-border)', background: 'var(--color-popover)', fontSize: 12 }} cursor={{ fill: 'var(--color-muted)', opacity: 0.5 }} />
              <Bar dataKey="count" radius={[4, 4, 0, 0]} animationDuration={1000}>
                {rows.map((r) => <Cell key={r.hour} fill={r.count === max ? '#f59e0b' : '#a5b4fc'} />)}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}
    </Panel>
  )
}

function Weekdays({ data }: { data?: RedemptionOverview }) {
  const rows = data?.weekdays ?? []
  const max = Math.max(1, ...rows.map((r) => r.count))
  return (
    <ul className="flex flex-col gap-2">
      {rows.map((r, i) => (
        <li key={r.day} className="flex items-center gap-3 text-xs">
          <span className="w-8 shrink-0 font-medium text-muted-foreground">{WEEKDAYS[r.day - 1]}</span>
          <span className="h-2.5 flex-1 overflow-hidden rounded-full bg-muted">
            <motion.span className={cn('block h-full rounded-full bg-gradient-to-r', r.count === max && r.count > 0 ? 'from-amber-400 to-orange-600' : 'from-sky-300 to-indigo-500')}
              initial={{ width: 0 }} animate={{ width: `${(r.count / max) * 100}%` }} transition={{ duration: 0.9, delay: 0.1 + i * 0.05 }} />
          </span>
          <span className="w-6 shrink-0 text-right font-semibold tabular-nums text-foreground">{r.count}</span>
        </li>
      ))}
    </ul>
  )
}

function InitiatedBy({ data }: { data?: RedemptionOverview }) {
  const rows = data?.initiatedBy ?? []
  const total = rows.reduce((s, r) => s + r.count, 0)
  if (total === 0) return <p className="py-8 text-center text-sm text-muted-foreground">No redemptions yet</p>
  const tones = ['from-pink-400 to-rose-600', 'from-sky-400 to-indigo-600', 'from-amber-400 to-orange-600', 'from-slate-400 to-slate-600']
  return (
    <div className="flex flex-col gap-4">
      <div className="flex h-3 overflow-hidden rounded-full bg-muted">
        {rows.map((r, i) => (
          <motion.span key={r.by} className={cn('h-full bg-gradient-to-r', tones[i % tones.length])}
            initial={{ width: 0 }} animate={{ width: `${(r.count / total) * 100}%` }} transition={{ duration: 1, delay: i * 0.1 }} />
        ))}
      </div>
      <ul className="flex flex-col gap-2">
        {rows.map((r, i) => (
          <li key={r.by} className="flex items-center justify-between text-sm">
            <span className="flex items-center gap-2 text-muted-foreground">
              <span className={cn('h-2.5 w-2.5 rounded-full bg-gradient-to-r', tones[i % tones.length])} />{initiatedLabel(r.by)}
            </span>
            <span className="font-semibold tabular-nums text-foreground">{Math.round((r.count / total) * 100)}% <span className="text-xs font-normal text-muted-foreground">({r.count})</span></span>
          </li>
        ))}
      </ul>
    </div>
  )
}

function TopStores({ data, loading }: { data?: RedemptionOverview; loading: boolean }) {
  const list = data?.topStores ?? []
  const max = Math.max(1, ...list.map((s) => s.amount))
  const canOpen = hasPermission('SEC_VENDORS')
  return (
    <Panel title="Top stores" subtitle="Where card wallets are spent the most" icon={<Crown className="h-4 w-4" />} className="h-full">
      {loading && !data ? <div className="space-y-2">{Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-11 w-full" />)}</div> : list.length === 0 ? (
        <p className="py-10 text-center text-sm text-muted-foreground">No redemptions yet</p>
      ) : (
        <ol className="space-y-1.5">
          {list.map((s, i) => {
            const body = (
              <>
                <span className={cn('flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br text-xs font-bold text-white shadow', avatarGradient(s.storeId))}>
                  {vendorInitials(s.name)}
                </span>
                <span className="min-w-0 flex-1">
                  <span className="flex items-baseline justify-between gap-2">
                    <span className="truncate text-sm font-medium text-foreground">{s.name ?? `Store #${s.storeId}`}</span>
                    <span className="shrink-0 text-sm font-semibold tabular-nums text-foreground">{formatInrShort(s.amount)}</span>
                  </span>
                  <span className="mt-1 flex items-center gap-2">
                    <span className="h-1.5 flex-1 overflow-hidden rounded-full bg-muted">
                      <motion.span className="block h-full rounded-full bg-gradient-to-r from-amber-400 to-orange-600" initial={{ width: 0 }}
                        animate={{ width: `${(s.amount / max) * 100}%` }} transition={{ duration: 1, delay: 0.2 + i * 0.08 }} />
                    </span>
                    <span className="shrink-0 text-[11px] text-muted-foreground">{s.count} times</span>
                  </span>
                </span>
              </>
            )
            return (
              <motion.li key={s.storeId} initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.1 + i * 0.06 }}>
                {canOpen && s.vendorId != null ? (
                  <Link to="/vendors/$vendorId" params={{ vendorId: String(s.vendorId) }} search={{ tab: undefined }} className="flex items-center gap-3 rounded-xl p-2 transition-colors hover:bg-muted/60">{body}</Link>
                ) : <div className="flex items-center gap-3 rounded-xl p-2">{body}</div>}
              </motion.li>
            )
          })}
        </ol>
      )}
    </Panel>
  )
}

function Ranked({ title, subtitle, icon, rows, loading, tone }: {
  title: string; subtitle: string; icon: React.ReactNode; loading: boolean; tone: string
  rows: { key: string; label: string; value: number; hint: string }[]
}) {
  const max = Math.max(1, ...rows.map((r) => r.value))
  return (
    <Panel title={title} subtitle={subtitle} icon={icon} className="h-full">
      {loading && rows.length === 0 ? <div className="space-y-2">{Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-10 w-full" />)}</div> : rows.length === 0 ? (
        <p className="py-10 text-center text-sm text-muted-foreground">Nothing yet</p>
      ) : (
        <ol className="space-y-3">
          {rows.map((r, i) => (
            <motion.li key={r.key} initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.1 + i * 0.06 }}>
              <div className="flex items-baseline justify-between gap-2 text-sm">
                <span className="flex min-w-0 items-center gap-2">
                  <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-md bg-muted text-[10px] font-bold text-muted-foreground">{i + 1}</span>
                  <span className="truncate font-medium text-foreground">{r.label}</span>
                </span>
                <span className="shrink-0 font-semibold tabular-nums text-foreground">{formatInrShort(r.value)}</span>
              </div>
              <div className="mt-1 flex items-center gap-2 pl-7">
                <span className="h-1.5 flex-1 overflow-hidden rounded-full bg-muted">
                  <motion.span className={cn('block h-full rounded-full bg-gradient-to-r', tone)} initial={{ width: 0 }}
                    animate={{ width: `${(r.value / max) * 100}%` }} transition={{ duration: 1, delay: 0.2 + i * 0.08 }} />
                </span>
                <span className="shrink-0 text-[11px] text-muted-foreground">{r.hint}</span>
              </div>
            </motion.li>
          ))}
        </ol>
      )}
    </Panel>
  )
}

