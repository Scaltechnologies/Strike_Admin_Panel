import { useMemo, useState, type ReactNode } from 'react'
import { Link } from '@tanstack/react-router'
import { motion } from 'framer-motion'
import { ArrowDownRight, ArrowUpRight, Minus, type LucideIcon } from 'lucide-react'
import { Area, Bar, BarChart, CartesianGrid, Cell, ComposedChart, Line, Pie, PieChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'
import { cn } from '@/lib/utils'
import { AnimatedNumber, Panel, Skeleton, Sparkline } from '@/features/dashboard/components/dashboard-ui'
import { riseIn } from '@/features/dashboard/utils/dashboard-format'
import { avatarGradient, formatInrFull, formatInrShort, vendorInitials } from '@/features/vendors/utils/vendor-meta'
import { SEQ, SERIES, type AnalyticsInsights, type SeriesMetric } from '../api/analytics-insights.api'
import { METRICS, WEEKDAYS, bucketLabel, change } from '../utils/analytics-format'

const axis = { fontSize: 11, fill: 'var(--color-muted-foreground)' }
export function Delta({ value, invert, className }: { value: number | null; invert?: boolean; className?: string }) {
  if (value == null) return <span className={cn('rounded-full bg-sky-100 px-1.5 py-px text-[10px] font-bold text-sky-700 dark:bg-sky-400/10 dark:text-sky-300', className)}>new</span>
  const good = invert ? value < 0 : value > 0
  const Icon = value === 0 ? Minus : value > 0 ? ArrowUpRight : ArrowDownRight
  return (
    <span className={cn('inline-flex items-center gap-0.5 rounded-full px-1.5 py-px text-[10px] font-bold tabular-nums',
      value === 0 ? 'bg-muted text-muted-foreground' : good ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-400/10 dark:text-emerald-300' : 'bg-rose-100 text-rose-700 dark:bg-rose-400/10 dark:text-rose-300', className)}>
      <Icon className="h-3 w-3" />{Math.abs(value)}%
    </span>
  )
}

// ── KPI tile ─────────────────────────────────────────────────────────────────

export function KpiTile({ label, icon: Icon, tone, now, before, money, invert, spark, hint, loading, onClick, active }: {
  label: string; icon: LucideIcon; tone: string; now?: number; before?: number; money?: boolean; invert?: boolean
  spark?: number[]; hint?: string; loading?: boolean; onClick?: () => void; active?: boolean
}) {
  const Comp = onClick ? motion.button : motion.div
  return (
    <Comp type={onClick ? 'button' : undefined} onClick={onClick} variants={riseIn} whileHover={{ y: -4 }}
      className={cn('group relative overflow-hidden rounded-2xl border bg-card p-4 text-left shadow-sm transition-shadow hover:shadow-xl hover:shadow-black/[0.05]',
        active ? 'border-primary ring-2 ring-primary/25' : 'border-border')}>
      <span className={cn('pointer-events-none absolute -right-8 -top-8 h-24 w-24 rounded-full bg-gradient-to-br opacity-15 blur-xl transition-opacity group-hover:opacity-30', tone)} aria-hidden />
      <div className="flex items-start justify-between gap-2">
        <span className={cn('flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br text-white shadow-md', tone)}><Icon className="h-4 w-4" /></span>
        {!loading && <Delta value={change(now, before)} invert={invert} />}
      </div>
      {loading ? <Skeleton className="mt-3 h-7 w-24" /> : (
        <AnimatedNumber value={Number(now ?? 0)} format={money ? formatInrShort : undefined} className="mt-3 block text-2xl font-bold text-foreground" />
      )}
      <p className="mt-0.5 text-xs text-muted-foreground">{label}</p>
      <p className="mt-0.5 truncate text-[10px] text-muted-foreground/80">
        {hint ?? (before != null ? `was ${money ? formatInrShort(before) : Number(before).toLocaleString('en-IN')}` : '')}
      </p>
      {spark && spark.length > 1 && <Sparkline values={spark} color="#257de0" className="mt-1 h-7 opacity-70 transition-opacity group-hover:opacity-100" />}
    </Comp>
  )
}

// ── This period vs the previous one (one axis, same metric) ──────────────────

export function CompareChart({ data, loading, metric, onMetric }: {
  data?: AnalyticsInsights; loading: boolean; metric: SeriesMetric; onMetric: (m: SeriesMetric) => void
}) {
  const m = METRICS.find((x) => x.id === metric)!
  const rows = data?.series ?? []
  const fmt = (v: number) => (m.money ? formatInrShort(v) : v.toLocaleString('en-IN'))
  const totalNow = rows.reduce((s, r) => s + Number(r[metric] ?? 0), 0)
  const totalBefore = rows.reduce((s, r) => s + Number(r[`prev_${metric}`] ?? 0), 0)
  return (
    <Panel title={`${m.label}: this period vs the one before`}
      subtitle={data ? `${bucketLabel(data.from, 'day')} – ${bucketLabel(data.to, 'day')} (solid) vs ${bucketLabel(data.previousFrom, 'day')} – ${bucketLabel(data.previousTo, 'day')} (dashed), per ${data.bucket}` : undefined}
      action={
        <div className="flex flex-wrap justify-end gap-1 rounded-xl bg-muted/60 p-1">
          {METRICS.map((x) => (
            <button key={x.id} type="button" onClick={() => onMetric(x.id)}
              className={cn('relative rounded-lg px-2.5 py-1 text-[11px] font-medium', metric === x.id ? 'text-foreground' : 'text-muted-foreground hover:text-foreground')}>
              {metric === x.id && <motion.span layoutId="an-metric" className="absolute inset-0 rounded-lg bg-card shadow-sm" transition={{ type: 'spring', stiffness: 500, damping: 35 }} />}
              <span className="relative">{x.label}</span>
            </button>
          ))}
        </div>
      }>
      <div className="mb-3 flex flex-wrap items-center gap-x-5 gap-y-1 text-xs">
        <span className="flex items-center gap-2"><span className="h-0.5 w-5 rounded bg-[#257de0]" /><span className="text-muted-foreground">This period</span><b className="tabular-nums text-foreground">{fmt(totalNow)}</b></span>
        <span className="flex items-center gap-2"><span className="h-0 w-5 border-t-2 border-dashed border-slate-400" /><span className="text-muted-foreground">Previous</span><b className="tabular-nums text-foreground">{fmt(totalBefore)}</b></span>
        <Delta value={change(totalNow, totalBefore)} />
      </div>
      {loading && !data ? <Skeleton className="h-[300px] w-full" /> : (
        <div className="h-[300px]">
          <ResponsiveContainer width="100%" height="100%">
            <ComposedChart data={rows} margin={{ top: 8, right: 8, left: -4, bottom: 0 }}>
              <defs>
                <linearGradient id="an-now" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor="#257de0" stopOpacity={0.35} /><stop offset="100%" stopColor="#257de0" stopOpacity={0} /></linearGradient>
              </defs>
              <CartesianGrid vertical={false} stroke="var(--color-border)" strokeDasharray="3 3" />
              <XAxis dataKey="key" tickFormatter={(k: string) => bucketLabel(k, data?.bucket ?? 'day')} tickLine={false} axisLine={false} tick={axis} minTickGap={20} />
              <YAxis tickFormatter={fmt} tickLine={false} axisLine={false} width={58} tick={axis} allowDecimals={false} />
              <Tooltip cursor={{ stroke: 'var(--color-muted-foreground)', strokeDasharray: '4 4' }}
                content={({ active, payload, label }) => {
                  if (!active || !payload?.length) return null
                  const now = Number(payload.find((p) => p.dataKey === metric)?.value ?? 0)
                  const prev = Number(payload.find((p) => p.dataKey === `prev_${metric}`)?.value ?? 0)
                  return (
                    <div className="rounded-xl border border-border bg-popover px-3 py-2 text-xs shadow-lg">
                      <p className="mb-1.5 font-semibold text-foreground">{bucketLabel(String(label), data?.bucket ?? 'day')}</p>
                      <p className="flex items-center gap-2 text-muted-foreground"><span className="h-2 w-2 rounded-full bg-[#257de0]" />This period <b className="ml-auto pl-3 tabular-nums text-foreground">{fmt(now)}</b></p>
                      <p className="flex items-center gap-2 text-muted-foreground"><span className="h-2 w-2 rounded-full bg-slate-400" />Previous <b className="ml-auto pl-3 tabular-nums text-foreground">{fmt(prev)}</b></p>
                      <div className="mt-1.5 text-right"><Delta value={change(now, prev)} /></div>
                    </div>
                  )
                }} />
              <Line type="monotone" dataKey={`prev_${metric}`} stroke="#94a3b8" strokeWidth={2} strokeDasharray="5 5" dot={false} activeDot={{ r: 4 }} animationDuration={900} />
              <Area type="monotone" dataKey={metric} stroke="#257de0" strokeWidth={2.5} fill="url(#an-now)" dot={false} activeDot={{ r: 5, strokeWidth: 2, stroke: 'var(--color-card)' }} animationDuration={1200} />
            </ComposedChart>
          </ResponsiveContainer>
        </div>
      )}
    </Panel>
  )
}

// ── Donut with legend + values (identity never colour-alone) ─────────────────

export function DonutCard({ title, subtitle, icon, rows, loading, money }: {
  title: string; subtitle?: string; icon: ReactNode; loading: boolean; money?: boolean
  rows: { name: string; value: number; color?: string }[]
}) {
  const [active, setActive] = useState<number>()
  const data = rows.filter((r) => r.value > 0).map((r, i) => ({ ...r, color: r.color ?? SERIES[i % SERIES.length] }))
  const total = data.reduce((s, r) => s + r.value, 0)
  const focus = active != null ? data[active] : undefined
  const fmt = (v: number) => (money ? formatInrShort(v) : v.toLocaleString('en-IN'))
  return (
    <Panel title={title} subtitle={subtitle} icon={icon} className="h-full">
      {loading ? <Skeleton className="h-56 w-full" /> : total === 0 ? <p className="flex h-48 items-center justify-center text-sm text-muted-foreground">Nothing in this period</p> : (
        <div className="flex flex-col items-center gap-3">
          <div className="relative h-[170px] w-[170px]">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={data} dataKey="value" nameKey="name" innerRadius="62%" outerRadius="94%" paddingAngle={data.length > 1 ? 2 : 0} cornerRadius={4}
                  stroke="var(--color-card)" strokeWidth={2} animationDuration={1000} onMouseEnter={(_, i) => setActive(i)} onMouseLeave={() => setActive(undefined)}>
                  {data.map((d, i) => <Cell key={d.name} fill={d.color} fillOpacity={active == null || active === i ? 1 : 0.3} style={{ transition: 'fill-opacity 200ms ease', cursor: 'pointer' }} />)}
                </Pie>
              </PieChart>
            </ResponsiveContainer>
            <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center px-4 text-center">
              <motion.span key={focus?.name ?? 'total'} initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} className="text-lg font-bold tabular-nums text-foreground">
                {focus ? `${Math.round((focus.value / total) * 100)}%` : fmt(total)}
              </motion.span>
              <span className="truncate text-[11px] text-muted-foreground">{focus ? focus.name : 'total'}</span>
            </div>
          </div>
          <ul className="flex w-full flex-col gap-1">
            {data.map((d, i) => (
              <li key={d.name} onMouseEnter={() => setActive(i)} onMouseLeave={() => setActive(undefined)}
                className={cn('flex cursor-default items-center justify-between gap-2 rounded-lg px-3 py-1.5 text-xs transition-colors', active === i ? 'bg-muted' : 'bg-muted/40')}>
                <span className="flex min-w-0 items-center gap-2 text-muted-foreground"><span className="h-2.5 w-2.5 shrink-0 rounded-full" style={{ background: d.color }} /><span className="truncate">{d.name}</span></span>
                <span className="shrink-0 font-semibold tabular-nums text-foreground">{fmt(d.value)} <span className="font-normal text-muted-foreground">· {Math.round((d.value / total) * 100)}%</span></span>
              </li>
            ))}
          </ul>
        </div>
      )}
    </Panel>
  )
}

// ── Funnel ───────────────────────────────────────────────────────────────────

export function Funnel({ rows, loading }: { rows: AnalyticsInsights['funnel']; loading: boolean }) {
  const top = Math.max(1, rows[0]?.count ?? 0)
  return (
    <div className="flex flex-col gap-3">
      {loading ? <Skeleton className="h-48 w-full" /> : rows.map((r, i) => {
        const pct = (r.count / top) * 100
        const step = i > 0 && rows[i - 1].count > 0 ? Math.round((r.count / rows[i - 1].count) * 100) : null
        return (
          <motion.div key={r.step} initial={{ opacity: 0, x: -12 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.1 }}>
            <div className="mb-1 flex items-baseline justify-between text-sm">
              <span className="font-medium text-foreground">{r.step}</span>
              <span className="text-xs text-muted-foreground"><b className="text-sm tabular-nums text-foreground">{r.count.toLocaleString('en-IN')}</b>{step != null && ` · ${step}% of the step before`}</span>
            </div>
            <div className="h-8 overflow-hidden rounded-lg bg-muted">
              <motion.div className="flex h-full items-center rounded-lg px-2 text-[11px] font-semibold text-white" style={{ background: SEQ[7 - i * 2] }}
                initial={{ width: 0 }} animate={{ width: `${Math.max(pct, r.count ? 4 : 0)}%` }} transition={{ duration: 1, delay: 0.15 + i * 0.12, ease: 'easeOut' }}>
                {pct >= 12 && `${Math.round(pct)}%`}
              </motion.div>
            </div>
          </motion.div>
        )
      })}
    </div>
  )
}

// ── Weekday × hour heatmap (sequential, one hue) ─────────────────────────────

export function Heatmap({ cells, loading }: { cells: AnalyticsInsights['heatmap']; loading: boolean }) {
  const [hover, setHover] = useState<{ day: number; hour: number; count: number } | null>(null)
  const grid = useMemo(() => {
    const g = Array.from({ length: 7 }, () => Array(24).fill(0) as number[])
    for (const c of cells) if (c.day >= 1 && c.day <= 7 && c.hour >= 0 && c.hour < 24) g[c.day - 1][c.hour] = c.count
    return g
  }, [cells])
  const max = Math.max(0, ...grid.flat())
  const shade = (n: number) => (n === 0 ? 'var(--color-muted)' : SEQ[Math.min(SEQ.length - 1, 1 + Math.floor((n / max) * (SEQ.length - 2)))])
  const peak = max > 0 ? (() => { for (let d = 0; d < 7; d++) for (let h = 0; h < 24; h++) if (grid[d][h] === max) return { d, h }; return null })() : null
  if (loading) return <Skeleton className="h-56 w-full" />
  return (
    <div className="flex flex-col gap-3">
      <p className="h-4 text-xs text-muted-foreground">
        {hover ? <><b className="text-foreground">{WEEKDAYS[hover.day]} {hour(hover.hour)}</b> — {hover.count} card{hover.count === 1 ? '' : 's'} sold</>
          : peak ? <>Busiest: <b className="text-foreground">{WEEKDAYS[peak.d]} around {hour(peak.h)}</b> ({max} sold)</> : 'No purchases in this period'}
      </p>
      <div className="overflow-x-auto">
        <div className="grid min-w-[620px] gap-[3px]" style={{ gridTemplateColumns: '36px repeat(24, minmax(0, 1fr))' }}>
          <span />
          {Array.from({ length: 24 }, (_, h) => <span key={h} className="text-center text-[9px] text-muted-foreground">{h % 3 === 0 ? hour(h) : ''}</span>)}
          {grid.map((row, d) => (
            <div key={d} className="contents">
              <span className="flex items-center text-[10px] font-medium text-muted-foreground">{WEEKDAYS[d]}</span>
              {row.map((n, h) => (
                <motion.span key={h} initial={{ opacity: 0, scale: 0.4 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: (d * 24 + h) * 0.002 }}
                  onMouseEnter={() => setHover({ day: d, hour: h, count: n })} onMouseLeave={() => setHover(null)}
                  className={cn('aspect-square rounded-[4px] transition-transform hover:z-10 hover:scale-125 hover:ring-2 hover:ring-card', n === max && max > 0 && 'ring-2 ring-[#f2a600]')}
                  style={{ background: shade(n) }} aria-label={`${WEEKDAYS[d]} ${hour(h)}: ${n}`} />
              ))}
            </div>
          ))}
        </div>
      </div>
      <div className="flex items-center justify-end gap-1.5 text-[10px] text-muted-foreground">
        Fewer {SEQ.slice(1).map((c) => <span key={c} className="h-2.5 w-4 rounded-sm" style={{ background: c }} />)} More
      </div>
    </div>
  )
}

const hour = (h: number) => (h === 0 ? '12a' : h < 12 ? `${h}a` : h === 12 ? '12p' : `${h - 12}p`)

// ── Top vendors with growth ──────────────────────────────────────────────────

export function TopVendors({ rows, loading }: { rows: AnalyticsInsights['topVendors']; loading: boolean }) {
  const max = Math.max(1, ...rows.map((r) => Number(r.revenue)))
  if (loading) return <div className="space-y-2">{Array.from({ length: 5 }).map((_, i) => <Skeleton key={i} className="h-12 w-full" />)}</div>
  if (!rows.length) return <p className="py-10 text-center text-sm text-muted-foreground">No sales in this period</p>
  return (
    <ol className="flex flex-col gap-1">
      {rows.map((v, i) => (
        <motion.li key={v.vendorId} initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.05 * i }}>
          <Link to="/vendors/$vendorId" params={{ vendorId: String(v.vendorId) }} search={{ tab: undefined }} className="group flex items-center gap-3 rounded-xl p-2 transition-colors hover:bg-muted/60">
            <span className="w-4 text-center text-xs font-bold text-muted-foreground">{i + 1}</span>
            <span className={cn('flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br text-xs font-bold text-white shadow', avatarGradient(v.vendorId))}>{vendorInitials(v.name)}</span>
            <span className="min-w-0 flex-1">
              <span className="flex items-center justify-between gap-2">
                <span className="truncate text-sm font-medium text-foreground group-hover:text-primary">{v.name ?? `Vendor #${v.vendorId}`}</span>
                <span className="flex shrink-0 items-center gap-2"><Delta value={change(v.revenue, v.previous)} /><b className="text-sm tabular-nums">{formatInrShort(v.revenue)}</b></span>
              </span>
              <span className="mt-1 flex items-center gap-2">
                <span className="h-1.5 flex-1 overflow-hidden rounded-full bg-muted">
                  <motion.span className="block h-full rounded-full bg-[#257de0]" initial={{ width: 0 }} animate={{ width: `${(Number(v.revenue) / max) * 100}%` }} transition={{ duration: 1, delay: 0.2 + i * 0.06 }} />
                </span>
                <span className="shrink-0 text-[11px] text-muted-foreground">{v.cardsSold} cards</span>
              </span>
            </span>
          </Link>
        </motion.li>
      ))}
    </ol>
  )
}

// ── Single-series bar (price bands) ──────────────────────────────────────────

export function PriceBands({ rows, loading }: { rows: AnalyticsInsights['priceBands']; loading: boolean }) {
  const data = rows.map((r) => ({ ...r, label: r.to < 0 ? `₹${r.from / 1000}k+` : r.from >= 1000 ? `₹${r.from / 1000}–${r.to / 1000}k` : `₹${r.from}–${r.to}` }))
  if (loading) return <Skeleton className="h-52 w-full" />
  return (
    <div className="h-[210px]">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data} margin={{ top: 16, right: 4, left: -24, bottom: 0 }} barCategoryGap="22%">
          <CartesianGrid vertical={false} stroke="var(--color-border)" strokeDasharray="3 3" />
          <XAxis dataKey="label" tickLine={false} axisLine={false} tick={{ ...axis, fontSize: 10 }} interval={0} />
          <YAxis allowDecimals={false} tickLine={false} axisLine={false} tick={axis} />
          <Tooltip cursor={{ fill: 'var(--color-muted)', opacity: 0.5 }} formatter={(v, _n, p) => [`${v} cards · ${formatInrFull(Number((p.payload as { amount: number }).amount))}`, 'Sold']}
            contentStyle={{ borderRadius: 12, border: '1px solid var(--color-border)', background: 'var(--color-popover)', fontSize: 12 }} />
          <Bar dataKey="count" fill="#257de0" radius={[4, 4, 0, 0]} maxBarSize={44} animationDuration={1000} label={{ position: 'top', fontSize: 10, fill: 'var(--color-muted-foreground)' }} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  )
}

export function MiniStat({ label, value, sub }: { label: string; value: string; sub?: ReactNode }) {
  return (
    <div className="rounded-xl bg-muted/50 px-3 py-2.5">
      <p className="text-[11px] text-muted-foreground">{label}</p>
      <p className="mt-0.5 text-base font-bold tabular-nums text-foreground">{value}</p>
      {sub && <div className="mt-0.5 text-[10px] text-muted-foreground">{sub}</div>}
    </div>
  )
}
