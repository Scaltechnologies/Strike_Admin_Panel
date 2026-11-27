import { motion } from 'framer-motion'
import { Crown, Medal } from 'lucide-react'
import { cn } from '@/lib/utils'
import type { DashboardTopVendor } from '../types/dashboard.types'
import { Panel, Skeleton } from './dashboard-ui'
import { formatCount, formatInr, formatInrCompact, toNumber } from '../utils/dashboard-format'

const RANK_STYLE = [
  'bg-gradient-to-br from-amber-300 to-yellow-500 text-amber-950 shadow-amber-400/40',
  'bg-gradient-to-br from-slate-200 to-slate-400 text-slate-900 shadow-slate-400/40',
  'bg-gradient-to-br from-orange-300 to-amber-700 text-orange-50 shadow-orange-500/40',
]

export function TopVendorsCard({ vendors, loading }: { vendors?: DashboardTopVendor[]; loading: boolean }) {
  const list = (vendors ?? []).filter((v) => toNumber(v.revenue) > 0)
  const max = Math.max(1, ...list.map((v) => toNumber(v.revenue)))

  return (
    <Panel title="Top vendors" subtitle="By card sales revenue" icon={<Crown className="h-4 w-4" />} className="h-full">
      {loading ? (
        <div className="space-y-3">{Array.from({ length: 5 }).map((_, i) => <Skeleton key={i} className="h-11 w-full" />)}</div>
      ) : list.length === 0 ? (
        <div className="flex h-56 flex-col items-center justify-center gap-2 text-center text-sm text-muted-foreground">
          <Medal className="h-8 w-8 text-muted-foreground/40" />
          No sales yet. The leaderboard fills up as members buy cards.
        </div>
      ) : (
        <ol className="space-y-2">
          {list.map((v, i) => {
            const revenue = toNumber(v.revenue)
            return (
              <motion.li
                key={v.vendorId}
                initial={{ opacity: 0, x: -12 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.15 + i * 0.07, type: 'spring', stiffness: 300, damping: 26 }}
                whileHover={{ x: 3 }}
                className="rounded-xl p-2 transition-colors hover:bg-muted/60"
              >
                <div className="flex items-center gap-3">
                  <span className={cn(
                    'flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-xs font-bold shadow-md',
                    RANK_STYLE[i] ?? 'bg-muted text-muted-foreground shadow-none',
                  )}>
                    {i + 1}
                  </span>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-baseline justify-between gap-2">
                      <p className="truncate text-sm font-medium text-foreground">{v.hotelName || `Vendor #${v.vendorId}`}</p>
                      <p className="shrink-0 text-sm font-semibold text-foreground" title={formatInr(revenue)}>{formatInrCompact(revenue)}</p>
                    </div>
                    <div className="mt-1 flex items-center gap-2">
                      <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-muted">
                        <motion.div className="h-full rounded-full bg-gradient-to-r from-[#ffc400] via-[#ff6a00] to-[#e01a00]"
                          initial={{ width: 0 }} animate={{ width: `${(revenue / max) * 100}%` }}
                          transition={{ duration: 1, ease: 'easeOut', delay: 0.3 + i * 0.08 }} />
                      </div>
                      <span className="shrink-0 text-[11px] text-muted-foreground">{formatCount(toNumber(v.count))} sold</span>
                    </div>
                  </div>
                </div>
              </motion.li>
            )
          })}
        </ol>
      )}
    </Panel>
  )
}
