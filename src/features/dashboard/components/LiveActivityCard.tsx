import { Link } from '@tanstack/react-router'
import { AnimatePresence, motion } from 'framer-motion'
import { useQuery } from '@tanstack/react-query'
import { formatDistanceToNowStrict } from 'date-fns'
import { AlertTriangle, ArrowUpRight, Radio } from 'lucide-react'
import { cn } from '@/lib/utils'
import { auditLogsApi } from '@/features/audit-logs/api/audit-logs.api'
import { actorDisplayName, actorMeta, happenedAt, initials, summaryOf } from '@/features/audit-logs/utils/audit-display'
import { Panel, Skeleton } from './dashboard-ui'

const FEED_SIZE = 7

/** The latest things admins, store owners and managers did. Shown only to people with Audit Logs access. */
export function LiveActivityCard() {
  const { data, isLoading, isError } = useQuery({
    queryKey: ['dashboard', 'activity'],
    queryFn: () => auditLogsApi.list({ range: '7d' }, 0, FEED_SIZE),
    refetchInterval: 15_000,
    staleTime: 10_000,
    retry: 1,
    meta: { suppressError: true },
  })
  const logs = data?.content ?? []

  return (
    <Panel
      title="Live activity"
      subtitle="What people are doing across Strike"
      icon={<Radio className="h-4 w-4" />}
      className="h-full"
      action={
        <div className="flex items-center gap-3">
          <span className="flex items-center gap-1.5 text-[11px] font-medium text-emerald-600 dark:text-emerald-400">
            <span className="relative flex h-2 w-2">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75" />
              <span className="relative inline-flex h-2 w-2 rounded-full bg-emerald-500" />
            </span>
            Live
          </span>
          <Link to="/audit-logs" className="inline-flex items-center gap-0.5 text-xs font-medium text-primary hover:underline">
            All <ArrowUpRight className="h-3 w-3" />
          </Link>
        </div>
      }
    >
      {isLoading ? (
        <div className="space-y-3">{Array.from({ length: 5 }).map((_, i) => <Skeleton key={i} className="h-12 w-full" />)}</div>
      ) : isError ? (
        <p className="py-10 text-center text-sm text-muted-foreground">Activity couldn&apos;t be loaded.</p>
      ) : logs.length === 0 ? (
        <p className="py-10 text-center text-sm text-muted-foreground">Nothing has happened in the last 7 days.</p>
      ) : (
        <ol className="relative">
          <span className="absolute bottom-3 left-[19px] top-3 w-px bg-gradient-to-b from-border via-border to-transparent" aria-hidden />
          <AnimatePresence initial={false}>
            {logs.map((log, i) => {
              const meta = actorMeta(log)
              const name = actorDisplayName(log)
              const failed = log.outcome === 'FAILED'
              return (
                <motion.li
                  key={log.id}
                  layout
                  initial={{ opacity: 0, y: -14, scale: 0.97 }}
                  animate={{ opacity: 1, y: 0, scale: 1, transition: { delay: i * 0.03 } }}
                  exit={{ opacity: 0, height: 0 }}
                  className="relative flex gap-3 py-2"
                >
                  <span className={cn('relative z-10 flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-[11px] font-bold ring-4 ring-card', meta.tone)}>
                    {initials(name)}
                  </span>
                  <div className="min-w-0 flex-1 pt-0.5">
                    <p className="truncate text-sm text-foreground">
                      <span className="font-semibold">{name}</span>{' '}
                      <span className={cn(failed ? 'text-red-600 dark:text-red-400' : 'text-muted-foreground')}>
                        {summaryOf(log).charAt(0).toLowerCase() + summaryOf(log).slice(1)}
                      </span>
                    </p>
                    <p className="mt-0.5 flex items-center gap-2 text-[11px] text-muted-foreground">
                      <span className={cn('inline-block h-1.5 w-1.5 rounded-full', meta.dot)} />
                      {meta.label}
                      <span>·</span>
                      {formatDistanceToNowStrict(happenedAt(log), { addSuffix: true })}
                      {failed && (
                        <span className="inline-flex items-center gap-0.5 font-medium text-red-600 dark:text-red-400">
                          <AlertTriangle className="h-3 w-3" /> failed
                        </span>
                      )}
                    </p>
                  </div>
                </motion.li>
              )
            })}
          </AnimatePresence>
        </ol>
      )}
    </Panel>
  )
}
