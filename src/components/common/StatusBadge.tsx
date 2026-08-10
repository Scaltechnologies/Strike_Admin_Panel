import { cn } from '@/lib/utils'

type StatusVariant =
  | 'active'
  | 'inactive'
  | 'pending'
  | 'approved'
  | 'rejected'
  | 'suspended'
  | 'verified'
  | 'success'
  | 'warning'
  | 'error'
  | 'info'
  | 'completed'
  | 'failed'
  | 'reversed'
  | 'default'

interface StatusBadgeProps {
  status: StatusVariant | string
  label?: string
  size?: 'sm' | 'md'
  dot?: boolean
  className?: string
}

const VARIANT_STYLES: Record<StatusVariant, string> = {
  active: 'bg-green-50 text-green-700 ring-green-600/20 dark:bg-green-400/10 dark:text-green-400 dark:ring-green-400/30',
  inactive: 'bg-zinc-50 text-zinc-600 ring-zinc-500/20 dark:bg-zinc-400/10 dark:text-zinc-400 dark:ring-zinc-400/30',
  pending: 'bg-amber-50 text-amber-700 ring-amber-600/20 dark:bg-amber-400/10 dark:text-amber-400 dark:ring-amber-400/30',
  approved: 'bg-green-50 text-green-700 ring-green-600/20 dark:bg-green-400/10 dark:text-green-400 dark:ring-green-400/30',
  rejected: 'bg-red-50 text-red-700 ring-red-600/20 dark:bg-red-400/10 dark:text-red-400 dark:ring-red-400/30',
  suspended: 'bg-orange-50 text-orange-700 ring-orange-600/20 dark:bg-orange-400/10 dark:text-orange-400 dark:ring-orange-400/30',
  verified: 'bg-blue-50 text-blue-700 ring-blue-600/20 dark:bg-blue-400/10 dark:text-blue-400 dark:ring-blue-400/30',
  success: 'bg-green-50 text-green-700 ring-green-600/20 dark:bg-green-400/10 dark:text-green-400 dark:ring-green-400/30',
  warning: 'bg-amber-50 text-amber-700 ring-amber-600/20 dark:bg-amber-400/10 dark:text-amber-400 dark:ring-amber-400/30',
  error: 'bg-red-50 text-red-700 ring-red-600/20 dark:bg-red-400/10 dark:text-red-400 dark:ring-red-400/30',
  info: 'bg-blue-50 text-blue-700 ring-blue-600/20 dark:bg-blue-400/10 dark:text-blue-400 dark:ring-blue-400/30',
  completed: 'bg-green-50 text-green-700 ring-green-600/20 dark:bg-green-400/10 dark:text-green-400 dark:ring-green-400/30',
  failed: 'bg-red-50 text-red-700 ring-red-600/20 dark:bg-red-400/10 dark:text-red-400 dark:ring-red-400/30',
  reversed: 'bg-orange-50 text-orange-700 ring-orange-600/20 dark:bg-orange-400/10 dark:text-orange-400 dark:ring-orange-400/30',
  default: 'bg-muted text-muted-foreground ring-border',
}

const DOT_STYLES: Record<StatusVariant, string> = {
  active: 'bg-green-500',
  inactive: 'bg-zinc-400',
  pending: 'bg-amber-500',
  approved: 'bg-green-500',
  rejected: 'bg-red-500',
  suspended: 'bg-orange-500',
  verified: 'bg-blue-500',
  success: 'bg-green-500',
  warning: 'bg-amber-500',
  error: 'bg-red-500',
  info: 'bg-blue-500',
  completed: 'bg-green-500',
  failed: 'bg-red-500',
  reversed: 'bg-orange-500',
  default: 'bg-muted-foreground',
}

function normalizeVariant(status: string): StatusVariant {
  const normalized = status.toLowerCase() as StatusVariant
  return normalized in VARIANT_STYLES ? normalized : 'default'
}

export function StatusBadge({ status, label, size = 'md', dot = false, className }: StatusBadgeProps) {
  const variant = normalizeVariant(status)
  const displayLabel = label ?? (status.charAt(0).toUpperCase() + status.slice(1).toLowerCase())

  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 rounded-full font-medium ring-1 ring-inset',
        size === 'sm' ? 'px-2 py-0.5 text-xs' : 'px-2.5 py-1 text-xs',
        VARIANT_STYLES[variant],
        className,
      )}
    >
      {dot && (
        <span
          className={cn('h-1.5 w-1.5 rounded-full', DOT_STYLES[variant])}
          aria-hidden
        />
      )}
      {displayLabel}
    </span>
  )
}
