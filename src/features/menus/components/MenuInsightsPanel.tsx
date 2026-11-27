import { useState } from 'react'
import { motion } from 'framer-motion'
import { Activity, ImageOff, Layers, PieChart as PieIcon, Sparkles, Tags, Timer } from 'lucide-react'
import { Bar, BarChart, CartesianGrid, Cell, Legend, Pie, PieChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'
import { cn } from '@/lib/utils'
import { Panel, Skeleton } from '@/features/dashboard/components/dashboard-ui'
import { staggerContainer } from '@/features/dashboard/utils/dashboard-format'
import type { MenuOverview } from '../api/menu-admin.api'
import { formatPrice } from '../utils/menu-meta'

const dayLabel = (d: string) => new Date(`${d}T00:00:00`).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })
const bandLabel = (b: { from: number; to: number }) => (b.to < 0 ? `₹${b.from}+` : `₹${b.from}–${b.to}`)
const axis = { fontSize: 11, fill: 'var(--color-muted-foreground)' }

export function MenuInsightsPanel({ data, loading }: { data?: MenuOverview; loading: boolean }) {
  return (
    <motion.div variants={staggerContainer} initial="hidden" animate="show" className="flex flex-col gap-5">
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <Fact icon={Timer} tone="from-sky-400 to-indigo-600" label="Average time to decide" loading={loading}
          value={data?.averageReviewMinutes != null ? humanMinutes(data.averageReviewMinutes) : '—'} hint="last 30 days" />
        <Fact icon={Sparkles} tone="from-emerald-400 to-teal-600" label="Items added this week" loading={loading} value={String(data?.addedThisWeek ?? 0)} />
        <Fact icon={ImageOff} tone="from-amber-400 to-orange-600" label="Items without a photo" loading={loading} value={String(data?.withoutPhoto ?? 0)}
          hint={data?.items ? `${Math.round(((data.withoutPhoto ?? 0) / data.items) * 100)}% of all items` : undefined} />
        <Fact icon={Tags} tone="from-pink-400 to-rose-600" label="Average price" loading={loading}
          value={data?.items ? formatPrice(Math.round(data.averagePrice ?? 0)) : '—'} hint={data?.highestPrice ? `highest ${formatPrice(data.highestPrice)}` : undefined} />
      </div>

      <Panel title="Menu changes, last 14 days" subtitle="Asked for by stores, and what admins decided" icon={<Activity className="h-4 w-4" />}>
        {loading ? <Skeleton className="h-[240px] w-full" /> : (
          <div className="h-[240px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={data?.daily ?? []} margin={{ top: 8, right: 4, left: -20, bottom: 0 }} barGap={2}>
                <CartesianGrid vertical={false} stroke="var(--color-border)" strokeDasharray="3 3" />
                <XAxis dataKey="day" tickFormatter={dayLabel} tickLine={false} axisLine={false} tick={axis} interval="preserveStartEnd" />
                <YAxis allowDecimals={false} tickLine={false} axisLine={false} tick={axis} />
                <Tooltip labelFormatter={(l) => dayLabel(String(l))} contentStyle={{ borderRadius: 12, border: '1px solid var(--color-border)', background: 'var(--color-popover)', fontSize: 12 }} cursor={{ fill: 'var(--color-muted)', opacity: 0.5 }} />
                <Legend iconType="circle" wrapperStyle={{ fontSize: 12 }} />
                <Bar dataKey="requested" name="Asked for" fill="#f59e0b" radius={[4, 4, 0, 0]} maxBarSize={14} animationDuration={900} />
                <Bar dataKey="approved" name="Approved" fill="#10b981" radius={[4, 4, 0, 0]} maxBarSize={14} animationDuration={1100} />
                <Bar dataKey="rejected" name="Rejected" fill="#f43f5e" radius={[4, 4, 0, 0]} maxBarSize={14} animationDuration={1300} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        )}
      </Panel>

      <div className="grid grid-cols-1 gap-5 xl:grid-cols-3">
        <Panel title="Biggest categories" subtitle="Menu items in each category, across all stores" icon={<Layers className="h-4 w-4" />} className="xl:col-span-2">
          {loading ? <Skeleton className="h-[260px] w-full" /> : (data?.byCategory?.length ?? 0) === 0 ? <Empty /> : (
            <ul className="flex flex-col gap-2.5">
              {data!.byCategory!.map((c, i) => {
                const max = Math.max(1, ...data!.byCategory!.map((x) => x.items))
                return (
                  <motion.li key={c.categoryId} initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.05 * i }}>
                    <div className="flex items-baseline justify-between text-sm">
                      <span className="font-medium text-foreground">{c.name}</span>
                      <span className="text-xs text-muted-foreground"><span className="font-semibold text-foreground">{c.items}</span> item{c.items === 1 ? "" : "s"} · avg {formatPrice(Math.round(c.averagePrice))}</span>
                    </div>
                    <div className="mt-1 h-2 overflow-hidden rounded-full bg-muted">
                      <motion.div className="h-full rounded-full bg-gradient-to-r from-orange-400 to-[#e01a00]" initial={{ width: 0 }}
                        animate={{ width: `${(c.items / max) * 100}%` }} transition={{ duration: 1, delay: 0.15 + i * 0.06, ease: 'easeOut' }} />
                    </div>
                  </motion.li>
                )
              })}
            </ul>
          )}
        </Panel>
        <VegMix data={data} loading={loading} />
      </div>

      <Panel title="Price ranges" subtitle="How many items sit in each price band" icon={<Tags className="h-4 w-4" />}>
        {loading ? <Skeleton className="h-[220px] w-full" /> : (
          <div className="h-[220px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={(data?.priceBands ?? []).map((b) => ({ ...b, label: bandLabel(b) }))} margin={{ top: 8, right: 4, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="menu-band" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#a78bfa" />
                    <stop offset="100%" stopColor="#6d28d9" />
                  </linearGradient>
                </defs>
                <CartesianGrid vertical={false} stroke="var(--color-border)" strokeDasharray="3 3" />
                <XAxis dataKey="label" tickLine={false} axisLine={false} tick={axis} />
                <YAxis allowDecimals={false} tickLine={false} axisLine={false} tick={axis} />
                <Tooltip formatter={(v) => [`${v} items`, 'Items']} contentStyle={{ borderRadius: 12, border: '1px solid var(--color-border)', background: 'var(--color-popover)', fontSize: 12 }} cursor={{ fill: 'var(--color-muted)', opacity: 0.5 }} />
                <Bar dataKey="items" fill="url(#menu-band)" radius={[6, 6, 0, 0]} maxBarSize={56} animationDuration={1100} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        )}
      </Panel>
    </motion.div>
  )
}

function VegMix({ data, loading }: { data?: MenuOverview; loading: boolean }) {
  const [active, setActive] = useState<number>()
  const slices = [
    { key: 'veg', label: 'Veg', value: data?.veg ?? 0, color: '#10b981' },
    { key: 'non', label: 'Non-veg', value: data?.nonVeg ?? 0, color: '#f43f5e' },
    { key: 'other', label: 'Not marked', value: Math.max(0, (data?.items ?? 0) - (data?.veg ?? 0) - (data?.nonVeg ?? 0)), color: '#94a3b8' },
  ].filter((s) => s.value > 0)
  const total = slices.reduce((t, s) => t + s.value, 0)
  const focus = active != null ? slices[active] : undefined
  return (
    <Panel title="Veg vs non-veg" subtitle="Across every menu" icon={<PieIcon className="h-4 w-4" />}>
      {loading ? <Skeleton className="h-[260px] w-full" /> : total === 0 ? <Empty /> : (
        <div className="flex flex-col items-center gap-3">
          <div className="relative h-[180px] w-[180px]">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={slices} dataKey="value" nameKey="label" innerRadius="62%" outerRadius="92%" paddingAngle={slices.length > 1 ? 3 : 0}
                  cornerRadius={6} stroke="none" animationDuration={1100} onMouseEnter={(_, i) => setActive(i)} onMouseLeave={() => setActive(undefined)}>
                  {slices.map((s, i) => <Cell key={s.key} fill={s.color} fillOpacity={active == null || active === i ? 1 : 0.25} style={{ transition: 'fill-opacity 250ms ease' }} />)}
                </Pie>
              </PieChart>
            </ResponsiveContainer>
            <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center">
              <span className="text-2xl font-bold tabular-nums text-foreground">{focus ? `${Math.round((focus.value / total) * 100)}%` : total}</span>
              <span className="text-[11px] text-muted-foreground">{focus ? focus.label : 'items'}</span>
            </div>
          </div>
          <ul className="flex w-full flex-col gap-1.5">
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

function Fact({ icon: Icon, tone, label, value, hint, loading }: {
  icon: typeof Timer; tone: string; label: string; value: string; hint?: string; loading: boolean
}) {
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

function Empty() {
  return <div className="flex h-[200px] items-center justify-center rounded-xl border border-dashed border-border text-sm text-muted-foreground">No menu items yet</div>
}

function humanMinutes(m: number): string {
  if (m < 1) return 'under a minute'
  if (m < 60) return `${m} min`
  const h = Math.round(m / 6) / 10
  if (h < 48) return `${h} h`
  return `${Math.round(h / 24)} days`
}
