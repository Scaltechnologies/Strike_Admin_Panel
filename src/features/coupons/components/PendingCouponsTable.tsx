import { useState } from 'react'
import {
  useReactTable,
  getCoreRowModel,
  flexRender,
  type ColumnDef,
} from '@tanstack/react-table'
import { ChevronLeft, ChevronRight, RefreshCw, Clock, Check, X } from 'lucide-react'
import { formatDate } from '@/utils/helpers/date'
import { ConfirmationDialog } from '@/components/common/ConfirmationDialog'
import type { CouponResponse } from '../types/coupon.types'
import { useApproveCoupon, useRejectCoupon } from '../hooks/useCoupons'

function DiscountBadge({ type, value }: { type: string; value: number }) {
  const label = type === 'PERCENTAGE' ? `${value}% off` : `₹${value} off`
  return (
    <span className="inline-flex items-center rounded-full bg-blue-100 px-2 py-0.5 text-xs font-medium text-blue-700 dark:bg-blue-400/10 dark:text-blue-400">
      {label}
    </span>
  )
}

interface PendingCouponsTableProps {
  data: CouponResponse[]
  isLoading: boolean
  page: number
  totalPages: number
  totalElements: number
  pageSize: number
  onPageChange: (p: number) => void
  onRefresh: () => void
}

const SKELETON_ROWS = 6

export function PendingCouponsTable({
  data,
  isLoading,
  page,
  totalPages,
  totalElements,
  pageSize,
  onPageChange,
  onRefresh,
}: PendingCouponsTableProps) {
  const { mutate: approve, isPending: approving } = useApproveCoupon()
  const { mutate: reject, isPending: rejecting } = useRejectCoupon()
  const [rejectTarget, setRejectTarget] = useState<CouponResponse | null>(null)
  const [reason, setReason] = useState('')

  function openReject(c: CouponResponse) {
    setRejectTarget(c)
    setReason('')
  }

  function confirmReject() {
    if (!rejectTarget || !reason.trim()) return
    reject(
      { id: rejectTarget.id, reason: reason.trim() },
      { onSuccess: () => setRejectTarget(null) },
    )
  }

  const columns: ColumnDef<CouponResponse>[] = [
    {
      id: 'title',
      header: 'Requested Coupon',
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
          {row.original.vendorId ? `#${row.original.vendorId}` : '—'}
        </span>
      ),
    },
    {
      id: 'validity',
      header: 'Requested Validity',
      cell: ({ row }) => (
        <div className="text-xs text-muted-foreground">
          <p>{formatDate(row.original.validFrom)}</p>
          <p>→ {formatDate(row.original.validUntil)}</p>
        </div>
      ),
    },
    {
      id: 'requestedAt',
      header: 'Requested',
      cell: ({ row }) => (
        <span className="text-xs text-muted-foreground">{formatDate(row.original.createdAt)}</span>
      ),
    },
    {
      id: 'actions',
      header: '',
      cell: ({ row }) => {
        const c = row.original
        return (
          <div className="flex items-center justify-end gap-2">
            <button
              onClick={() => approve(c.id)}
              disabled={approving || rejecting}
              className="flex items-center gap-1 rounded-lg bg-green-50 px-2.5 py-1.5 text-xs font-medium text-green-700 transition-colors hover:bg-green-100 disabled:opacity-60 dark:bg-green-400/10 dark:text-green-400 dark:hover:bg-green-400/20"
            >
              <Check className="h-3.5 w-3.5" />
              Approve
            </button>
            <button
              onClick={() => openReject(c)}
              disabled={approving || rejecting}
              className="flex items-center gap-1 rounded-lg bg-red-50 px-2.5 py-1.5 text-xs font-medium text-red-700 transition-colors hover:bg-red-100 disabled:opacity-60 dark:bg-red-400/10 dark:text-red-400 dark:hover:bg-red-400/20"
            >
              <X className="h-3.5 w-3.5" />
              Reject
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
                      <Clock className="mx-auto mb-2 h-8 w-8 text-muted-foreground/40" />
                      <p className="text-sm text-muted-foreground">No pending coupon requests</p>
                    </td>
                  </tr>
                )
                : table.getRowModel().rows.map((row) => (
                  <tr key={row.id} className="transition-colors hover:bg-muted/30">
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

      <ConfirmationDialog
        open={rejectTarget !== null}
        title="Reject coupon request"
        description={rejectTarget ? `Reject "${rejectTarget.title}" (${rejectTarget.code}) requested by vendor #${rejectTarget.vendorId ?? '—'}? The vendor will be notified with your reason.` : ''}
        onConfirm={confirmReject}
        onCancel={() => setRejectTarget(null)}
        confirmLabel="Reject"
        variant="destructive"
        isLoading={rejecting}
      >
        <textarea
          value={reason}
          onChange={(e) => setReason(e.target.value)}
          placeholder="Reason for rejection (shown to the vendor)…"
          rows={3}
          className="block w-full rounded-lg border border-border bg-background px-3 py-2 text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
        />
      </ConfirmationDialog>
    </div>
  )
}
