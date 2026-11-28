import { motion } from 'framer-motion'
import { Area, Bar, CartesianGrid, ComposedChart, Line, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'
import { AlertTriangle, BellRing, Eye, Inbox, Megaphone, PieChart as PieIcon, Send, Smartphone, TrendingUp, Users, Zap } from 'lucide-react'
import { cn } from '@/lib/utils'
import { Panel } from '@/features/dashboard/components/dashboard-ui'
import { staggerContainer } from '@/features/dashboard/utils/dashboard-format'
import { DonutCard, KpiTile } from '@/features/analytics/components/AnalyticsCharts'
import { SERIES } from '@/features/analytics/api/analytics-insights.api'
import { formatRelative } from '@/utils/helpers/date'
import type { CenterOverview } from '../../api/notification-center.api'
import { eventMeta, failText, type NotificationsTab } from '../../utils/notify-meta'

const axis = { fontSize: 11, fill: 'var(--color-muted-foreground)' }
const dayLabel = (d: string) => new Date(`${d}T00:00:00`).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })

function Gauge({ label, part, whole, tone, icon: Icon }: { label: string; part: number; whole: number; tone: string; icon: typeof Users }) {
  const pct = whole ? Math.round((part / whole) * 100) : 0
  const r = 34
  const c = 2 * Math.PI * r
  return (
    <div className="flex items-center gap-4">
      <div className="relative h-20 w-20 shrink-0">
        <svg viewBox="0 0 80 80" className="h-20 w-20 -rotate-90">
          <circle cx="40" cy="40" r={r} fill="none" stroke="var(--color-muted)" strokeWidth="8" />
          <motion.circle cx="40" cy="40" r={r} fill="none" stroke={tone} strokeWidth="8" strokeLinecap="round" strokeDasharray={c}
            initial={{ strokeDashoffset: c }} animate={{ strokeDashoffset: c - (c * pct) / 100 }} transition={{ duration: 1, ease: 'easeOut' }} />
        </svg>
        <span className="absolute inset-0 flex items-center justify-center text-lg font-bold text-foreground">{pct}%</span>
      </div>
      <div>
        <p className="inline-flex items-center gap-1.5 text-sm font-semibold text-foreground"><Icon className="h-4 w-4 text-muted-foreground" />{label}</p>
        <p className="text-xs text-muted-foreground">{part.toLocaleString('en-IN')} of {whole.toLocaleString('en-IN')} can get a push</p>
        <p className="text-[11px] text-muted-foreground">The rest only see in-app messages.</p>
      </div>
    </div>
  )
}

export function CenterOverview({ data, loading, days, onDays, go }: { data: CenterOverview | undefined; loading: boolean; days: number; onDays: (d: number) => void; go: (t: NotificationsTab) => void }) {
  const p = data?.push
  const ia = data?.inApp
  const readRate = ia?.personal ? (ia.read / ia.personal) * 100 : 0
  const delivery = p && p.sent + p.failed ? (p.sent / (p.sent + p.failed)) * 100 : 0
  const devices = data?.devices ?? []
  const byPlatform = devices.reduce<Record<string, number>>((m, d) => { m[d.platform] = (m[d.platform] ?? 0) + Number(d.active); return m }, {})
  const topMax = Math.max(1, ...(data?.topEvents ?? []).map((e) => e.total))

  return (
    <motion.div variants={staggerContainer} initial="hidden" animate="show" className="flex flex-col gap-5">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <p className="text-sm text-muted-foreground">Compared with the {days} days before</p>
        <div className="flex gap-1 rounded-xl border border-border bg-card p-1">
          {[7, 30, 90].map((d) => (
            <button key={d} type="button" onClick={() => onDays(d)} className={cn('rounded-lg px-3 py-1 text-xs font-medium', days === d ? 'bg-foreground text-background' : 'text-muted-foreground hover:bg-muted')}>{d} days</button>
          ))}
        </div>
      </div>

      <motion.div variants={staggerContainer} className="grid grid-cols-2 gap-3 md:grid-cols-3 xl:grid-cols-5">
        <KpiTile label="Push delivered" icon={BellRing} tone="from-[#e01a00] to-[#ff6a00]" now={p?.sent} before={p?.sent_previous} spark={(data?.series ?? []).map((s) => Number(s.push))} loading={loading} hint={p ? `${p.sent_today} today` : undefined} />
        <KpiTile label="In-app messages" icon={Inbox} tone="from-violet-500 to-fuchsia-600" now={ia?.sent} before={ia?.sent_previous} spark={(data?.series ?? []).map((s) => Number(s.inApp))} loading={loading} hint={ia ? `${ia.broadcasts} to everyone` : undefined} />
        <KpiTile label="Push reached (%)" icon={Zap} tone="from-emerald-400 to-teal-600" now={Math.round(delivery)} loading={loading} hint={p ? `${p.failed} couldn’t be reached` : undefined} />
        <KpiTile label="In-app read (%)" icon={Eye} tone="from-sky-400 to-indigo-600" now={Math.round(readRate)} loading={loading} hint={ia ? `${ia.unread_now} unread right now` : undefined} />
        <KpiTile label="Held back (switched off)" icon={AlertTriangle} tone="from-amber-400 to-orange-600" now={p?.muted} loading={loading} hint="Automatic ones you turned off" />
      </motion.div>

      <div className="grid gap-5 xl:grid-cols-3">
        <Panel title="Sent each day" subtitle={`Last ${days} days, India time`} icon={<TrendingUp className="h-4 w-4" />} className="xl:col-span-2">
          <div className="mb-3 flex flex-wrap gap-4 text-xs">
            <span className="inline-flex items-center gap-1.5"><span className="h-2.5 w-2.5 rounded-sm bg-[#257de0]" />Push delivered</span>
            <span className="inline-flex items-center gap-1.5"><span className="h-2.5 w-2.5 rounded-sm bg-[#ec4647]" />Push not delivered</span>
            <span className="inline-flex items-center gap-1.5"><span className="h-0.5 w-4 bg-[#6a4ce2]" />In-app</span>
          </div>
          <div className="h-64">
            {loading ? <div className="h-full animate-pulse rounded-xl bg-muted" /> : (
              <ResponsiveContainer width="100%" height="100%">
                <ComposedChart data={data?.series ?? []} margin={{ top: 4, right: 4, left: -16, bottom: 0 }}>
                  <defs><linearGradient id="ntfPush" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor="#257de0" stopOpacity={0.3} /><stop offset="100%" stopColor="#257de0" stopOpacity={0} /></linearGradient></defs>
                  <CartesianGrid vertical={false} stroke="var(--color-border)" strokeDasharray="3 3" />
                  <XAxis dataKey="day" tickFormatter={dayLabel} tickLine={false} axisLine={false} tick={axis} minTickGap={24} />
                  <YAxis allowDecimals={false} tickLine={false} axisLine={false} tick={axis} />
                  <Tooltip content={({ active, payload, label }) => {
                    if (!active || !payload?.length) return null
                    const r = payload[0].payload as NonNullable<CenterOverview['series']>[number]
                    return (
                      <div className="rounded-xl border border-border bg-popover px-3 py-2 text-xs shadow-lg">
                        <p className="mb-1 font-semibold">{dayLabel(String(label))}</p>
                        <p>Push delivered {r.push} · not delivered {r.failed}</p>
                        <p>In-app {r.inApp}{r.muted ? ` · held back ${r.muted}` : ''}</p>
                      </div>
                    )
                  }} />
                  <Area type="monotone" dataKey="push" stroke="#257de0" strokeWidth={2} fill="url(#ntfPush)" animationDuration={900} />
                  <Bar dataKey="failed" fill="#ec4647" radius={[3, 3, 0, 0]} maxBarSize={10} />
                  <Line type="monotone" dataKey="inApp" stroke="#6a4ce2" strokeWidth={2} dot={false} animationDuration={900} />
                </ComposedChart>
              </ResponsiveContainer>
            )}
          </div>
        </Panel>
        <Panel title="Who can get a push" subtitle="People with notifications switched on" icon={<Users className="h-4 w-4" />}>
          {loading || !data?.reach ? <div className="h-48 animate-pulse rounded-xl bg-muted" /> : (
            <div className="flex flex-col gap-5">
              <Gauge label="Customers" part={Number(data.reach.customersWithPush ?? 0)} whole={Number(data.reach.customers)} tone="#257de0" icon={Users} />
              <Gauge label="Vendors" part={Number(data.reach.vendorsWithPush ?? 0)} whole={Number(data.reach.vendors)} tone="#00b894" icon={Smartphone} />
            </div>
          )}
        </Panel>
      </div>

      <div className="grid gap-5 lg:grid-cols-2 xl:grid-cols-3">
        <Panel title="Busiest notifications" subtitle={`Last ${days} days`} icon={<Zap className="h-4 w-4" />} action={<button type="button" onClick={() => go('automatic')} className="text-xs font-medium text-primary hover:underline">All</button>}>
          {(data?.topEvents?.filter((e) => e.total > 0).length ?? 0) === 0 ? <p className="py-8 text-center text-sm text-muted-foreground">Nothing sent yet.</p> : (
            <ul className="space-y-2.5">
              {data!.topEvents!.filter((e) => e.total > 0).map((e, i) => (
                <li key={e.type}>
                  <div className="mb-1 flex justify-between gap-2 text-xs"><span className="truncate font-medium text-foreground">{eventMeta(e.type).label}</span><span className="shrink-0 tabular-nums text-muted-foreground">{e.pushSent} push · {e.inApp} in-app</span></div>
                  <div className="h-1.5 overflow-hidden rounded-full bg-muted"><motion.div initial={{ width: 0 }} animate={{ width: `${(e.total / topMax) * 100}%` }} transition={{ delay: i * 0.04 }} className="h-full rounded-full bg-[#257de0]" /></div>
                </li>
              ))}
            </ul>
          )}
        </Panel>
        <DonutCard title="Phones by type" subtitle="Switched-on devices" icon={<PieIcon className="h-4 w-4" />} loading={loading}
          rows={Object.entries(byPlatform).map(([name, value], i) => ({ name: name === 'ANDROID' ? 'Android' : name === 'IOS' ? 'iPhone' : name, value, color: SERIES[i] }))} />
        <Panel title="Why pushes didn’t arrive" subtitle={`Last ${days} days`} icon={<AlertTriangle className="h-4 w-4" />}>
          {(data?.failureReasons?.length ?? 0) === 0 ? <p className="py-8 text-center text-sm text-muted-foreground">Every push arrived. 🎉</p> : (
            <ul className="space-y-2">
              {data!.failureReasons!.map((f) => (
                <li key={f.reason} className="flex items-start justify-between gap-3 rounded-lg bg-muted/40 px-3 py-2 text-xs">
                  <span className="text-foreground/85">{failText(f.reason)}</span><b className="tabular-nums">{f.count}</b>
                </li>
              ))}
              <li className="px-1 pt-1 text-[11px] text-muted-foreground">Usually the person never allowed notifications, or logged out. They still get in-app messages.</li>
            </ul>
          )}
        </Panel>
      </div>

      <Panel title="Sent by admins" subtitle="Your latest messages" icon={<Megaphone className="h-4 w-4" />} action={<button type="button" onClick={() => go('send')} className="inline-flex items-center gap-1 text-xs font-medium text-primary hover:underline"><Send className="h-3 w-3" />New message</button>}>
        {(data?.recentSends?.length ?? 0) === 0 ? <p className="py-6 text-center text-sm text-muted-foreground">You haven’t sent anything yet.</p> : (
          <ul className="divide-y divide-border">
            {data!.recentSends!.map((r) => (
              <li key={r.id} className="flex items-start justify-between gap-3 py-2.5 text-sm">
                <span className="min-w-0"><span className="block truncate text-foreground">{r.details ?? r.action}</span><span className="text-xs text-muted-foreground">{r.actorName ?? r.actorEmail}</span></span>
                <span className="shrink-0 text-xs text-muted-foreground">{formatRelative(r.createdAt)}</span>
              </li>
            ))}
          </ul>
        )}
      </Panel>
    </motion.div>
  )
}
