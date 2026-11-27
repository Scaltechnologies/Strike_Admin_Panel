import { motion } from 'framer-motion'
import { format, isValid } from 'date-fns'
import { parseServerDate } from '@/utils/helpers/date'
import { UserPlus } from 'lucide-react'
import { cn } from '@/lib/utils'
import type { DashboardRecentVendor } from '../types/dashboard.types'
import { Panel, Skeleton } from './dashboard-ui'

const STATUS: Record<string, { label: string; cls: string; dot: string }> = {
  ACTIVE: { label: 'Active', cls: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-400/10 dark:text-emerald-300', dot: 'bg-emerald-500' },
  PENDING: { label: 'Waiting', cls: 'bg-amber-100 text-amber-700 dark:bg-amber-400/10 dark:text-amber-300', dot: 'bg-amber-500' },
  SUSPENDED: { label: 'Suspended', cls: 'bg-orange-100 text-orange-700 dark:bg-orange-400/10 dark:text-orange-300', dot: 'bg-orange-500' },
  REJECTED: { label: 'Rejected', cls: 'bg-red-100 text-red-700 dark:bg-red-400/10 dark:text-red-300', dot: 'bg-red-500' },
}

export function RecentSignupsCard({ vendors, loading }: { vendors?: DashboardRecentVendor[]; loading: boolean }) {
  const list = (vendors ?? []).slice(0, 6)
  return (
    <Panel title="Recent vendor sign-ups" subtitle="Newest first" icon={<UserPlus className="h-4 w-4" />} className="h-full">
      {loading ? (
        <div className="space-y-3">{Array.from({ length: 5 }).map((_, i) => <Skeleton key={i} className="h-10 w-full" />)}</div>
      ) : list.length === 0 ? (
        <p className="py-10 text-center text-sm text-muted-foreground">No vendor sign-ups yet</p>
      ) : (
        <ol className="relative space-y-1">
          <span className="absolute bottom-4 left-[7px] top-4 w-px bg-border" aria-hidden />
          {list.map((v, i) => {
            const s = STATUS[v.status] ?? { label: v.status, cls: 'bg-muted text-muted-foreground', dot: 'bg-muted-foreground' }
            const d = parseServerDate(v.registeredAt)
            return (
              <motion.li key={v.vendorId} initial={{ opacity: 0, x: 10 }} animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.15 + i * 0.06 }} className="relative flex items-center gap-3 rounded-lg py-1.5 pl-0 pr-1">
                <span className={cn('relative z-10 h-3.5 w-3.5 shrink-0 rounded-full ring-4 ring-card', s.dot)} />
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium text-foreground">{v.hotelName || `Vendor #${v.vendorId}`}</p>
                  <p className="text-[11px] text-muted-foreground">{isValid(d) ? format(d, 'MMM d, yyyy · HH:mm') : ''}</p>
                </div>
                <span className={cn('shrink-0 rounded-full px-2 py-0.5 text-[10px] font-semibold', s.cls)}>{s.label}</span>
              </motion.li>
            )
          })}
        </ol>
      )}
    </Panel>
  )
}
