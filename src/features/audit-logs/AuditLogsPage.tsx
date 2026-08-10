import { useState } from 'react'
import { FileText, ChevronLeft, ChevronRight, RefreshCw, Search } from 'lucide-react'
import { formatDateTime } from '@/utils/helpers/date'
import { useAuditLogList } from './hooks/useAuditLogs'

const PAGE_SIZE = 30

function ActionBadge({ action }: { action: string }) {
  const lower = action.toLowerCase()
  let cls = 'bg-blue-100 text-blue-700 dark:bg-blue-400/10 dark:text-blue-400'
  if (lower.includes('delete') || lower.includes('remove') || lower.includes('reject'))
    cls = 'bg-red-100 text-red-700 dark:bg-red-400/10 dark:text-red-400'
  else if (lower.includes('create') || lower.includes('add') || lower.includes('approve'))
    cls = 'bg-green-100 text-green-700 dark:bg-green-400/10 dark:text-green-400'
  else if (lower.includes('update') || lower.includes('edit') || lower.includes('change'))
    cls = 'bg-amber-100 text-amber-700 dark:bg-amber-400/10 dark:text-amber-400'
  return (
    <span className={`inline-flex items-center rounded-full px-2 py-0.5 font-mono text-xs font-medium ${cls}`}>
      {action}
    </span>
  )
}

export function AuditLogsPage() {
  const [page, setPage] = useState(0)
  const [search, setSearch] = useState('')

  const { data, isLoading, refetch } = useAuditLogList(page, PAGE_SIZE)

  const logs = (data?.content ?? []).filter((l) => {
    if (!search) return true
    const q = search.toLowerCase()
    return (
      l.action.toLowerCase().includes(q) ||
      (l.actorEmail ?? '').toLowerCase().includes(q) ||
      (l.entityType ?? '').toLowerCase().includes(q) ||
      (l.entityId ?? '').toLowerCase().includes(q)
    )
  })

  const totalPages = data?.totalPages ?? 0
  const totalElements = data?.totalElements ?? 0
  const start = totalElements === 0 ? 0 : page * PAGE_SIZE + 1
  const end = Math.min((page + 1) * PAGE_SIZE, totalElements)

  return (
    <div className="flex h-full flex-col gap-6 p-6">
      <div>
        <h1 className="text-xl font-semibold text-foreground">Audit Logs</h1>
        <p className="mt-0.5 text-sm text-muted-foreground">Track all admin actions across the platform</p>
      </div>

      <div className="flex items-center gap-3">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Filter by action, actor, entity…"
            className="w-full rounded-lg border border-border bg-card py-2 pl-9 pr-3 text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
          />
        </div>
        <button onClick={() => void refetch()}
          className="flex h-9 w-9 items-center justify-center rounded-lg border border-border text-muted-foreground hover:bg-muted hover:text-foreground">
          <RefreshCw className="h-3.5 w-3.5" />
        </button>
      </div>

      <div className="overflow-hidden rounded-xl border border-border bg-card shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border bg-muted/40">
                {['#', 'Action', 'Actor', 'Entity', 'IP', 'Timestamp'].map((h) => (
                  <th key={h} className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wide text-muted-foreground whitespace-nowrap">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {isLoading ? (
                Array.from({ length: 8 }).map((_, i) => (
                  <tr key={i}>
                    {Array.from({ length: 6 }).map((_, ci) => (
                      <td key={ci} className="px-4 py-3"><div className="h-4 animate-pulse rounded bg-muted" /></td>
                    ))}
                  </tr>
                ))
              ) : logs.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-16 text-center">
                    <FileText className="mx-auto mb-2 h-8 w-8 text-muted-foreground/40" />
                    <p className="text-sm text-muted-foreground">No audit logs found</p>
                  </td>
                </tr>
              ) : (
                logs.map((log) => (
                  <tr key={log.id} className="hover:bg-muted/30">
                    <td className="px-4 py-3 font-mono text-xs text-muted-foreground">#{log.id}</td>
                    <td className="px-4 py-3"><ActionBadge action={log.action} /></td>
                    <td className="px-4 py-3">
                      <div>
                        <p className="text-sm text-foreground">{log.actorEmail ?? `Admin #${log.actorId}`}</p>
                        {log.actorRole && <p className="text-xs text-muted-foreground">{log.actorRole}</p>}
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      {log.entityType ? (
                        <div>
                          <p className="text-xs font-medium text-foreground">{log.entityType}</p>
                          {log.entityId && <p className="font-mono text-xs text-muted-foreground">#{log.entityId}</p>}
                        </div>
                      ) : <span className="text-muted-foreground">—</span>}
                    </td>
                    <td className="px-4 py-3 font-mono text-xs text-muted-foreground">{log.ipAddress ?? '—'}</td>
                    <td className="px-4 py-3 text-xs text-muted-foreground whitespace-nowrap">{formatDateTime(log.createdAt)}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
        <div className="flex items-center justify-between border-t border-border px-4 py-3">
          <p className="text-xs text-muted-foreground">
            {totalElements === 0 ? 'No results' : `${start}–${end} of ${totalElements.toLocaleString()}`}
          </p>
          <div className="flex items-center gap-2">
            <button onClick={() => setPage((p) => p - 1)} disabled={page === 0}
              className="flex h-7 w-7 items-center justify-center rounded-lg text-muted-foreground hover:bg-muted disabled:opacity-40">
              <ChevronLeft className="h-4 w-4" />
            </button>
            <span className="text-xs text-muted-foreground">{page + 1} / {Math.max(1, totalPages)}</span>
            <button onClick={() => setPage((p) => p + 1)} disabled={page >= totalPages - 1}
              className="flex h-7 w-7 items-center justify-center rounded-lg text-muted-foreground hover:bg-muted disabled:opacity-40">
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
