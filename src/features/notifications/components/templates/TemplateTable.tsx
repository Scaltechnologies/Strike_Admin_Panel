import { useReactTable, getCoreRowModel, flexRender, type ColumnDef } from '@tanstack/react-table'
import { ChevronLeft, ChevronRight, RefreshCw, LayoutTemplate, Pencil, Trash2 } from 'lucide-react'
import { StatusBadge } from '@/components/common/StatusBadge'
import { formatDateTime } from '@/utils/helpers/date'
import { usePermission } from '@/core/permissions/permissions'
import { PERMISSIONS } from '@/constants/permissions'
import type { NotificationTemplate } from '../../types/notification.types'

interface Props {
  data: NotificationTemplate[]
  isLoading: boolean
  page: number
  totalPages: number
  totalElements: number
  pageSize: number
  onPageChange: (p: number) => void
  onRefresh: () => void
  onEdit: (template: NotificationTemplate) => void
  onDelete: (template: NotificationTemplate) => void
  onToggle: (template: NotificationTemplate) => void
  togglingId?: number
}

const SKELETON = 5

export function TemplateTable({
  data,
  isLoading,
  page,
  totalPages,
  totalElements,
  pageSize,
  onPageChange,
  onRefresh,
  onEdit,
  onDelete,
  onToggle,
  togglingId,
}: Props) {
  const canEdit = usePermission(PERMISSIONS.NOTIFICATIONS.SEND)

  const columns: ColumnDef<NotificationTemplate>[] = [
    {
      id: 'name',
      header: 'Name',
      cell: ({ row }) => (
        <div>
          <p className="text-sm font-medium text-foreground">{row.original.name}</p>
          <p className="font-mono text-[11px] text-muted-foreground">{row.original.code}</p>
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
      id: 'body',
      header: 'Body',
      cell: ({ row }) => (
        <p className="max-w-xs truncate text-sm text-muted-foreground" title={row.original.body}>
          {row.original.body}
        </p>
      ),
    },
    {
      id: 'variables',
      header: 'Variables',
      cell: ({ row }) =>
        row.original.variables.length === 0 ? (
          <span className="text-xs text-muted-foreground">—</span>
        ) : (
          <div className="flex flex-wrap gap-1">
            {row.original.variables.map((v) => (
              <span key={v} className="rounded bg-muted px-1.5 py-0.5 font-mono text-[10px] text-muted-foreground">
                {v}
              </span>
            ))}
          </div>
        ),
    },
    {
      id: 'active',
      header: 'Status',
      cell: ({ row }) =>
        canEdit ? (
          <button
            onClick={() => onToggle(row.original)}
            disabled={togglingId === row.original.id}
            className="disabled:opacity-50"
          >
            {row.original.active ? (
              <StatusBadge status="active" label="Active" size="sm" />
            ) : (
              <StatusBadge status="inactive" label="Inactive" size="sm" />
            )}
          </button>
        ) : row.original.active ? (
          <StatusBadge status="active" label="Active" size="sm" />
        ) : (
          <StatusBadge status="inactive" label="Inactive" size="sm" />
        ),
    },
    {
      id: 'updated',
      header: 'Updated',
      cell: ({ row }) => <span className="text-xs text-muted-foreground">{formatDateTime(row.original.updatedAt)}</span>,
    },
    ...(canEdit
      ? [
          {
            id: 'actions',
            header: '',
            cell: ({ row }: { row: { original: NotificationTemplate } }) => (
              <div className="flex items-center gap-1">
                <button
                  onClick={() => onEdit(row.original)}
                  className="flex h-7 w-7 items-center justify-center rounded-lg text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
                  aria-label="Edit template"
                >
                  <Pencil className="h-3.5 w-3.5" />
                </button>
                <button
                  onClick={() => onDelete(row.original)}
                  className="flex h-7 w-7 items-center justify-center rounded-lg text-muted-foreground transition-colors hover:bg-destructive/10 hover:text-destructive"
                  aria-label="Delete template"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </button>
              </div>
            ),
          } satisfies ColumnDef<NotificationTemplate>,
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
                  <LayoutTemplate className="mx-auto mb-2 h-8 w-8 text-muted-foreground/40" />
                  <p className="text-sm text-muted-foreground">No templates found</p>
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
