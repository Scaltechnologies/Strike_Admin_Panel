import { useReactTable, getCoreRowModel, flexRender, type ColumnDef } from '@tanstack/react-table'
import { ChevronLeft, ChevronRight, RefreshCw, Banknote, Eye } from 'lucide-react'
import { cn } from '@/lib/utils'
import { formatDate } from '@/utils/helpers/date'
import type { PaymentResponse, PaymentStatus } from '../types/payment.types'

function statusVariant(s: PaymentStatus) {
  if (s === 'COMPLETED') return 'bg-green-100 text-green-700 dark:bg-green-400/10 dark:text-green-400'
  if (s === 'FAILED') return 'bg-red-100 text-red-700 dark:bg-red-400/10 dark:text-red-400'
  if (s === 'REFUNDED') return 'bg-violet-100 text-violet-700 dark:bg-violet-400/10 dark:text-violet-400'
  return 'bg-amber-100 text-amber-700 dark:bg-amber-400/10 dark:text-amber-400'
}

interface PaymentTableProps {
  data: PaymentResponse[]
  isLoading: boolean
  page: number
  totalPages: number
  totalElements: number
  pageSize: number
  onPageChange: (p: number) => void
  onRefresh: () => void
  onView: (p: PaymentResponse) => void
}

const SKELETON = 8

export function PaymentTable({
  data, isLoading, page, totalPages, totalElements, pageSize, onPageChange, onRefresh, onView,
}: PaymentTableProps) {
  const columns: ColumnDef<PaymentResponse>[] = [
    {
      id: 'id', header: '#',
      cell: ({ row }) => <span className="font-mono text-xs text-muted-foreground">#{row.original.id}</span>,
    },
    {
      id: 'user', header: 'User',
      cell: ({ row }) => <span className="font-mono text-sm">User #{row.original.userId}</span>,
    },
    {
      id: 'amount', header: 'Amount',
      cell: ({ row }) => (
        <div>
          <p className="text-sm font-semibold text-foreground">
            ₹{Number(row.original.amountPaid).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
          </p>
          {row.original.refundAmount && (
            <p className="text-xs text-violet-600 dark:text-violet-400">
              Refund: ₹{Number(row.original.refundAmount).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
            </p>
          )}
        </div>
      ),
    },
    {
      id: 'method', header: 'Method',
      cell: ({ row }) => (
        <span className="rounded bg-muted px-2 py-0.5 font-mono text-xs text-foreground">
          {row.original.gateway || '—'}
        </span>
      ),
    },
    {
      id: 'txn', header: 'Transaction ID',
      cell: ({ row }) => (
        <span className="font-mono text-xs text-muted-foreground">
          {row.original.gatewayTransactionId ?? '—'}
        </span>
      ),
    },
    {
      id: 'status', header: 'Status',
      cell: ({ row }) => (
        <span className={cn('inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium', statusVariant(row.original.status))}>
          {row.original.status}
        </span>
      ),
    },
    {
      id: 'date', header: 'Date',
      cell: ({ row }) => <span className="text-xs text-muted-foreground">{formatDate(row.original.createdAt)}</span>,
    },
    {
      id: 'actions', header: '',
      cell: ({ row }) => (
        <button
          onClick={(e) => { e.stopPropagation(); onView(row.original) }}
          className="flex h-7 w-7 items-center justify-center rounded-lg text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
        >
          <Eye className="h-3.5 w-3.5" />
        </button>
      ),
    },
  ]

  const table = useReactTable({
    data, columns, getCoreRowModel: getCoreRowModel(), manualPagination: true,
    pageCount: totalPages, state: { pagination: { pageIndex: page, pageSize } },
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
                <th key={h.id} className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wide text-muted-foreground">
                  {flexRender(h.column.columnDef.header, h.getContext())}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {isLoading
              ? Array.from({ length: SKELETON }).map((_, i) => (
                  <tr key={i}>{columns.map((_, ci) => (
                    <td key={ci} className="px-4 py-3"><div className="h-4 animate-pulse rounded bg-muted" /></td>
                  ))}</tr>
                ))
              : data.length === 0
                ? (
                  <tr>
                    <td colSpan={columns.length} className="py-16 text-center">
                      <Banknote className="mx-auto mb-2 h-8 w-8 text-muted-foreground/40" />
                      <p className="text-sm text-muted-foreground">No payments found</p>
                    </td>
                  </tr>
                )
                : table.getRowModel().rows.map((row) => (
                  <tr key={row.id} onClick={() => onView(row.original)} className="cursor-pointer transition-colors hover:bg-muted/30">
                    {row.getVisibleCells().map((cell) => (
                      <td key={cell.id} className="px-4 py-3">{flexRender(cell.column.columnDef.cell, cell.getContext())}</td>
                    ))}
                  </tr>
                ))}
          </tbody>
        </table>
      </div>
      <div className="flex items-center justify-between border-t border-border px-4 py-3">
        <p className="text-xs text-muted-foreground">
          {totalElements === 0 ? 'No results' : `${start}–${end} of ${totalElements.toLocaleString()}`}
        </p>
        <div className="flex items-center gap-2">
          <button onClick={onRefresh} className="flex h-7 w-7 items-center justify-center rounded-lg text-muted-foreground transition-colors hover:bg-muted" title="Refresh">
            <RefreshCw className="h-3.5 w-3.5" />
          </button>
          <button onClick={() => onPageChange(page - 1)} disabled={page === 0} className="flex h-7 w-7 items-center justify-center rounded-lg text-muted-foreground transition-colors hover:bg-muted disabled:opacity-40">
            <ChevronLeft className="h-4 w-4" />
          </button>
          <span className="text-xs text-muted-foreground">{page + 1} / {Math.max(1, totalPages)}</span>
          <button onClick={() => onPageChange(page + 1)} disabled={page >= totalPages - 1} className="flex h-7 w-7 items-center justify-center rounded-lg text-muted-foreground transition-colors hover:bg-muted disabled:opacity-40">
            <ChevronRight className="h-4 w-4" />
          </button>
        </div>
      </div>
    </div>
  )
}
