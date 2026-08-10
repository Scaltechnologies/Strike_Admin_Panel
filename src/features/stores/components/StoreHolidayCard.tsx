import { CalendarOff } from 'lucide-react'
import { cn } from '@/lib/utils'
import type { StoreHoliday } from '../types/store.types'

function formatHolidayDate(dateStr: string): string {
  const parts = dateStr.split('-')
  const y = parseInt(parts[0] ?? '0', 10)
  const m = parseInt(parts[1] ?? '0', 10)
  const d = parseInt(parts[2] ?? '0', 10)
  return new Date(y, m - 1, d).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  })
}

function isUpcoming(dateStr: string): boolean {
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  const parts = dateStr.split('-')
  const y = parseInt(parts[0] ?? '0', 10)
  const m = parseInt(parts[1] ?? '0', 10)
  const d = parseInt(parts[2] ?? '0', 10)
  return new Date(y, m - 1, d) >= today
}

function isPast(dateStr: string): boolean {
  return !isUpcoming(dateStr)
}

interface StoreHolidayCardProps {
  holidays: StoreHoliday[]
}

export function StoreHolidayCard({ holidays }: StoreHolidayCardProps) {
  if (holidays.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center rounded-xl border border-border/60 bg-muted/10 py-12 text-center">
        <CalendarOff className="mb-2 h-8 w-8 text-muted-foreground/40" aria-hidden />
        <p className="text-sm text-muted-foreground">No holidays configured by the vendor.</p>
      </div>
    )
  }

  const sorted = [...holidays].sort((a, b) => a.date.localeCompare(b.date))
  const upcoming = sorted.filter((h) => isUpcoming(h.date))
  const past = sorted.filter((h) => isPast(h.date))

  return (
    <div className="space-y-5">
      <p className="text-xs text-muted-foreground">
        Holidays configured by the vendor. View-only from admin panel.
      </p>

      {upcoming.length > 0 && (
        <div>
          <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            Upcoming ({upcoming.length})
          </p>
          <div className="space-y-2">
            {upcoming.map((h) => (
              <HolidayRow key={h.id} holiday={h} upcoming />
            ))}
          </div>
        </div>
      )}

      {past.length > 0 && (
        <div>
          <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            Past ({past.length})
          </p>
          <div className="space-y-2">
            {past.map((h) => (
              <HolidayRow key={h.id} holiday={h} upcoming={false} />
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

function HolidayRow({
  holiday,
  upcoming,
}: {
  holiday: StoreHoliday
  upcoming: boolean
}) {
  return (
    <div
      className={cn(
        'flex items-start justify-between gap-3 rounded-lg border px-3 py-2.5',
        upcoming
          ? 'border-amber-200 bg-amber-50 dark:border-amber-800 dark:bg-amber-950/20'
          : 'border-border/60 bg-muted/20',
      )}
    >
      <div className="flex items-center gap-2.5">
        <CalendarOff
          className={cn(
            'h-4 w-4 shrink-0',
            upcoming ? 'text-amber-600 dark:text-amber-400' : 'text-muted-foreground',
          )}
          aria-hidden
        />
        <div>
          <p
            className={cn(
              'text-sm font-medium',
              upcoming ? 'text-amber-800 dark:text-amber-300' : 'text-muted-foreground',
            )}
          >
            {formatHolidayDate(holiday.date)}
          </p>
          {holiday.reason && (
            <p className="text-xs text-muted-foreground">{holiday.reason}</p>
          )}
        </div>
      </div>
      {upcoming && (
        <span className="shrink-0 rounded-full bg-amber-100 px-2 py-0.5 text-xs font-medium text-amber-700 dark:bg-amber-400/10 dark:text-amber-400">
          Upcoming
        </span>
      )}
    </div>
  )
}
