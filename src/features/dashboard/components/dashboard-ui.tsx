import { useId, type ReactNode } from 'react'
import { motion } from 'framer-motion'
import { cn } from '@/lib/utils'
import { useCountUp } from '../hooks/useCountUp'
import { formatCount, riseIn } from '../utils/dashboard-format'

// ── Pieces ───────────────────────────────────────────────────────────────────

/** A number that counts up to its value and glides to new values on refresh. */
export function AnimatedNumber({ value, format = formatCount, className }: {
  value: number; format?: (n: number) => string; className?: string
}) {
  const shown = useCountUp(value)
  return <span className={cn('tabular-nums', className)}>{format(shown)}</span>
}

/** Card shell used by every dashboard panel: rises in, lifts slightly on hover. */
export function Panel({ title, subtitle, action, icon, className, bodyClassName, children }: {
  title?: string
  subtitle?: string
  action?: ReactNode
  icon?: ReactNode
  className?: string
  bodyClassName?: string
  children: ReactNode
}) {
  return (
    <motion.section
      variants={riseIn}
      className={cn(
        'group/panel relative flex flex-col overflow-hidden rounded-2xl border border-border bg-card shadow-sm',
        'transition-shadow duration-300 hover:shadow-lg hover:shadow-black/[0.04] dark:hover:shadow-black/30',
        className,
      )}
    >
      {(title || action) && (
        <header className="flex items-start justify-between gap-3 px-5 pt-5">
          <div className="flex min-w-0 items-center gap-2.5">
            {icon && (
              <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
                {icon}
              </span>
            )}
            <div className="min-w-0">
              {title && <h2 className="truncate text-sm font-semibold text-foreground">{title}</h2>}
              {subtitle && <p className="truncate text-xs text-muted-foreground">{subtitle}</p>}
            </div>
          </div>
          {action}
        </header>
      )}
      <div className={cn('flex-1 p-5', bodyClassName)}>{children}</div>
    </motion.section>
  )
}

/** Tiny trend line for KPI tiles. Draws itself in on mount. */
export function Sparkline({ values, color = '#ff6a00', className }: { values: number[]; color?: string; className?: string }) {
  const id = useId().replace(/:/g, '')
  if (values.length < 2) return null
  const w = 120
  const h = 36
  const max = Math.max(...values)
  const min = Math.min(...values)
  const span = max - min || 1
  const pts = values.map((v, i) => [(i / (values.length - 1)) * w, h - 3 - ((v - min) / span) * (h - 6)])
  const line = pts.map(([x, y], i) => `${i ? 'L' : 'M'}${x.toFixed(1)},${y.toFixed(1)}`).join(' ')
  const area = `${line} L${w},${h} L0,${h} Z`
  return (
    <svg viewBox={`0 0 ${w} ${h}`} preserveAspectRatio="none" className={cn('h-9 w-full overflow-visible', className)} aria-hidden>
      <defs>
        <linearGradient id={`spark-${id}`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={color} stopOpacity={0.28} />
          <stop offset="100%" stopColor={color} stopOpacity={0} />
        </linearGradient>
      </defs>
      <motion.path d={area} fill={`url(#spark-${id})`} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.8, delay: 0.4 }} />
      <motion.path
        d={line} fill="none" stroke={color} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round"
        vectorEffect="non-scaling-stroke"
        initial={{ pathLength: 0 }} animate={{ pathLength: 1 }} transition={{ duration: 1.2, ease: 'easeOut', delay: 0.2 }}
      />
    </svg>
  )
}

/** Shimmering placeholder block. */
export function Skeleton({ className }: { className?: string }) {
  return <div className={cn('animate-pulse rounded-lg bg-muted', className)} />
}
