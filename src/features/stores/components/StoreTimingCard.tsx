import { Clock } from 'lucide-react'
import { cn } from '@/lib/utils'
import type { StoreTiming } from '../types/store.types'

const DAY_ORDER = [
  'MONDAY', 'TUESDAY', 'WEDNESDAY', 'THURSDAY', 'FRIDAY', 'SATURDAY', 'SUNDAY',
] as const

const DAY_LABELS: Record<string, string> = {
  MONDAY: 'Monday',
  TUESDAY: 'Tuesday',
  WEDNESDAY: 'Wednesday',
  THURSDAY: 'Thursday',
  FRIDAY: 'Friday',
  SATURDAY: 'Saturday',
  SUNDAY: 'Sunday',
}

function formatTime(timeStr: string | null | undefined): string {
  if (!timeStr) return '—'
  const parts = timeStr.split(':')
  const h = parseInt(parts[0] ?? '0', 10)
  const m = parseInt(parts[1] ?? '0', 10)
  const period = h >= 12 ? 'PM' : 'AM'
  const hour12 = h % 12 || 12
  return `${hour12}:${String(m).padStart(2, '0')} ${period}`
}

interface StoreTimingCardProps {
  timings: StoreTiming[]
}

export function StoreTimingCard({ timings }: StoreTimingCardProps) {
  const sortedTimings = [...timings].sort(
    (a, b) => DAY_ORDER.indexOf(a.dayOfWeek as typeof DAY_ORDER[number]) -
               DAY_ORDER.indexOf(b.dayOfWeek as typeof DAY_ORDER[number]),
  )

  if (timings.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center rounded-xl border border-border/60 bg-muted/10 py-12 text-center">
        <Clock className="mb-2 h-8 w-8 text-muted-foreground/40" aria-hidden />
        <p className="text-sm text-muted-foreground">No working hours set by the vendor.</p>
      </div>
    )
  }

  const openDays = sortedTimings.filter((t) => !t.isClosed)
  const closedDays = sortedTimings.filter((t) => t.isClosed)

  return (
    <div className="space-y-4">
      <p className="text-xs text-muted-foreground">
        Working hours configured by the vendor. View-only from admin panel.
      </p>

      <div className="overflow-hidden rounded-xl border border-border">
        {sortedTimings.map((timing, i) => (
          <div
            key={timing.id}
            className={cn(
              'flex items-center justify-between px-4 py-3',
              i !== sortedTimings.length - 1 && 'border-b border-border/60',
              timing.isClosed && 'bg-muted/30',
            )}
          >
            <div className="flex items-center gap-3">
              <div
                className={cn(
                  'flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-xs font-bold',
                  timing.isClosed
                    ? 'bg-muted text-muted-foreground'
                    : 'bg-green-100 text-green-700 dark:bg-green-400/10 dark:text-green-400',
                )}
              >
                {(DAY_LABELS[timing.dayOfWeek] ?? timing.dayOfWeek).slice(0, 2).toUpperCase()}
              </div>
              <span className="text-sm font-medium text-foreground">
                {DAY_LABELS[timing.dayOfWeek] ?? timing.dayOfWeek}
              </span>
            </div>

            {timing.isClosed ? (
              <span className="text-xs font-medium text-red-500 dark:text-red-400">Closed</span>
            ) : (
              <span className="font-mono text-sm text-foreground">
                {formatTime(timing.openTime)}
                <span className="mx-2 text-muted-foreground">–</span>
                {formatTime(timing.closeTime)}
              </span>
            )}
          </div>
        ))}
      </div>

      <div className="flex gap-4 text-xs text-muted-foreground">
        <span className="flex items-center gap-1.5">
          <span className="h-2 w-2 rounded-full bg-green-500" />
          Open {openDays.length} day{openDays.length !== 1 ? 's' : ''}
        </span>
        {closedDays.length > 0 && (
          <span className="flex items-center gap-1.5">
            <span className="h-2 w-2 rounded-full bg-red-400" />
            Closed {closedDays.length} day{closedDays.length !== 1 ? 's' : ''}
          </span>
        )}
      </div>
    </div>
  )
}
