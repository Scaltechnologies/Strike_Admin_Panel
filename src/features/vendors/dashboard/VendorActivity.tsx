import { useMemo } from 'react'
import { Link } from '@tanstack/react-router'
import { useQuery } from '@tanstack/react-query'
import { motion } from 'framer-motion'
import { format, formatDistanceToNowStrict } from 'date-fns'
import { AlertTriangle, ArrowUpRight, History } from 'lucide-react'
import { cn } from '@/lib/utils'
import { auditLogsApi } from '@/features/audit-logs/api/audit-logs.api'
import { actorDisplayName, actorMeta, describeDevice, happenedAt, initials, summaryOf } from '@/features/audit-logs/utils/audit-display'
import type { AuditLogResponse } from '@/features/audit-logs/types/audit-log.types'
import { Panel, Skeleton } from '@/features/dashboard/components/dashboard-ui'
import type { VendorRecord } from '../types/vendor.types'

/** Admin actions on this vendor + what the vendor (and their managers) did in the vendor app. */
export function VendorActivity({ vendor }: { vendor: VendorRecord }) {
  const onVendor = useQuery({
    queryKey: ['vendors', vendor.vendorId, 'activity', 'admin'],
    queryFn: () => auditLogsApi.list({ range: 'all', entityType: 'Vendor', entityId: vendor.vendorId }, 0, 40),
    retry: 1,
    meta: { suppressError: true },
  })
  const byVendor = useQuery({
    queryKey: ['vendors', vendor.vendorId, 'activity', 'own', vendor.mobileNumber],
    queryFn: () => auditLogsApi.list({ range: 'all', actorEmail: vendor.mobileNumber }, 0, 40),
    enabled: !!vendor.mobileNumber,
    retry: 1,
    meta: { suppressError: true },
  })

  const logs = useMemo(() => {
    const seen = new Set<number>()
    const all: AuditLogResponse[] = []
    for (const l of [...(onVendor.data?.content ?? []), ...(byVendor.data?.content ?? [])]) {
      if (!seen.has(l.id)) { seen.add(l.id); all.push(l) }
    }
    return all.sort((a, b) => happenedAt(b).getTime() - happenedAt(a).getTime()).slice(0, 50)
  }, [onVendor.data, byVendor.data])

  const loading = onVendor.isLoading || (byVendor.isLoading && !!vendor.mobileNumber)

  return (
    <Panel title="Activity" subtitle="Admin decisions about this vendor and what they did in the vendor app"
      icon={<History className="h-4 w-4" />}
      action={
        <Link to="/audit-logs" className="inline-flex items-center gap-0.5 text-xs font-medium text-primary hover:underline">
          Audit logs <ArrowUpRight className="h-3 w-3" />
        </Link>
      }>
      {loading ? (
        <div className="space-y-3">{Array.from({ length: 6 }).map((_, i) => <Skeleton key={i} className="h-12 w-full" />)}</div>
      ) : logs.length === 0 ? (
        <p className="py-12 text-center text-sm text-muted-foreground">No recorded activity for this vendor yet.</p>
      ) : (
        <ol className="relative">
          <span className="absolute bottom-4 left-[19px] top-4 w-px bg-border" aria-hidden />
          {logs.map((log, i) => {
            const meta = actorMeta(log)
            const name = actorDisplayName(log)
            const when = happenedAt(log)
            const failed = log.outcome === 'FAILED'
            return (
              <motion.li key={log.id} initial={{ opacity: 0, x: -8 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: Math.min(i, 15) * 0.03 }}
                className="relative flex gap-3 py-2.5">
                <span className={cn('relative z-10 flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-[11px] font-bold ring-4 ring-card', meta.tone)}>
                  {initials(name)}
                </span>
                <div className="min-w-0 flex-1">
                  <p className="text-sm text-foreground">
                    <span className="font-semibold">{name}</span>{' '}
                    <span className={cn(failed ? 'text-red-600 dark:text-red-400' : 'text-muted-foreground')}>
                      {summaryOf(log).charAt(0).toLowerCase() + summaryOf(log).slice(1)}
                    </span>
                    {failed && log.details && <span className="text-muted-foreground"> · {log.details}</span>}
                  </p>
                  <p className="mt-0.5 flex flex-wrap items-center gap-x-2 text-[11px] text-muted-foreground">
                    <span title={format(when, 'PPpp')}>{format(when, 'MMM d, HH:mm')} · {formatDistanceToNowStrict(when, { addSuffix: true })}</span>
                    <span>{meta.label}</span>
                    {log.userAgent && <span>{describeDevice(log.userAgent)}</span>}
                    {failed && <span className="inline-flex items-center gap-0.5 font-medium text-red-600 dark:text-red-400"><AlertTriangle className="h-3 w-3" />failed</span>}
                  </p>
                </div>
              </motion.li>
            )
          })}
        </ol>
      )}
    </Panel>
  )
}
