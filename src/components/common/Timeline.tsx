import type { LucideIcon } from 'lucide-react'
import { Circle } from 'lucide-react'
import { cn } from '@/lib/utils'
import { formatDateTime } from '@/utils/helpers/date'

export interface TimelineEntry {
  id: string | number
  title: string
  description?: string
  timestamp: string
  icon?: LucideIcon
  tone?: 'default' | 'success' | 'warning' | 'error'
}

const TONE_STYLES: Record<NonNullable<TimelineEntry['tone']>, string> = {
  default: 'bg-muted text-muted-foreground',
  success: 'bg-green-50 text-green-600 dark:bg-green-400/10 dark:text-green-400',
  warning: 'bg-amber-50 text-amber-600 dark:bg-amber-400/10 dark:text-amber-400',
  error: 'bg-red-50 text-red-600 dark:bg-red-400/10 dark:text-red-400',
}

interface TimelineProps {
  entries: TimelineEntry[]
  className?: string
}

/** Generic chronological activity feed — reusable across every module's "Activity Timeline" tab. */
export function Timeline({ entries, className }: TimelineProps) {
  return (
    <ol className={cn('space-y-0', className)}>
      {entries.map((entry, index) => {
        const Icon = entry.icon ?? Circle
        const tone = entry.tone ?? 'default'
        const isLast = index === entries.length - 1
        return (
          <li key={entry.id} className="relative flex gap-3 pb-6 last:pb-0">
            {!isLast && (
              <span className="absolute left-[15px] top-8 bottom-0 w-px bg-border" aria-hidden />
            )}
            <span
              className={cn(
                'flex h-8 w-8 shrink-0 items-center justify-center rounded-full ring-4 ring-background',
                TONE_STYLES[tone],
              )}
            >
              <Icon className="h-3.5 w-3.5" aria-hidden />
            </span>
            <div className="min-w-0 flex-1 pt-1">
              <div className="flex flex-wrap items-baseline justify-between gap-x-3 gap-y-0.5">
                <p className="text-sm font-medium text-foreground">{entry.title}</p>
                <p className="shrink-0 text-xs text-muted-foreground">{formatDateTime(entry.timestamp)}</p>
              </div>
              {entry.description && (
                <p className="mt-0.5 text-sm text-muted-foreground">{entry.description}</p>
              )}
            </div>
          </li>
        )
      })}
    </ol>
  )
}
