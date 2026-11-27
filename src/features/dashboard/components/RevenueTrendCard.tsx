import { useMemo, useState } from 'react'
import { motion } from 'framer-motion'
import { Area, AreaChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'
import { LineChart as LineChartIcon, Trophy } from 'lucide-react'
import { cn } from '@/lib/utils'
import type { AnalyticsMonthlyRevenue } from '../types/dashboard.types'
import { Panel, Skeleton } from './dashboard-ui'
import { formatInr, formatInrCompact, toNumber } from '../utils/dashboard-format'

type Range = '6' | '12' | 'all'
type Series = 'both' | 'revenue' | 'commission'

const monthLabel = (ym: string, long = false) => {
  const [y, m] = ym.split('-').map(Number)
  if (!y || !m) return ym
  return new Date(y, m - 1, 1).toLocaleDateString('en-IN', long ? { month: 'long', year: 'numeric' } : { month: 'short', year: '2-digit' })
}

function Toggle<T extends string>({ value, options, onChange, label }: {
  value: T; options: { value: T; label: string }[]; onChange: (v: T) => void; label: string
}) {
  return (
    <div role="radiogroup" aria-label={label} className="relative flex rounded-xl bg-muted p-0.5">
      {options.map((o) => (
        <button key={o.value} type="button" role="radio" aria-checked={value === o.value} onClick={() => onChange(o.value)}
          className={cn('relative z-10 rounded-[10px] px-2.5 py-1 text-[11px] font-medium transition-colors',
            value === o.value ? 'text-foreground' : 'text-muted-foreground hover:text-foreground')}>
          {value === o.value && (
            <motion.span layoutId={`toggle-${label}`} className="absolute inset-0 -z-10 rounded-[10px] bg-card shadow-sm"
              transition={{ type: 'spring', stiffness: 500, damping: 35 }} />
          )}
          {o.label}
        </button>
      ))}
    </div>
  )
}

function ChartTooltip({ active, payload, label }: {
  active?: boolean; payload?: { dataKey: string; value: number }[]; label?: string
}) {
  if (!active || !payload?.length || !label) return null
  const get = (k: string) => payload.find((p) => p.dataKey === k)?.value
  const rev = get('revenue')
  const com = get('commission')
  return (
    <div className="min-w-[160px] rounded-xl border border-border bg-card/95 p-3 text-xs shadow-xl backdrop-blur">
      <p className="mb-2 font-semibold text-foreground">{monthLabel(label, true)}</p>
      {rev != null && (
        <p className="flex items-center justify-between gap-4 text-muted-foreground">
          <span className="flex items-center gap-1.5"><span className="h-2 w-2 rounded-full bg-[#ff6a00]" />Revenue</span>
          <span className="font-semibold text-foreground">{formatInr(rev)}</span>
        </p>
      )}
      {com != null && (
        <p className="mt-1 flex items-center justify-between gap-4 text-muted-foreground">
          <span className="flex items-center gap-1.5"><span className="h-2 w-2 rounded-full bg-emerald-500" />Commission</span>
          <span className="font-semibold text-foreground">{formatInr(com)}</span>
        </p>
      )}
    </div>
  )
}

export function RevenueTrendCard({ monthly, loading }: { monthly?: AnalyticsMonthlyRevenue[]; loading: boolean }) {
  const [range, setRange] = useState<Range>('12')
  const [series, setSeries] = useState<Series>('both')

  const data = useMemo(() => {
    const all = (monthly ?? []).map((m) => ({
      month: m.month, revenue: toNumber(m.subscriptionRevenue), commission: toNumber(m.commission),
    }))
    return range === 'all' ? all : all.slice(-Number(range))
  }, [monthly, range])

  const totalRevenue = data.reduce((sum, d) => sum + d.revenue, 0)
  const totalCommission = data.reduce((sum, d) => sum + d.commission, 0)
  const best = data.reduce<(typeof data)[number] | null>((b, d) => (!b || d.revenue > b.revenue ? d : b), null)
  const showRev = series !== 'commission'
  const showCom = series !== 'revenue'

  return (
    <Panel
      title="Revenue trend"
      subtitle="Subscription revenue and Strike's commission, month by month"
      icon={<LineChartIcon className="h-4 w-4" />}
      className="h-full"
      action={
        <div className="hidden flex-wrap justify-end gap-2 sm:flex">
          <Toggle label="series" value={series} onChange={setSeries}
            options={[{ value: 'both', label: 'Both' }, { value: 'revenue', label: 'Revenue' }, { value: 'commission', label: 'Commission' }]} />
          <Toggle label="range" value={range} onChange={setRange}
            options={[{ value: '6', label: '6M' }, { value: '12', label: '12M' }, { value: 'all', label: 'All' }]} />
        </div>
      }
    >
      <div className="mb-4 flex flex-wrap gap-x-8 gap-y-2">
        <div>
          <p className="text-[11px] font-medium uppercase tracking-wider text-muted-foreground">Revenue</p>
          <p className="text-lg font-bold text-foreground">{loading ? '—' : formatInrCompact(totalRevenue)}</p>
        </div>
        <div>
          <p className="text-[11px] font-medium uppercase tracking-wider text-muted-foreground">Commission</p>
          <p className="text-lg font-bold text-foreground">{loading ? '—' : formatInrCompact(totalCommission)}</p>
        </div>
        {best && best.revenue > 0 && (
          <div className="flex items-center gap-2 rounded-xl bg-amber-50 px-3 py-1.5 dark:bg-amber-400/10">
            <Trophy className="h-4 w-4 text-amber-500" aria-hidden />
            <div>
              <p className="text-[11px] font-medium text-amber-700 dark:text-amber-300">Best month</p>
              <p className="text-xs font-semibold text-foreground">{monthLabel(best.month, true)} · {formatInrCompact(best.revenue)}</p>
            </div>
          </div>
        )}
      </div>

      {loading ? (
        <Skeleton className="h-[260px] w-full rounded-xl" />
      ) : data.length === 0 ? (
        <div className="flex h-[260px] flex-col items-center justify-center rounded-xl border border-dashed border-border text-sm text-muted-foreground">
          No revenue yet. The trend appears after the first card purchase.
        </div>
      ) : (
        <div className="h-[260px]">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={data} margin={{ top: 8, right: 8, left: -8, bottom: 0 }}>
              <defs>
                <linearGradient id="dash-rev" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#ff6a00" stopOpacity={0.35} />
                  <stop offset="100%" stopColor="#ff6a00" stopOpacity={0} />
                </linearGradient>
                <linearGradient id="dash-com" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#10b981" stopOpacity={0.3} />
                  <stop offset="100%" stopColor="#10b981" stopOpacity={0} />
                </linearGradient>
                <linearGradient id="dash-rev-line" x1="0" y1="0" x2="1" y2="0">
                  <stop offset="0%" stopColor="#ffc400" />
                  <stop offset="100%" stopColor="#e01a00" />
                </linearGradient>
              </defs>
              <CartesianGrid vertical={false} stroke="var(--color-border)" strokeDasharray="3 3" />
              <XAxis dataKey="month" tickFormatter={(v: string) => monthLabel(v)} tickLine={false} axisLine={false}
                tick={{ fontSize: 11, fill: 'var(--color-muted-foreground)' }} minTickGap={16} />
              <YAxis tickFormatter={(v: number) => formatInrCompact(v)} tickLine={false} axisLine={false} width={64}
                tick={{ fontSize: 11, fill: 'var(--color-muted-foreground)' }} />
              <Tooltip content={<ChartTooltip />} cursor={{ stroke: 'var(--color-border)', strokeWidth: 1 }} />
              {showRev && (
                <Area type="monotone" dataKey="revenue" stroke="url(#dash-rev-line)" strokeWidth={2.5} fill="url(#dash-rev)"
                  activeDot={{ r: 5, strokeWidth: 2, stroke: '#fff', fill: '#ff6a00' }} animationDuration={1200} />
              )}
              {showCom && (
                <Area type="monotone" dataKey="commission" stroke="#10b981" strokeWidth={2} fill="url(#dash-com)"
                  activeDot={{ r: 4, strokeWidth: 2, stroke: '#fff', fill: '#10b981' }} animationDuration={1400} />
              )}
            </AreaChart>
          </ResponsiveContainer>
        </div>
      )}
    </Panel>
  )
}
