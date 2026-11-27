import { useState } from 'react'
import { Link } from '@tanstack/react-router'
import { motion } from 'framer-motion'
import { Cell, Pie, PieChart, ResponsiveContainer } from 'recharts'
import { ArrowUpRight, PieChart as PieIcon } from 'lucide-react'
import { hasPermission } from '@/core/auth/auth'
import type { DashboardVendorStats } from '../types/dashboard.types'
import { AnimatedNumber, Panel, Skeleton } from './dashboard-ui'
import { formatCount } from '../utils/dashboard-format'

const SLICES = [
  { key: 'active' as const, label: 'Active', color: '#22c55e' },
  { key: 'pending' as const, label: 'Waiting for approval', color: '#f59e0b' },
  { key: 'suspended' as const, label: 'Suspended', color: '#f97316' },
  { key: 'rejected' as const, label: 'Rejected', color: '#ef4444' },
]

export function VendorMixCard({ vendors, loading }: { vendors?: DashboardVendorStats; loading: boolean }) {
  const [active, setActive] = useState<number | undefined>(undefined)
  const total = vendors?.total ?? 0
  const data = SLICES.map((s) => ({ ...s, value: vendors?.[s.key] ?? 0 })).filter((d) => d.value > 0)
  const focused = active != null ? data[active] : undefined
  const canOpen = hasPermission('SEC_VENDORS')

  return (
    <Panel
      title="Vendors"
      subtitle="By account status"
      icon={<PieIcon className="h-4 w-4" />}
      className="h-full"
      action={canOpen ? (
        <Link to="/vendors" className="inline-flex items-center gap-0.5 text-xs font-medium text-primary hover:underline">
          Open <ArrowUpRight className="h-3 w-3" />
        </Link>
      ) : undefined}
    >
      {loading ? (
        <div className="flex flex-col items-center gap-4">
          <Skeleton className="h-44 w-44 rounded-full" />
          <Skeleton className="h-16 w-full" />
        </div>
      ) : total === 0 ? (
        <div className="flex h-56 items-center justify-center text-sm text-muted-foreground">No vendors yet</div>
      ) : (
        <>
          <div className="relative mx-auto h-52 w-full max-w-[240px]">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={data} dataKey="value" nameKey="label" innerRadius="62%" outerRadius="82%" paddingAngle={data.length > 1 ? 3 : 0}
                  cornerRadius={6} stroke="none"
                  onMouseEnter={(_, i) => setActive(i)} onMouseLeave={() => setActive(undefined)}
                  animationDuration={1100} animationBegin={150}
                >
                  {data.map((d, i) => (
                    <Cell key={d.key} fill={d.color} fillOpacity={active == null || active === i ? 1 : 0.25}
                      style={{ transition: 'fill-opacity 250ms ease', cursor: 'pointer' }} />
                  ))}
                </Pie>
              </PieChart>
            </ResponsiveContainer>
            <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center text-center">
              <motion.p key={focused?.key ?? 'all'} initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }}
                className="text-3xl font-bold tracking-tight text-foreground">
                {focused ? formatCount(focused.value) : <AnimatedNumber value={total} />}
              </motion.p>
              <p className="max-w-[110px] text-[11px] font-medium text-muted-foreground">
                {focused ? focused.label : 'Total vendors'}
              </p>
            </div>
          </div>

          <ul className="mt-3 space-y-2">
            {SLICES.map((s, i) => {
              const value = vendors?.[s.key] ?? 0
              const pct = total > 0 ? (value / total) * 100 : 0
              const idx = data.findIndex((d) => d.key === s.key)
              return (
                <li key={s.key} onMouseEnter={() => idx >= 0 && setActive(idx)} onMouseLeave={() => setActive(undefined)}
                  className="rounded-lg px-1.5 py-1 transition-colors hover:bg-muted/60">
                  <div className="flex items-center justify-between text-xs">
                    <span className="flex items-center gap-2 text-foreground">
                      <span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: s.color }} />
                      {s.label}
                    </span>
                    <span className="tabular-nums text-muted-foreground">
                      <span className="font-semibold text-foreground">{formatCount(value)}</span> · {pct.toFixed(0)}%
                    </span>
                  </div>
                  <div className="mt-1 h-1 overflow-hidden rounded-full bg-muted">
                    <motion.div className="h-full rounded-full" style={{ backgroundColor: s.color }}
                      initial={{ width: 0 }} animate={{ width: `${pct}%` }}
                      transition={{ duration: 0.9, ease: 'easeOut', delay: 0.3 + i * 0.08 }} />
                  </div>
                </li>
              )
            })}
          </ul>
        </>
      )}
    </Panel>
  )
}
