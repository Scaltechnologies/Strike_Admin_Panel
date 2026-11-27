import { format, formatDistanceToNowStrict, isToday, isYesterday } from 'date-fns'
import { AlertTriangle, ChevronRight, Globe, Smartphone } from 'lucide-react'
import { cn } from '@/lib/utils'
import type { AuditLogResponse } from '../types/audit-log.types'
import {
  actorDisplayName, actorMeta, describeDevice, happenedAt, initials, isSecurityAction, roleLabel, summaryOf,
} from '../utils/audit-display'

interface AuditTimelineProps {
  logs: AuditLogResponse[]
  loading: boolean
  selectedId?: number
  onSelect: (log: AuditLogResponse) => void
}

function dayLabel(d: Date): string {
  if (isToday(d)) return 'Today'
  if (isYesterday(d)) return 'Yesterday'
  return format(d, 'EEEE, MMM d, yyyy')
}

function groupByDay(logs: AuditLogResponse[]) {
  const groups: { label: string; items: AuditLogResponse[] }[] = []
  for (const log of logs) {
    const label = dayLabel(happenedAt(log))
    const last = groups[groups.length - 1]
    if (last && last.label === label) last.items.push(log)
    else groups.push({ label, items: [log] })
  }
  return groups
}

export function AuditTimeline({ logs, loading, selectedId, onSelect }: AuditTimelineProps) {
  if (loading && logs.length === 0) {
    return (
      <div className="divide-y divide-border">
        {Array.from({ length: 8 }).map((_, i) => (
          <div key={i} className="flex items-center gap-4 px-5 py-4">
            <div className="h-10 w-10 animate-pulse rounded-full bg-muted" />
            <div className="flex-1 space-y-2">
              <div className="h-3.5 w-1/2 animate-pulse rounded bg-muted" />
              <div className="h-3 w-1/3 animate-pulse rounded bg-muted" />
            </div>
          </div>
        ))}
      </div>
    )
  }

  return (
    <div>
      {groupByDay(logs).map((group) => (
        <section key={group.label}>
          <h3 className="sticky top-0 z-10 border-y border-border bg-muted/70 px-5 py-1.5 text-[11px] font-semibold uppercase tracking-widest text-muted-foreground backdrop-blur">
            {group.label}
          </h3>
          <ol>
            {group.items.map((log) => {
              const meta = actorMeta(log)
              const name = actorDisplayName(log)
              const when = happenedAt(log)
              const failed = log.outcome === 'FAILED'
              const Icon = meta.icon
              const security = isSecurityAction(log.action)
              return (
                <li key={log.id}>
                  <button
                    type="button"
                    onClick={() => onSelect(log)}
                    className={cn(
                      'group flex w-full items-start gap-4 px-5 py-3.5 text-left transition-colors hover:bg-muted/50 focus-visible:bg-muted/60 focus-visible:outline-none',
                      selectedId === log.id && 'bg-primary/5',
                      failed && 'bg-red-50/40 dark:bg-red-500/[0.04]',
                    )}
                  >
                    <span className="relative mt-0.5 shrink-0">
                      <span className={cn('flex h-10 w-10 items-center justify-center rounded-full text-xs font-bold ring-1', meta.tone)}>
                        {initials(name)}
                      </span>
                      <span className={cn('absolute -bottom-0.5 -right-0.5 flex h-4.5 w-4.5 items-center justify-center rounded-full ring-2 ring-card', meta.tone)}>
                        <Icon className="h-2.5 w-2.5" aria-hidden />
                      </span>
                    </span>

                    <span className="min-w-0 flex-1">
                      <span className="flex flex-wrap items-center gap-x-1.5 gap-y-1">
                        <span className="text-sm font-semibold text-foreground">{name}</span>
                        <span className={cn('rounded-full px-1.5 py-px text-[10px] font-semibold ring-1', meta.tone)}>
                          {log.source !== 'SYSTEM' && log.actorRole && log.actorRole !== 'UNKNOWN' ? roleLabel(log.actorRole) : meta.label}
                        </span>
                        {failed && (
                          <span className="inline-flex items-center gap-1 rounded-full bg-red-100 px-1.5 py-px text-[10px] font-semibold text-red-700 dark:bg-red-400/10 dark:text-red-300">
                            <AlertTriangle className="h-2.5 w-2.5" aria-hidden /> Failed
                          </span>
                        )}
                        {security && !failed && (
                          <span className="rounded-full bg-amber-100 px-1.5 py-px text-[10px] font-semibold text-amber-700 dark:bg-amber-400/10 dark:text-amber-300">
                            Security
                          </span>
                        )}
                      </span>
                      <span className={cn('mt-0.5 block text-sm', failed ? 'text-red-700 dark:text-red-300' : 'text-foreground/90')}>
                        {summaryOf(log)}
                        {failed && log.details && <span className="text-muted-foreground"> · {log.details}</span>}
                      </span>
                      <span className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-0.5 text-[11px] text-muted-foreground">
                        <span title={format(when, 'PPpp')}>{format(when, 'HH:mm:ss')} · {formatDistanceToNowStrict(when, { addSuffix: true })}</span>
                        {log.entityType && (
                          <span>{log.entityType}{log.entityId != null ? ` #${log.entityId}` : ''}</span>
                        )}
                        {log.source && (
                          <span className="inline-flex items-center gap-1">
                            {log.source === 'VENDOR_APP' ? <Smartphone className="h-3 w-3" aria-hidden /> : <Globe className="h-3 w-3" aria-hidden />}
                            {log.source === 'VENDOR_APP' ? 'Vendor app' : log.source === 'SYSTEM' ? 'System' : 'Admin panel'}
                          </span>
                        )}
                        {log.ipAddress && <span className="font-mono">{log.ipAddress}</span>}
                        {log.userAgent && <span className="hidden sm:inline">{describeDevice(log.userAgent)}</span>}
                      </span>
                    </span>

                    <ChevronRight className="mt-3 h-4 w-4 shrink-0 text-muted-foreground/50 transition-transform group-hover:translate-x-0.5 group-hover:text-muted-foreground" aria-hidden />
                  </button>
                </li>
              )
            })}
          </ol>
        </section>
      ))}
    </div>
  )
}
