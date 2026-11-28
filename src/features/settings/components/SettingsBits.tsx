import type { ReactNode } from 'react'
import { motion } from 'framer-motion'
import { Clock, type LucideIcon } from 'lucide-react'
import { cn } from '@/lib/utils'
import { formatDateTime, formatRelative } from '@/utils/helpers/date'

/** "Changed 3 hours ago by Priya" — hover shows the exact time. */
export function ChangedStamp({ at, by, className }: { at?: string | null; by?: string | null; className?: string }) {
  if (!at) return <span className={cn('text-[11px] text-muted-foreground', className)}>Never changed</span>
  return (
    <span title={formatDateTime(at)} className={cn('inline-flex items-center gap-1 text-[11px] text-muted-foreground', className)}>
      <Clock className="h-3 w-3" aria-hidden />
      Changed {formatRelative(at)}{by ? ` by ${by}` : ''}
    </span>
  )
}

/** A big on/off switch. */
export function Switch({ on, onChange, disabled, label, tone = 'bg-emerald-500' }: {
  on: boolean; onChange: (v: boolean) => void; disabled?: boolean; label: string; tone?: string
}) {
  return (
    <button type="button" role="switch" aria-checked={on} aria-label={label} disabled={disabled} onClick={() => onChange(!on)}
      className={cn('relative h-7 w-12 shrink-0 rounded-full transition-colors duration-300 disabled:cursor-not-allowed disabled:opacity-50',
        on ? tone : 'bg-muted-foreground/25')}>
      <motion.span layout transition={{ type: 'spring', stiffness: 600, damping: 32 }}
        className={cn('absolute top-1 h-5 w-5 rounded-full bg-white shadow-md', on ? 'right-1' : 'left-1')} />
    </button>
  )
}

/** Header for a settings section: icon, title, one-line plain explanation. */
export function SectionHead({ icon: Icon, tone, title, body, right }: {
  icon: LucideIcon; tone: string; title: string; body: string; right?: ReactNode
}) {
  return (
    <div className="flex flex-wrap items-start justify-between gap-3">
      <div className="flex items-start gap-3">
        <span className={cn('flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl text-white shadow-lg', tone)}>
          <Icon className="h-5 w-5" />
        </span>
        <div>
          <h2 className="text-lg font-semibold tracking-tight text-foreground">{title}</h2>
          <p className="mt-0.5 max-w-2xl text-sm text-muted-foreground">{body}</p>
        </div>
      </div>
      {right}
    </div>
  )
}

/** Small "what this means" note. */
export function Explain({ icon: Icon, children, tone = 'info' }: { icon: LucideIcon; children: ReactNode; tone?: 'info' | 'warn' | 'danger' | 'ok' }) {
  const tones = {
    info: 'border-sky-500/20 bg-sky-500/[0.06] text-sky-900 dark:text-sky-200 [&_svg]:text-sky-500',
    warn: 'border-amber-500/25 bg-amber-500/[0.07] text-amber-900 dark:text-amber-200 [&_svg]:text-amber-500',
    danger: 'border-red-500/25 bg-red-500/[0.07] text-red-900 dark:text-red-200 [&_svg]:text-red-500',
    ok: 'border-emerald-500/25 bg-emerald-500/[0.07] text-emerald-900 dark:text-emerald-200 [&_svg]:text-emerald-500',
  }
  return (
    <div className={cn('flex items-start gap-2.5 rounded-xl border px-3.5 py-2.5 text-[13px] leading-relaxed', tones[tone])}>
      <Icon className="mt-0.5 h-4 w-4 shrink-0" aria-hidden />
      <div className="min-w-0">{children}</div>
    </div>
  )
}

export function Card({ className, children }: { className?: string; children: ReactNode }) {
  return (
    <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ type: 'spring', stiffness: 260, damping: 26 }}
      className={cn('rounded-2xl border border-border bg-card p-5 shadow-sm transition-shadow hover:shadow-md', className)}>
      {children}
    </motion.div>
  )
}
