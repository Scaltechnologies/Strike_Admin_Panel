import { useReactTable, getCoreRowModel, flexRender, type ColumnDef } from '@tanstack/react-table'
import { ChevronLeft, ChevronRight, RefreshCw, Bell } from 'lucide-react'
import { StatusBadge } from '@/components/common/StatusBadge'
import { formatDateTime } from '@/utils/helpers/date'
import type { NotificationLog } from '../types/notification.types'

interface NotificationLogTableProps {
  data: NotificationLog[]
  isLoading: boolean
  page: number
  totalPages: number
  totalElements: number
  pageSize: number
  onPageChange: (p: number) => void
  onRefresh: () => void
  emptyMessage?: string
  /** Emphasize the error detail column — used by the Failed Deliveries tab. */
  showError?: boolean
}

const SKELETON = 6

export function NotificationLogTable({
  data,
  isLoading,
  page,
  totalPages,
  totalElements,
  pageSize,
  onPageChange,
  onRefresh,
  emptyMessage = 'No notifications found',
  showError = false,
}: NotificationLogTableProps) {
  const columns: ColumnDef<NotificationLog>[] = [
    {
      id: 'id',
      header: '#',
      cell: ({ row }) => <span className="font-mono text-xs text-muted-foreground">#{row.original.id}</span>,
    },
    {
      id: 'recipient',
      header: 'Recipient',
      cell: ({ row }) => (
        <div>
          <p className="text-sm font-medium text-foreground">
            {row.original.recipientType} {row.original.recipientId != null ? `#${row.original.recipientId}` : ''}
          </p>
          <p className="font-mono text-xs text-muted-foreground">
            {row.original.recipientMobile ?? row.original.recipientEmail ?? '—'}
          </p>
        </div>
      ),
    },
    {
      id: 'channel',
      header: 'Channel',
      cell: ({ row }) => (
        <span className="rounded bg-muted px-2 py-0.5 font-mono text-xs text-foreground">
          {row.original.channel}
        </span>
      ),
    },
    {
      id: 'type',
      header: 'Type',
      cell: ({ row }) => <span className="text-xs text-muted-foreground">{row.original.type}</span>,
    },
    {
      id: 'message',
      header: 'Message',
      cell: ({ row }) => (
        <div className="max-w-xs">
          {row.original.title && (
            <p className="truncate text-sm font-medium text-foreground" title={row.original.title}>
              {row.original.title}
            </p>
          )}
          <p className="truncate text-sm text-muted-foreground" title={row.original.message}>
            {row.original.message}
          </p>
        </div>
      ),
    },
    {
      id: 'status',
      header: 'Status',
      cell: ({ row }) => {
        const s = row.original.status
        const variant = s === 'SENT' ? 'success' : s === 'MOCK' ? 'info' : s === 'FAILED' ? 'error' : 'default'
        return <StatusBadge status={variant} label={s} size="sm" />
      },
    },
    ...(showError
      ? [
          {
            id: 'error',
            header: 'Error',
            cell: ({ row }: { row: { original: NotificationLog } }) => (
              <span className="text-xs text-destructive">{row.original.errorDetail ?? '—'}</span>
            ),
          } satisfies ColumnDef<NotificationLog>,
        ]
      : []),
    {
      id: 'date',
      header: 'Sent',
      cell: ({ row }) => <span className="text-xs text-muted-foreground">{formatDateTime(row.original.createdAt)}</span>,
    },
  ]

  const table = useReactTable({
    data,
    columns,
    getCoreRowModel: getCoreRowModel(),
    manualPagination: true,
    pageCount: totalPages,
    state: { pagination: { pageIndex: page, pageSize } },
  })

  const start = totalElements === 0 ? 0 : page * pageSize + 1
  const end = Math.min((page + 1) * pageSize, totalElements)

  return (
    <div className="flex flex-col">
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border bg-muted/40">
              {table.getHeaderGroups()[0]?.headers.map((h) => (
                <th
                  key={h.id}
                  className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wide text-muted-foreground"
                >
                  {flexRender(h.column.columnDef.header, h.getContext())}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {isLoading ? (
              Array.from({ length: SKELETON }).map((_, i) => (
                <tr key={i}>
                  {columns.map((_, ci) => (
                    <td key={ci} className="px-4 py-3">
                      <div className="h-4 animate-pulse rounded bg-muted" />
                    </td>
                  ))}
                </tr>
              ))
            ) : data.length === 0 ? (
              <tr>
                <td colSpan={columns.length} className="py-16 text-center">
                  <Bell className="mx-auto mb-2 h-8 w-8 text-muted-foreground/40" />
                  <p className="text-sm text-muted-foreground">{emptyMessage}</p>
                </td>
              </tr>
            ) : (
              table.getRowModel().rows.map((row) => (
                <tr key={row.id} className="transition-colors hover:bg-muted/30">
                  {row.getVisibleCells().map((cell) => (
                    <td key={cell.id} className="px-4 py-3">
                      {flexRender(cell.column.columnDef.cell, cell.getContext())}
                    </td>
                  ))}
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
          <button
            onClick={onRefresh}
            className="flex h-7 w-7 items-center justify-center rounded-lg text-muted-foreground transition-colors hover:bg-muted"
            title="Refresh"
          >
            <RefreshCw className="h-3.5 w-3.5" />
          </button>
          <button
            onClick={() => onPageChange(page - 1)}
            disabled={page === 0}
            className="flex h-7 w-7 items-center justify-center rounded-lg text-muted-foreground transition-colors hover:bg-muted disabled:opacity-40"
          >
            <ChevronLeft className="h-4 w-4" />
          </button>
          <span className="text-xs text-muted-foreground">{page + 1} / {Math.max(1, totalPages)}</span>
          <button
            onClick={() => onPageChange(page + 1)}
            disabled={page >= totalPages - 1}
            className="flex h-7 w-7 items-center justify-center rounded-lg text-muted-foreground transition-colors hover:bg-muted disabled:opacity-40"
          >
            <ChevronRight className="h-4 w-4" />
          </button>
        </div>
      </div>
    </div>
  )
}
