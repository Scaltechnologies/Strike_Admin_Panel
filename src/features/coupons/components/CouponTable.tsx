import {
  useReactTable,
  getCoreRowModel,
  flexRender,
  type ColumnDef,
} from '@tanstack/react-table'
import { ChevronLeft, ChevronRight, RefreshCw, Tag, ToggleLeft, ToggleRight, Eye } from 'lucide-react'
import { cn } from '@/lib/utils'
import { formatDate } from '@/utils/helpers/date'
import type { CouponResponse } from '../types/coupon.types'
import { useActivateCoupon, useDeactivateCoupon } from '../hooks/useCoupons'

function StatusBadge({ active }: { active: boolean }) {
  return (
    <span
      className={cn(
        'inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium',
        active
          ? 'bg-green-100 text-green-700 dark:bg-green-400/10 dark:text-green-400'
          : 'bg-gray-100 text-gray-500 dark:bg-gray-400/10 dark:text-gray-400',
      )}
    >
      {active ? 'Active' : 'Inactive'}
    </span>
  )
}

function DiscountBadge({ type, value }: { type: string; value: number }) {
  const label = type === 'PERCENTAGE' ? `${value}% off` : `₹${value} off`
  return (
    <span className="inline-flex items-center rounded-full bg-blue-100 px-2 py-0.5 text-xs font-medium text-blue-700 dark:bg-blue-400/10 dark:text-blue-400">
      {label}
    </span>
  )
}

interface CouponTableProps {
  data: CouponResponse[]
  isLoading: boolean
  page: number
  totalPages: number
  totalElements: number
  pageSize: number
  onPageChange: (p: number) => void
  onRefresh: () => void
  onView: (coupon: CouponResponse) => void
}

const SKELETON_ROWS = 8

export function CouponTable({
  data,
  isLoading,
  page,
  totalPages,
  totalElements,
  pageSize,
  onPageChange,
  onRefresh,
  onView,
}: CouponTableProps) {
  const { mutate: activate } = useActivateCoupon()
  const { mutate: deactivate } = useDeactivateCoupon()

  const columns: ColumnDef<CouponResponse>[] = [
    {
      id: 'code',
      header: 'Code / Title',
      cell: ({ row }) => (
        <div className="min-w-0">
          <p className="font-mono text-sm font-semibold text-foreground">{row.original.code}</p>
          <p className="truncate text-xs text-muted-foreground">{row.original.title}</p>
        </div>
      ),
    },
    {
      id: 'discount',
      header: 'Discount',
      cell: ({ row }) => (
        <DiscountBadge type={row.original.discountType} value={row.original.discountValue} />
      ),
    },
    {
      id: 'vendor',
      header: 'Vendor',
      cell: ({ row }) => (
        <span className="font-mono text-sm text-muted-foreground">
          {row.original.vendorId ? `#${row.original.vendorId}` : 'All'}
        </span>
      ),
    },
    {
      id: 'validity',
      header: 'Validity',
      cell: ({ row }) => (
        <div className="text-xs text-muted-foreground">
          <p>{formatDate(row.original.validFrom)}</p>
          <p>→ {formatDate(row.original.validUntil)}</p>
        </div>
      ),
    },
    {
      id: 'usage',
      header: 'Used',
      cell: ({ row }) => (
        <span className="text-sm text-muted-foreground">
          {row.original.usedCount}
          {row.original.maxUses ? ` / ${row.original.maxUses}` : ''}
        </span>
      ),
    },
    {
      id: 'status',
      header: 'Status',
      cell: ({ row }) => <StatusBadge active={row.original.isActive} />,
    },
    {
      id: 'actions',
      header: '',
      cell: ({ row }) => {
        const c = row.original
        return (
          <div className="flex items-center justify-end gap-1">
            <button
              onClick={(e) => { e.stopPropagation(); onView(c) }}
              title="View details"
              className="flex h-7 w-7 items-center justify-center rounded-lg text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
            >
              <Eye className="h-3.5 w-3.5" />
            </button>
            <button
              onClick={(e) => {
                e.stopPropagation()
                c.isActive ? deactivate(c.id) : activate(c.id)
              }}
              title={c.isActive ? 'Deactivate' : 'Activate'}
              className={cn(
                'flex h-7 w-7 items-center justify-center rounded-lg transition-colors',
                c.isActive
                  ? 'text-amber-600 hover:bg-amber-50 dark:hover:bg-amber-400/10'
                  : 'text-green-600 hover:bg-green-50 dark:hover:bg-green-400/10',
              )}
            >
              {c.isActive ? (
                <ToggleRight className="h-3.5 w-3.5" />
              ) : (
                <ToggleLeft className="h-3.5 w-3.5" />
              )}
            </button>
          </div>
        )
      },
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
      {/* Table */}
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
            {isLoading
              ? Array.from({ length: SKELETON_ROWS }).map((_, i) => (
                  <tr key={i}>
                    {columns.map((_, ci) => (
                      <td key={ci} className="px-4 py-3">
                        <div className="h-4 animate-pulse rounded bg-muted" />
                      </td>
                    ))}
                  </tr>
                ))
              : data.length === 0
                ? (
                  <tr>
                    <td colSpan={columns.length} className="py-16 text-center">
                      <Tag className="mx-auto mb-2 h-8 w-8 text-muted-foreground/40" />
                      <p className="text-sm text-muted-foreground">No coupons found</p>
                    </td>
                  </tr>
                )
                : table.getRowModel().rows.map((row) => (
                  <tr
                    key={row.id}
                    onClick={() => onView(row.original)}
                    className="cursor-pointer transition-colors hover:bg-muted/30"
                  >
                    {row.getVisibleCells().map((cell) => (
                      <td key={cell.id} className="px-4 py-3">
                        {flexRender(cell.column.columnDef.cell, cell.getContext())}
                      </td>
                    ))}
                  </tr>
                ))}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      <div className="flex items-center justify-between border-t border-border px-4 py-3">
        <p className="text-xs text-muted-foreground">
          {totalElements === 0 ? 'No results' : `${start}–${end} of ${totalElements.toLocaleString()}`}
        </p>
        <div className="flex items-center gap-2">
          <button
            onClick={onRefresh}
            className="flex h-7 w-7 items-center justify-center rounded-lg text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
            title="Refresh"
          >
            <RefreshCw className="h-3.5 w-3.5" />
          </button>
          <button
            onClick={() => onPageChange(page - 1)}
            disabled={page === 0}
            className="flex h-7 w-7 items-center justify-center rounded-lg text-muted-foreground transition-colors hover:bg-muted hover:text-foreground disabled:opacity-40"
          >
            <ChevronLeft className="h-4 w-4" />
          </button>
          <span className="text-xs text-muted-foreground">
            {page + 1} / {Math.max(1, totalPages)}
          </span>
          <button
            onClick={() => onPageChange(page + 1)}
            disabled={page >= totalPages - 1}
            className="flex h-7 w-7 items-center justify-center rounded-lg text-muted-foreground transition-colors hover:bg-muted hover:text-foreground disabled:opacity-40"
          >
            <ChevronRight className="h-4 w-4" />
          </button>
        </div>
      </div>
    </div>
  )
}
