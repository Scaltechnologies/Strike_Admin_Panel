import { useReactTable, getCoreRowModel, flexRender, type ColumnDef } from '@tanstack/react-table'
import { ChevronLeft, ChevronRight, RefreshCw, MessageSquare, Trash2 } from 'lucide-react'
import { StatusBadge } from '@/components/common/StatusBadge'
import { formatDateTime } from '@/utils/helpers/date'
import { usePermission } from '@/core/permissions/permissions'
import { PERMISSIONS } from '@/constants/permissions'
import type { InAppNotification } from '../../types/notification.types'

interface Props {
  data: InAppNotification[]
  isLoading: boolean
  page: number
  totalPages: number
  totalElements: number
  pageSize: number
  onPageChange: (p: number) => void
  onRefresh: () => void
  onDelete: (entry: InAppNotification) => void
  deletingId?: number
}

const SKELETON = 5

export function InAppInboxTable({
  data,
  isLoading,
  page,
  totalPages,
  totalElements,
  pageSize,
  onPageChange,
  onRefresh,
  onDelete,
  deletingId,
}: Props) {
  const canSend = usePermission(PERMISSIONS.NOTIFICATIONS.SEND)

  const columns: ColumnDef<InAppNotification>[] = [
    {
      id: 'id',
      header: '#',
      cell: ({ row }) => <span className="font-mono text-xs text-muted-foreground">#{row.original.id}</span>,
    },
    {
      id: 'recipient',
      header: 'Recipient',
      cell: ({ row }) => (
        <p className="text-sm font-medium text-foreground">
          {row.original.recipientType} #{row.original.recipientId}
        </p>
      ),
    },
    {
      id: 'read',
      header: 'Status',
      cell: ({ row }) =>
        row.original.isRead ? (
          <StatusBadge status="success" label="Read" size="sm" />
        ) : (
          <StatusBadge status="info" label="Unread" size="sm" />
        ),
    },
    {
      id: 'type',
      header: 'Type',
      cell: ({ row }) => <span className="text-xs text-muted-foreground">{row.original.type}</span>,
    },
    {
      id: 'content',
      header: 'Content',
      cell: ({ row }) => (
        <div className="max-w-xs">
          <p className="truncate text-sm font-medium text-foreground" title={row.original.title}>
            {row.original.title}
          </p>
          <p className="truncate text-sm text-muted-foreground" title={row.original.message}>
            {row.original.message}
          </p>
        </div>
      ),
    },
    {
      id: 'date',
      header: 'Sent',
      cell: ({ row }) => <span className="text-xs text-muted-foreground">{formatDateTime(row.original.createdAt)}</span>,
    },
    ...(canSend
      ? [
          {
            id: 'actions',
            header: '',
            cell: ({ row }: { row: { original: InAppNotification } }) => (
              <button
                onClick={() => onDelete(row.original)}
                disabled={deletingId === row.original.id}
                className="flex items-center gap-1 rounded-lg px-2 py-1 text-xs font-medium text-destructive transition-colors hover:bg-destructive/10 disabled:opacity-50"
              >
                <Trash2 className="h-3 w-3" />
                Remove
              </button>
            ),
          } satisfies ColumnDef<InAppNotification>,
        ]
      : []),
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
                  <MessageSquare className="mx-auto mb-2 h-8 w-8 text-muted-foreground/40" />
                  <p className="text-sm text-muted-foreground">No in-app notifications found</p>
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
