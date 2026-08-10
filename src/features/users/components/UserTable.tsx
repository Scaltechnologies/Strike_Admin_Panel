import { useMemo } from 'react'
import {
  useReactTable,
  getCoreRowModel,
  flexRender,
  type ColumnDef,
} from '@tanstack/react-table'
import { ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight } from 'lucide-react'
import { StatusBadge } from '@/components/common/StatusBadge'
import { formatDate, formatRelative } from '@/utils/helpers/date'
import { cn } from '@/lib/utils'
import type { UserAuth, UserPageResponse } from '../types/user.types'

interface UserTableProps {
  data: UserPageResponse | undefined
  page: number
  onPageChange: (page: number) => void
  onRowClick: (user: UserAuth) => void
  isFetching: boolean
}

export function UserTable({
  data,
  page,
  onPageChange,
  onRowClick,
  isFetching,
}: UserTableProps) {
  const columns = useMemo<ColumnDef<UserAuth>[]>(
    () => [
      {
        accessorKey: 'id',
        header: 'ID',
        size: 64,
        cell: ({ row }) => (
          <span className="font-mono text-xs text-muted-foreground">#{row.original.id}</span>
        ),
      },
      {
        accessorKey: 'mobileNumber',
        header: 'Mobile',
        cell: ({ row }) => (
          <span className="font-mono text-sm font-medium text-foreground">
            {row.original.mobileNumber}
          </span>
        ),
      },
      {
        id: 'verified',
        header: 'Verified',
        cell: ({ row }) => (
          <StatusBadge
            status={row.original.verified ? 'verified' : 'pending'}
            label={row.original.verified ? 'Verified' : 'Unverified'}
            dot
          />
        ),
      },
      {
        id: 'status',
        header: 'Status',
        cell: ({ row }) => (
          <StatusBadge
            status={row.original.banned ? 'error' : 'active'}
            label={row.original.banned ? 'Banned' : 'Active'}
            dot
          />
        ),
      },
      {
        accessorKey: 'createdAt',
        header: 'Joined',
        cell: ({ row }) => (
          <span className="text-sm text-muted-foreground">
            {formatDate(row.original.createdAt)}
          </span>
        ),
      },
      {
        accessorKey: 'updatedAt',
        header: 'Last Active',
        cell: ({ row }) => (
          <span className="text-sm text-muted-foreground" title={formatDate(row.original.updatedAt)}>
            {formatRelative(row.original.updatedAt)}
          </span>
        ),
      },
    ],
    [],
  )

  const table = useReactTable({
    data: data?.content ?? [],
    columns,
    getCoreRowModel: getCoreRowModel(),
    manualPagination: true,
    pageCount: data?.totalPages ?? -1,
  })

  const totalPages = data?.totalPages ?? 0
  const totalElements = data?.totalElements ?? 0
  const currentStart = totalElements === 0 ? 0 : page * (data?.size ?? 20) + 1
  const currentEnd = Math.min((page + 1) * (data?.size ?? 20), totalElements)

  return (
    <div className="flex flex-col gap-4">
      {/* Table */}
      <div
        className={cn(
          'overflow-x-auto rounded-xl border border-border bg-card shadow-sm transition-opacity',
          isFetching && 'opacity-70',
        )}
      >
        <table className="w-full min-w-[640px] text-sm">
          <thead>
            <tr className="border-b border-border bg-muted/40">
              {table.getHeaderGroups().map((hg) =>
                hg.headers.map((header) => (
                  <th
                    key={header.id}
                    className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-muted-foreground"
                  >
                    {flexRender(header.column.columnDef.header, header.getContext())}
                  </th>
                )),
              )}
            </tr>
          </thead>
          <tbody>
            {table.getRowModel().rows.length === 0 ? (
              <tr>
                <td colSpan={columns.length} className="py-12 text-center text-sm text-muted-foreground">
                  No users found.
                </td>
              </tr>
            ) : (
              table.getRowModel().rows.map((row) => (
                <tr
                  key={row.id}
                  onClick={() => onRowClick(row.original)}
                  className="cursor-pointer border-b border-border/60 transition-colors last:border-b-0 hover:bg-muted/40 focus-within:bg-muted/40"
                  tabIndex={0}
                  role="button"
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                      e.preventDefault()
                      onRowClick(row.original)
                    }
                  }}
                  aria-label={`View user ${row.original.mobileNumber}`}
                >
                  {row.getVisibleCells().map((cell) => (
                    <td key={cell.id} className="px-4 py-3.5">
                      {flexRender(cell.column.columnDef.cell, cell.getContext())}
                    </td>
                  ))}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      {totalElements > 0 && (
        <div className="flex flex-col items-center justify-between gap-3 sm:flex-row">
          <p className="text-xs text-muted-foreground">
            Showing {currentStart}–{currentEnd} of {totalElements.toLocaleString()} users
          </p>

          <div className="flex items-center gap-1">
            <PaginationButton
              onClick={() => onPageChange(0)}
              disabled={page === 0}
              aria-label="First page"
            >
              <ChevronsLeft className="h-4 w-4" />
            </PaginationButton>
            <PaginationButton
              onClick={() => onPageChange(page - 1)}
              disabled={page === 0}
              aria-label="Previous page"
            >
              <ChevronLeft className="h-4 w-4" />
            </PaginationButton>

            <span className="min-w-[80px] text-center text-xs text-muted-foreground">
              Page {page + 1} of {totalPages}
            </span>

            <PaginationButton
              onClick={() => onPageChange(page + 1)}
              disabled={page >= totalPages - 1}
              aria-label="Next page"
            >
              <ChevronRight className="h-4 w-4" />
            </PaginationButton>
            <PaginationButton
              onClick={() => onPageChange(totalPages - 1)}
              disabled={page >= totalPages - 1}
              aria-label="Last page"
            >
              <ChevronsRight className="h-4 w-4" />
            </PaginationButton>
          </div>
        </div>
      )}
    </div>
  )
}

interface PaginationButtonProps {
  onClick: () => void
  disabled: boolean
  children: React.ReactNode
  'aria-label': string
}

function PaginationButton({ onClick, disabled, children, 'aria-label': ariaLabel }: PaginationButtonProps) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      aria-label={ariaLabel}
      className={cn(
        'flex h-8 w-8 items-center justify-center rounded-lg border border-border text-muted-foreground',
        'transition-colors hover:bg-muted hover:text-foreground',
        'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring',
        'disabled:cursor-not-allowed disabled:opacity-40',
      )}
    >
      {children}
    </button>
  )
}
