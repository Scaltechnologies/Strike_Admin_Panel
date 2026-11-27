import { memo } from 'react'
import { motion } from 'framer-motion'
import { ChevronRight, Clock, CreditCard, Package, Store, Timer } from 'lucide-react'
import { cn } from '@/lib/utils'
import { formatDateTime, formatRelative } from '@/utils/helpers/date'
import { formatInrFull } from '@/features/vendors/utils/vendor-meta'
import { UserAvatar } from '@/features/users/components/UserAvatar'
import type { RedemptionRow } from '../api/redemption-insights.api'
import { humanDuration, initiatedLabel, statusMeta } from '../utils/redemption-meta'

/** One redemption in a list: who, where, which card, how much, and what happened. */
export const RedemptionRowCard = memo(function RedemptionRowCard({ row, index, onOpen, compact }: {
  row: RedemptionRow
  index: number
  onOpen: (r: RedemptionRow) => void
  compact?: boolean
}) {
  const meta = statusMeta(row.status)
  const name = row.customerName?.trim() || row.customerMobile || (row.userId != null ? `Customer #${row.userId}` : 'Customer')
  const pending = row.status === 'PENDING'
  const refused = row.status === 'REJECTED' || row.status === 'FAILED' || row.status === 'REVERSED'
  return (
    <motion.button type="button" layout initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
      transition={{ delay: Math.min(index, 12) * 0.03, type: 'spring', stiffness: 320, damping: 28 }}
      onClick={() => onOpen(row)}
      className={cn('group relative flex w-full items-center gap-3 overflow-hidden rounded-2xl border bg-card px-4 py-3 text-left shadow-sm transition-all hover:-translate-y-0.5 hover:shadow-lg hover:shadow-black/[0.05]',
        pending ? 'border-amber-300/70 dark:border-amber-400/30' : 'border-border')}>
      <span className={cn('absolute inset-y-0 left-0 w-1 bg-gradient-to-b', meta.tone)} aria-hidden />
      {pending && <span className="pointer-events-none absolute inset-0 animate-pulse bg-amber-400/[0.05]" aria-hidden />}

      <UserAvatar id={row.userId ?? row.id} name={name} photo={row.customerPhoto} className="h-10 w-10 rounded-full text-xs" />

      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2">
          <p className="truncate text-sm font-semibold text-foreground">{name}</p>
          <span className={cn('flex shrink-0 items-center gap-1 rounded-full px-2 py-px text-[10px] font-semibold', meta.chip)}>
            <meta.icon className="h-3 w-3" />{meta.label}
          </span>
        </div>
        <p className="mt-0.5 flex flex-wrap items-center gap-x-3 gap-y-0.5 text-[11px] text-muted-foreground">
          <span className="flex items-center gap-1"><Store className="h-3 w-3" />{row.storeName ?? `Store #${row.storeId ?? '—'}`}</span>
          <span className="flex items-center gap-1"><CreditCard className="h-3 w-3" />{row.cardName ?? 'Card'}</span>
          {!compact && row.itemCount > 0 && <span className="flex items-center gap-1"><Package className="h-3 w-3" />{row.itemCount} item{row.itemCount === 1 ? '' : 's'}</span>}
          {!compact && row.decisionSeconds != null && <span className="flex items-center gap-1"><Timer className="h-3 w-3" />decided in {humanDuration(row.decisionSeconds)}</span>}
          {!compact && row.initiatedBy && <span>via {initiatedLabel(row.initiatedBy).toLowerCase()}</span>}
        </p>
        {refused && row.failureReason && <p className="mt-0.5 truncate text-[11px] italic text-rose-600 dark:text-rose-400">“{row.failureReason}”</p>}
      </div>

      <div className="shrink-0 text-right">
        <p className={cn('text-base font-bold tabular-nums', refused || row.status === 'CANCELLED' ? 'text-muted-foreground line-through' : 'text-foreground')}>
          {formatInrFull(row.amount)}
        </p>
        <p className="flex items-center justify-end gap-1 text-[11px] text-muted-foreground" title={row.createdAt ? formatDateTime(row.createdAt) : undefined}>
          <Clock className="h-3 w-3" />{row.createdAt ? formatRelative(row.createdAt) : '—'}
        </p>
        {!compact && row.balanceAfter != null && <p className="text-[10px] text-muted-foreground">{formatInrFull(row.balanceAfter)} left on card</p>}
      </div>
      <ChevronRight className="h-4 w-4 shrink-0 text-muted-foreground/50 transition-transform group-hover:translate-x-0.5 group-hover:text-foreground" />
    </motion.button>
  )
})
