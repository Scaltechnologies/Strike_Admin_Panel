import { useEffect, useMemo, useState } from 'react'
import { Link } from '@tanstack/react-router'
import { AnimatePresence, motion } from 'framer-motion'
import { ChevronDown, ChevronLeft, ChevronRight, ExternalLink, History, Search, X, XCircle } from 'lucide-react'
import { cn } from '@/lib/utils'
import { Panel } from '@/features/dashboard/components/dashboard-ui'
import { describeDevice, humanize, METHOD_TONE } from '@/features/audit-logs/utils/audit-display'
import { formatTime, parseServerDate } from '@/utils/helpers/date'
import { useMyActivity, type MyActivityRow } from '../api/profile.api'
import { areaMeta } from '../utils/profile-meta'

function dayHeading(iso: string): string {
  const d = parseServerDate(iso)
  const today = new Date()
  const y = new Date(today)
  y.setDate(today.getDate() - 1)
  const same = (a: Date, b: Date) => a.toDateString() === b.toDateString()
  if (same(d, today)) return 'Today'
  if (same(d, y)) return 'Yesterday'
  return d.toLocaleDateString('en-IN', { weekday: 'long', day: 'numeric', month: 'long', year: d.getFullYear() === today.getFullYear() ? undefined : 'numeric' })
}

function Row({ row }: { row: MyActivityRow }) {
  const [open, setOpen] = useState(false)
  const meta = areaMeta(row.entityType)
  const Icon = meta.icon
  const failed = row.outcome === 'FAILED'
  return (
    <li className="rounded-xl transition-colors hover:bg-muted/40">
      <button type="button" onClick={() => setOpen((v) => !v)} aria-expanded={open} className="flex w-full items-center gap-3 px-2.5 py-2.5 text-left">
        <span className={cn('flex h-9 w-9 shrink-0 items-center justify-center rounded-xl', failed ? 'bg-rose-100 text-rose-600 dark:bg-rose-400/10 dark:text-rose-300' : 'bg-primary/10 text-primary')}>
          {failed ? <XCircle className="h-4 w-4" /> : <Icon className="h-4 w-4" />}
        </span>
        <span className="min-w-0 flex-1">
          <span className="block truncate text-sm font-medium text-foreground">{row.summary?.trim() || humanize(row.action)}</span>
          <span className="block truncate text-xs text-muted-foreground">
            {meta.label}{row.entityId != null && ` · #${row.entityId}`}
            {failed && <span className="ml-1.5 font-semibold text-rose-600 dark:text-rose-400">· didn’t go through</span>}
          </span>
        </span>
        <span className="shrink-0 text-xs tabular-nums text-muted-foreground">{formatTime(parseServerDate(row.createdAt))}</span>
        <ChevronDown className={cn('h-4 w-4 shrink-0 text-muted-foreground transition-transform', open && 'rotate-180')} />
      </button>
      <AnimatePresence initial={false}>
        {open && (
          <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="overflow-hidden">
            <dl className="mx-2.5 mb-3 grid gap-x-6 gap-y-2 rounded-xl border border-border bg-background p-3 text-xs sm:grid-cols-2">
              <div><dt className="text-muted-foreground">What</dt><dd className="font-medium text-foreground">{humanize(row.action)}</dd></div>
              <div><dt className="text-muted-foreground">Result</dt><dd className={cn('font-medium', failed ? 'text-rose-600 dark:text-rose-400' : 'text-emerald-600 dark:text-emerald-400')}>{failed ? 'Didn’t go through' : 'Done'}</dd></div>
              {row.path && (
                <div className="sm:col-span-2"><dt className="text-muted-foreground">Request</dt>
                  <dd className="flex items-center gap-1.5 font-mono text-[11px] text-foreground">
                    {row.httpMethod && <span className={cn('rounded px-1.5 py-px text-[10px] font-bold', METHOD_TONE[row.httpMethod] ?? 'bg-muted')}>{row.httpMethod}</span>}
                    <span className="truncate">{row.path}</span>
                  </dd>
                </div>
              )}
              {row.details && <div className="sm:col-span-2"><dt className="text-muted-foreground">Details</dt><dd className="whitespace-pre-wrap break-words text-foreground">{row.details}</dd></div>}
              <div><dt className="text-muted-foreground">Device</dt><dd className="text-foreground">{describeDevice(row.userAgent)}</dd></div>
              {meta.to && <div><dt className="text-muted-foreground">Open</dt><dd><Link to={meta.to} className="inline-flex items-center gap-1 font-semibold text-primary hover:underline">{meta.label}<ExternalLink className="h-3 w-3" /></Link></dd></div>}
            </dl>
          </motion.div>
        )}
      </AnimatePresence>
    </li>
  )
}

export function ActivityTab({ areas }: { areas: { area: string; count: number }[] }) {
  const [text, setText] = useState('')
  const [q, setQ] = useState('')
  const [area, setArea] = useState<string>()
  const [failedOnly, setFailedOnly] = useState(false)
  const [page, setPage] = useState(0)

  useEffect(() => {
    const t = window.setTimeout(() => { setQ(text.trim()); setPage(0) }, 300)
    return () => window.clearTimeout(t)
  }, [text])

  const activity = useMyActivity({ page, size: 25, q, area, failedOnly })
  const rows = useMemo(() => activity.data?.content ?? [], [activity.data])
  const total = activity.data?.totalElements ?? 0
  const pages = activity.data?.totalPages ?? 0
  const groups = useMemo(() => {
    const out: { day: string; rows: MyActivityRow[] }[] = []
    for (const r of rows) {
      const day = dayHeading(r.createdAt)
      const last = out[out.length - 1]
      if (last?.day === day) last.rows.push(r)
      else out.push({ day, rows: [r] })
    }
    return out
  }, [rows])
  const filtered = !!(q || area || failedOnly)

  return (
    <Panel title="My activity" subtitle={activity.isLoading ? 'Loading…' : `${total.toLocaleString('en-IN')} change${total === 1 ? '' : 's'}${filtered ? ' match' : ' in total'}`} icon={<History className="h-4 w-4" />}>
      <div className="mb-4 flex flex-col gap-3">
        <div className="flex flex-wrap items-center gap-2">
          <div className="relative min-w-[220px] flex-1">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <input value={text} onChange={(e) => setText(e.target.value)} placeholder="Search what you did, e.g. “approved” or “banner”"
              className="w-full rounded-xl border border-border bg-background py-2 pl-9 pr-9 text-sm focus:border-primary focus:outline-none focus:ring-4 focus:ring-primary/15" />
            {text && <button type="button" onClick={() => setText('')} aria-label="Clear search" className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"><X className="h-4 w-4" /></button>}
          </div>
          <button type="button" onClick={() => { setFailedOnly((v) => !v); setPage(0) }} aria-pressed={failedOnly}
            className={cn('inline-flex items-center gap-1.5 rounded-xl border px-3 py-2 text-xs font-semibold transition-colors',
              failedOnly ? 'border-rose-300 bg-rose-50 text-rose-700 dark:border-rose-400/30 dark:bg-rose-400/10 dark:text-rose-300' : 'border-border text-muted-foreground hover:text-foreground')}>
            <XCircle className="h-3.5 w-3.5" />Only what didn’t go through
          </button>
        </div>
        {areas.length > 0 && (
          <div className="flex flex-wrap gap-1.5">
            <button type="button" onClick={() => { setArea(undefined); setPage(0) }}
              className={cn('rounded-full px-3 py-1 text-xs font-medium transition-colors', !area ? 'bg-foreground text-background' : 'bg-muted text-muted-foreground hover:text-foreground')}>All areas</button>
            {areas.map((a) => {
              const m = areaMeta(a.area)
              const on = area === a.area
              return (
                <button key={a.area} type="button" onClick={() => { setArea(on ? undefined : a.area); setPage(0) }}
                  className={cn('inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-medium transition-colors', on ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground hover:text-foreground')}>
                  <m.icon className="h-3 w-3" />{m.label}<span className="opacity-60">{a.count}</span>
                </button>
              )
            })}
          </div>
        )}
      </div>

      {activity.isLoading ? <div className="space-y-2">{Array.from({ length: 6 }, (_, i) => <div key={i} className="h-12 animate-pulse rounded-xl bg-muted" />)}</div>
        : rows.length === 0 ? (
          <div className="py-14 text-center">
            <History className="mx-auto h-10 w-10 text-muted-foreground/40" />
            <p className="mt-3 text-sm font-medium text-foreground">{filtered ? 'Nothing matches' : 'Nothing yet'}</p>
            <p className="text-xs text-muted-foreground">{filtered ? 'Try a different word or area.' : 'Changes you make in the panel will show up here.'}</p>
          </div>
        ) : (
          <div className={cn('space-y-4 transition-opacity', activity.isFetching && 'opacity-60')}>
            {groups.map((g) => (
              <section key={g.day}>
                <h3 className="sticky top-16 z-10 mb-1 bg-card/90 px-2.5 py-1 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground backdrop-blur">{g.day}</h3>
                <ul className="space-y-0.5">{g.rows.map((r) => <Row key={r.id} row={r} />)}</ul>
              </section>
            ))}
          </div>
        )}

      {pages > 1 && (
        <div className="mt-4 flex items-center justify-between border-t border-border pt-4 text-sm">
          <span className="text-xs text-muted-foreground">Page {page + 1} of {pages}</span>
          <div className="flex gap-2">
            <button type="button" disabled={page === 0} onClick={() => setPage((p) => p - 1)} className="inline-flex items-center gap-1 rounded-lg border border-border px-3 py-1.5 text-xs font-medium disabled:opacity-40"><ChevronLeft className="h-3.5 w-3.5" />Newer</button>
            <button type="button" disabled={page + 1 >= pages} onClick={() => setPage((p) => p + 1)} className="inline-flex items-center gap-1 rounded-lg border border-border px-3 py-1.5 text-xs font-medium disabled:opacity-40">Older<ChevronRight className="h-3.5 w-3.5" /></button>
          </div>
        </div>
      )}
    </Panel>
  )
}
