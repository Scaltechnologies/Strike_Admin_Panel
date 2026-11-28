import { Link } from '@tanstack/react-router'
import { motion } from 'framer-motion'
import { Bar, CartesianGrid, ComposedChart, Line, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'
import { Activity, AlertTriangle, CalendarCheck, CheckCircle2, ChevronRight, Clock3, History, LogIn, PieChart as PieIcon, Trophy, XCircle } from 'lucide-react'
import { cn } from '@/lib/utils'
import { Panel } from '@/features/dashboard/components/dashboard-ui'
import { staggerContainer } from '@/features/dashboard/utils/dashboard-format'
import { DonutCard, KpiTile } from '@/features/analytics/components/AnalyticsCharts'
import { SERIES } from '@/features/analytics/api/analytics-insights.api'
import { humanize } from '@/features/audit-logs/utils/audit-display'
import { formatRelative } from '@/utils/helpers/date'
import type { MyActivityRow, MyOverview } from '../api/profile.api'
import { areaMeta, type HealthCheck, type ProfileTab } from '../utils/profile-meta'

const axis = { fontSize: 11, fill: 'var(--color-muted-foreground)' }
const dayLabel = (d: string) => new Date(`${d}T00:00:00`).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })
const hourLabel = (h: number) => (h === 0 ? '12 am' : h < 12 ? `${h} am` : h === 12 ? '12 pm' : `${h - 12} pm`)

export function ScoreRing({ score, size = 112 }: { score: number; size?: number }) {
  const r = size / 2 - 10
  const c = 2 * Math.PI * r
  const color = score >= 75 ? '#10b981' : score >= 50 ? '#f59e0b' : '#ef4444'
  return (
    <div className="relative shrink-0" style={{ width: size, height: size }}>
      <svg viewBox={`0 0 ${size} ${size}`} className="-rotate-90" width={size} height={size}>
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="var(--color-muted)" strokeWidth="10" />
        <motion.circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke={color} strokeWidth="10" strokeLinecap="round" strokeDasharray={c}
          initial={{ strokeDashoffset: c }} animate={{ strokeDashoffset: c - (c * score) / 100 }} transition={{ duration: 1.1, ease: 'easeOut' }} />
      </svg>
      <span className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="text-2xl font-bold text-foreground">{score}%</span>
        <span className="text-[10px] font-medium uppercase tracking-wider text-muted-foreground">{score >= 75 ? 'Safe' : score >= 50 ? 'Okay' : 'At risk'}</span>
      </span>
    </div>
  )
}

export function HealthList({ checks, go }: { checks: HealthCheck[]; go: (t: ProfileTab) => void }) {
  return (
    <ul className="space-y-2">
      {checks.map((c, i) => (
        <motion.li key={c.id} initial={{ opacity: 0, x: -8 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.05 * i }}
          className={cn('flex items-start gap-3 rounded-xl border p-3', c.ok ? 'border-border bg-muted/30' : 'border-amber-300/60 bg-amber-50 dark:border-amber-400/20 dark:bg-amber-400/5')}>
          {c.ok ? <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-emerald-500" /> : <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-amber-500" />}
          <div className="min-w-0 flex-1">
            <p className="text-sm font-medium text-foreground">{c.label}</p>
            <p className="text-xs text-muted-foreground">{c.detail}</p>
            {!c.ok && c.fix && (
              <button type="button" onClick={() => go(c.fix!.tab)} className="mt-2 rounded-lg bg-amber-500 px-2.5 py-1 text-xs font-semibold text-white hover:bg-amber-600">{c.fix.label}</button>
            )}
          </div>
        </motion.li>
      ))}
    </ul>
  )
}

export function ActivityLine({ row }: { row: MyActivityRow }) {
  const meta = areaMeta(row.entityType)
  const Icon = meta.icon
  const failed = row.outcome === 'FAILED'
  return (
    <div className="flex items-center gap-3 py-2.5">
      <span className={cn('flex h-8 w-8 shrink-0 items-center justify-center rounded-xl', failed ? 'bg-rose-100 text-rose-600 dark:bg-rose-400/10 dark:text-rose-300' : 'bg-primary/10 text-primary')}>
        <Icon className="h-4 w-4" />
      </span>
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-medium text-foreground">{row.summary?.trim() || humanize(row.action)}</p>
        <p className="truncate text-xs text-muted-foreground">{meta.label}{failed && <span className="ml-1.5 font-semibold text-rose-600 dark:text-rose-400">· didn’t go through</span>}</p>
      </div>
      <span className="shrink-0 text-xs text-muted-foreground">{formatRelative(row.createdAt)}</span>
    </div>
  )
}

export function ProfileOverview({ data, loading, days, onDays, health, go }: {
  data?: MyOverview; loading: boolean; days: number; onDays: (d: number) => void
  health: { score: number; checks: HealthCheck[] }; go: (t: ProfileTab) => void
}) {
  const a = data?.activity
  const s = data?.signIns
  const series = data?.series ?? []
  const hours = data?.hours ?? []
  const maxHour = Math.max(1, ...hours)
  const busiest = hours.length ? hours.indexOf(Math.max(...hours)) : -1
  const successRate = a && a.actions ? Math.round(((a.actions - a.failed) / a.actions) * 100) : undefined

  return (
    <motion.div variants={staggerContainer} initial="hidden" animate="show" className="flex flex-col gap-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="text-sm text-muted-foreground">What you’ve done in the admin panel. Only you can see this page.</p>
        <div className="flex rounded-xl border border-border bg-card p-1 text-xs font-medium">
          {[7, 30, 90].map((d) => (
            <button key={d} type="button" onClick={() => onDays(d)}
              className={cn('relative rounded-lg px-3 py-1.5 transition-colors', days === d ? 'text-primary-foreground' : 'text-muted-foreground hover:text-foreground')}>
              {days === d && <motion.span layoutId="profile-days" className="absolute inset-0 rounded-lg bg-primary" transition={{ type: 'spring', stiffness: 500, damping: 38 }} />}
              <span className="relative">{d} days</span>
            </button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <KpiTile label="Changes I made" icon={Activity} tone="from-[#e01a00] to-[#ff6a00]" now={a?.actions} before={a?.actionsPrevious}
          spark={series.map((x) => x.actions)} loading={loading} hint={a ? `${a.actionsToday} today · ${a.allTime} all time` : undefined} onClick={() => go('activity')} />
        <KpiTile label="Days active" icon={CalendarCheck} tone="from-violet-500 to-fuchsia-600" now={a?.daysActive} loading={loading} hint={`of the last ${days} days`} />
        <KpiTile label="Sign-ins" icon={LogIn} tone="from-sky-400 to-indigo-600" now={s?.signIns} before={s?.signInsPrevious}
          spark={series.map((x) => x.signIns)} loading={loading} hint={s ? `${s.devices} browser${s.devices === 1 ? '' : 's'} · ${s.places} network${s.places === 1 ? '' : 's'}` : undefined} onClick={() => go('security')} />
        <KpiTile label="Went through first time (%)" icon={CheckCircle2} tone="from-emerald-400 to-teal-600" now={successRate} loading={loading}
          hint={a ? (a.failed ? `${a.failed} change${a.failed === 1 ? '' : 's'} didn’t go through` : 'nothing failed') : undefined} />
      </div>

      <div className="grid gap-4 xl:grid-cols-3">
        <Panel title="My activity by day" subtitle="Changes made (bars) and sign-ins (line)" icon={<Activity className="h-4 w-4" />} className="xl:col-span-2">
          {loading ? <div className="h-64 animate-pulse rounded-xl bg-muted" /> : (
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <ComposedChart data={series} margin={{ top: 8, right: 8, left: -18, bottom: 0 }}>
                  <CartesianGrid vertical={false} stroke="var(--color-border)" strokeDasharray="3 3" />
                  <XAxis dataKey="day" tickFormatter={dayLabel} tick={axis} tickLine={false} axisLine={false} minTickGap={24} />
                  <YAxis allowDecimals={false} tick={axis} tickLine={false} axisLine={false} />
                  <Tooltip cursor={{ fill: 'var(--color-muted)', opacity: 0.5 }}
                    contentStyle={{ background: 'var(--color-popover)', border: '1px solid var(--color-border)', borderRadius: 12, fontSize: 12 }}
                    labelFormatter={(d) => dayLabel(String(d))} formatter={(v, n) => [v, n === 'actions' ? 'Changes' : 'Sign-ins']} />
                  <Bar dataKey="actions" fill={SERIES[1]} radius={[4, 4, 0, 0]} maxBarSize={18} />
                  <Line dataKey="signIns" stroke={SERIES[0]} strokeWidth={2} dot={false} type="monotone" />
                </ComposedChart>
              </ResponsiveContainer>
            </div>
          )}
          <div className="mt-2 flex gap-4 text-xs text-muted-foreground">
            <span className="inline-flex items-center gap-1.5"><span className="h-2.5 w-2.5 rounded-sm" style={{ background: SERIES[1] }} />Changes</span>
            <span className="inline-flex items-center gap-1.5"><span className="h-0.5 w-3 rounded" style={{ background: SERIES[0] }} />Sign-ins</span>
          </div>
        </Panel>

        <Panel title="Account safety" subtitle="Quick checks on your login" icon={<Trophy className="h-4 w-4" />}>
          <div className="flex flex-col items-center gap-4">
            <ScoreRing score={health.score} />
            <div className="w-full"><HealthList checks={health.checks.filter((c) => !c.ok).slice(0, 2)} go={go} /></div>
            {health.checks.every((c) => c.ok) && <p className="text-center text-sm text-muted-foreground">Everything looks good. Nice work.</p>}
            <button type="button" onClick={() => go('security')} className="inline-flex items-center gap-1 text-xs font-semibold text-primary hover:underline">See all checks <ChevronRight className="h-3.5 w-3.5" /></button>
          </div>
        </Panel>
      </div>

      <div className="grid gap-4 xl:grid-cols-3">
        <DonutCard title="Where I work" subtitle="Changes by area" icon={<PieIcon className="h-4 w-4" />} loading={loading}
          rows={(data?.areas ?? []).map((r, i) => ({ name: areaMeta(r.area).label, value: Number(r.count), color: SERIES[i % SERIES.length] }))} />

        <Panel title="What I do most" subtitle={`Top actions in ${days} days`} icon={<Trophy className="h-4 w-4" />}>
          {loading ? <div className="h-48 animate-pulse rounded-xl bg-muted" /> : !data?.topActions.length ? (
            <p className="flex h-40 items-center justify-center text-sm text-muted-foreground">No changes in this period</p>
          ) : (
            <ul className="space-y-2.5">
              {data.topActions.map((t, i) => {
                const pct = Math.round((Number(t.count) / Number(data.topActions[0].count)) * 100)
                return (
                  <li key={t.action}>
                    <div className="mb-1 flex items-center justify-between gap-2 text-sm">
                      <span className="truncate text-foreground">{humanize(t.action)}</span>
                      <span className="shrink-0 tabular-nums text-muted-foreground">{t.count}{Number(t.failed) > 0 && <XCircle className="ml-1 inline h-3.5 w-3.5 text-rose-500" aria-label={`${t.failed} failed`} />}</span>
                    </div>
                    <div className="h-1.5 overflow-hidden rounded-full bg-muted">
                      <motion.div className="h-full rounded-full" style={{ background: SERIES[i % SERIES.length] }}
                        initial={{ width: 0 }} animate={{ width: `${pct}%` }} transition={{ duration: 0.7, delay: i * 0.05 }} />
                    </div>
                  </li>
                )
              })}
            </ul>
          )}
        </Panel>

        <Panel title="When I work" subtitle={busiest >= 0 && hours[busiest] > 0 ? `Busiest around ${hourLabel(busiest)} (India time)` : 'Changes by hour of day'} icon={<Clock3 className="h-4 w-4" />}>
          {loading ? <div className="h-48 animate-pulse rounded-xl bg-muted" /> : (
            <div>
              <div className="flex h-36 items-end gap-[3px]">
                {Array.from({ length: 24 }, (_, h) => {
                  const v = hours[h] ?? 0
                  return (
                    <div key={h} className="group relative flex h-full flex-1 items-end">
                      <motion.div className={cn('w-full rounded-t-[4px]', v ? 'bg-gradient-to-t from-[#e01a00] to-[#ff8a3d]' : 'bg-muted')}
                        initial={{ height: 0 }} animate={{ height: `${Math.max(v ? 8 : 4, (v / maxHour) * 100)}%` }} transition={{ duration: 0.6, delay: h * 0.015 }} />
                      <span className="pointer-events-none absolute -top-7 left-1/2 z-10 hidden -translate-x-1/2 whitespace-nowrap rounded-md bg-popover px-1.5 py-0.5 text-[10px] text-foreground shadow ring-1 ring-border group-hover:block">
                        {hourLabel(h)} · {v}
                      </span>
                    </div>
                  )
                })}
              </div>
              <div className="mt-1.5 flex justify-between text-[10px] text-muted-foreground"><span>12 am</span><span>6 am</span><span>12 pm</span><span>6 pm</span><span>11 pm</span></div>
            </div>
          )}
        </Panel>
      </div>

      <Panel title="Latest changes" subtitle="The last things you did" icon={<History className="h-4 w-4" />}
        action={<Link to="/profile" search={{ tab: 'activity' }} className="inline-flex items-center gap-1 text-xs font-semibold text-primary hover:underline">See everything <ChevronRight className="h-3.5 w-3.5" /></Link>}>
        {loading ? <div className="h-40 animate-pulse rounded-xl bg-muted" /> : !data?.recent.length ? (
          <p className="py-8 text-center text-sm text-muted-foreground">Nothing yet. Changes you make in the panel will show up here.</p>
        ) : (
          <div className="divide-y divide-border">{data.recent.map((r) => <ActivityLine key={r.id} row={r} />)}</div>
        )}
      </Panel>
    </motion.div>
  )
}
