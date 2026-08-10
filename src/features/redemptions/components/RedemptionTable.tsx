import { useEffect, useRef, useState } from 'react'
import { useReactTable, getCoreRowModel, flexRender, type ColumnDef } from '@tanstack/react-table'
import { ChevronLeft, ChevronRight, RefreshCw, Receipt, Eye, Store as StoreIcon } from 'lucide-react'
import { StatusBadge } from '@/components/common/StatusBadge'
import { cn } from '@/lib/utils'
import { formatRelative, formatDateTime } from '@/utils/helpers/date'
import { resolveCustomerName } from '../hooks/useRedemptions'
import type { RedemptionRecord, RedemptionStatus } from '../types/redemption.types'
import type { StoreRecord } from '@/features/stores/types/store.types'
import type { UserDetails } from '@/features/users/types/user.types'

function formatCurrency(value: number | null | undefined) {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 2,
  }).format(value ?? 0)
}

function statusMeta(status: RedemptionStatus): { variant: string; label: string } {
  switch (status) {
    case 'PENDING': return { variant: 'pending', label: 'Pending' }
    case 'COMPLETED': return { variant: 'completed', label: 'Completed' }
    case 'REJECTED': return { variant: 'rejected', label: 'Rejected' }
    case 'FAILED': return { variant: 'failed', label: 'Failed' }
    case 'REVERSED': return { variant: 'reversed', label: 'Reversed' }
    default: return { variant: 'default', label: status }
  }
}

interface RedemptionTableProps {
  data: RedemptionRecord[]
  isLoading: boolean
  page: number
  totalPages: number
  totalElements: number
  pageSize: number
  onPageChange: (p: number) => void
  onRefresh: () => void
  onView: (r: RedemptionRecord) => void
  storeMap: Map<number, StoreRecord>
  userMap: Map<number, UserDetails>
}

const SKELETON = 8

export function RedemptionTable({
  data, isLoading, page, totalPages, totalElements, pageSize, onPageChange, onRefresh, onView, storeMap, userMap,
}: RedemptionTableProps) {
  const seenIds = useRef<Set<number>>(new Set())
  const [freshIds, setFreshIds] = useState<Set<number>>(new Set())

  // Flags rows that just showed up since the last fetch (only meaningful on page 0, the
  // most-recent-first view) so they can get a brief highlight fade — the "live" feel.
  useEffect(() => {
    if (data.length === 0 || page !== 0) return
    if (seenIds.current.size === 0) {
      data.forEach((r) => seenIds.current.add(r.id))
      return
    }
    const arrivals = data.filter((r) => !seenIds.current.has(r.id))
    data.forEach((r) => seenIds.current.add(r.id))
    if (arrivals.length > 0) {
      setFreshIds(new Set(arrivals.map((r) => r.id)))
      const t = setTimeout(() => setFreshIds(new Set()), 2200)
      return () => clearTimeout(t)
    }
  }, [data, page])

  const columns: ColumnDef<RedemptionRecord>[] = [
    {
      id: 'id', header: '#',
      cell: ({ row }) => (
        <div className="flex items-center gap-1.5">
          <span className="font-mono text-xs text-muted-foreground">#{row.original.id}</span>
          {freshIds.has(row.original.id) && (
            <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-green-500" aria-label="New" />
          )}
        </div>
      ),
    },
    {
      id: 'store', header: 'Store',
      cell: ({ row }) => {
        const store = storeMap.get(row.original.storeId)
        return (
          <div className="flex items-center gap-1.5 min-w-0">
            <StoreIcon className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
            <span className="truncate text-sm text-foreground">
              {store?.name ?? `Store #${row.original.storeId}`}
            </span>
          </div>
        )
      },
    },
    {
      id: 'customer', header: 'Customer',
      cell: ({ row }) => (
        <span className="text-sm text-foreground">
          {resolveCustomerName(row.original.customerName, row.original.userId, userMap)}
        </span>
      ),
    },
    {
      id: 'amount', header: 'Amount',
      cell: ({ row }) => (
        <span className="text-sm font-semibold text-foreground">{formatCurrency(row.original.totalAmount)}</span>
      ),
    },
    {
      id: 'status', header: 'Status',
      cell: ({ row }) => {
        const meta = statusMeta(row.original.status)
        return <StatusBadge status={meta.variant} label={meta.label} size="sm" dot />
      },
    },
    {
      id: 'initiatedBy', header: 'Initiated By',
      cell: ({ row }) => (
        <span className="text-xs uppercase text-muted-foreground">{row.original.initiatedBy ?? '—'}</span>
      ),
    },
    {
      id: 'time', header: 'When',
      cell: ({ row }) => (
        <span className="text-xs text-muted-foreground" title={formatDateTime(row.original.createdAt)}>
          {formatRelative(row.original.createdAt)}
        </span>
      ),
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
            {isLoading && data.length === 0
              ? Array.from({ length: SKELETON }).map((_, i) => (
                  <tr key={i}>{columns.map((_, ci) => (
                    <td key={ci} className="px-4 py-3"><div className="h-4 animate-pulse rounded bg-muted" /></td>
                  ))}</tr>
                ))
              : data.length === 0
                ? (
                  <tr>
                    <td colSpan={columns.length} className="py-16 text-center">
                      <Receipt className="mx-auto mb-2 h-8 w-8 text-muted-foreground/40" />
                      <p className="text-sm text-muted-foreground">No redemptions found</p>
                    </td>
                  </tr>
                )
                : table.getRowModel().rows.map((row) => (
                  <tr
                    key={row.id}
                    onClick={() => onView(row.original)}
                    className={cn(
                      'cursor-pointer transition-colors duration-700',
                      freshIds.has(row.original.id) ? 'bg-green-50 dark:bg-green-400/10' : 'hover:bg-muted/30',
                    )}
                  >
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
            <RefreshCw className={cn('h-3.5 w-3.5', isLoading && 'animate-spin')} />
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
