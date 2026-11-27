import { motion } from 'framer-motion'
import { ArrowRight, X } from 'lucide-react'
import { cn } from '@/lib/utils'
import type { AdminAlert } from './alerts-store'
import { ALERT_META } from './alert-meta'

/** The pop-up card shown (top right) when a new alert arrives. */
export function AlertToast({ alert, onOpen, onClose }: { alert: AdminAlert; onOpen: () => void; onClose: () => void }) {
  const meta = ALERT_META[alert.type]
  const Icon = meta.icon
  const urgent = alert.priority === 'urgent'
  return (
    <motion.div initial={{ x: 40, opacity: 0, scale: 0.96 }} animate={{ x: 0, opacity: 1, scale: 1 }} transition={{ type: 'spring', stiffness: 380, damping: 26 }}
      className={cn('relative w-[360px] overflow-hidden rounded-2xl border bg-popover text-popover-foreground shadow-2xl shadow-black/20',
        urgent ? 'border-rose-300 dark:border-rose-500/40' : 'border-border')}>
      <span className={cn('absolute inset-y-0 left-0 w-1.5 bg-gradient-to-b', meta.tone)} aria-hidden />
      {urgent && <span className="pointer-events-none absolute inset-0 animate-pulse bg-rose-500/[0.04]" aria-hidden />}
      <div className="relative flex gap-3 p-4 pl-5">
        <span className={cn('relative flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br text-white shadow-lg', meta.tone)}>
          {urgent && <span className="absolute inset-0 animate-ping rounded-xl bg-rose-400/40" aria-hidden />}
          <Icon className="relative h-5 w-5" />
        </span>
        <div className="min-w-0 flex-1">
          <div className="flex items-start justify-between gap-2">
            <p className="text-sm font-bold text-foreground">{alert.title}</p>
            <button type="button" onClick={onClose} aria-label="Dismiss" className="-mr-1 -mt-1 flex h-6 w-6 shrink-0 items-center justify-center rounded-md text-muted-foreground hover:bg-muted hover:text-foreground">
              <X className="h-3.5 w-3.5" />
            </button>
          </div>
          <p className="mt-0.5 line-clamp-2 text-xs text-muted-foreground">{alert.message}</p>
          <button type="button" onClick={onOpen}
            className={cn('mt-2.5 inline-flex items-center gap-1 rounded-lg px-2.5 py-1 text-xs font-semibold text-white shadow-sm bg-gradient-to-r', meta.tone)}>
            {alert.actionNeeded ? 'Review now' : 'Open'} <ArrowRight className="h-3.5 w-3.5" />
          </button>
        </div>
      </div>
    </motion.div>
  )
}
