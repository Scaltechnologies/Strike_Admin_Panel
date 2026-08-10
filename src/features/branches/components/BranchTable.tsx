import { useMemo } from 'react'
import {
  useReactTable,
  getCoreRowModel,
  flexRender,
  type ColumnDef,
} from '@tanstack/react-table'
import { MapPin, RefreshCw, GitBranch } from 'lucide-react'
import { cn } from '@/lib/utils'
import type { Branch } from '../types/branch.types'

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  })
}

function locationString(b: Branch): string {
  return [b.city, b.state, b.country].filter(Boolean).join(', ') || '—'
}

interface BranchTableProps {
  data: Branch[]
  isLoading: boolean
  page: number
  totalPages: number
  totalElements: number
  pageSize: number
  onPageChange: (page: number) => void
  onRefresh: () => void
  onViewBranch: (branch: Branch) => void
}

const SKELETON_ROWS = 8

export function BranchTable({
  data,
  isLoading,
  page,
  totalPages,
  totalElements,
  pageSize,
  onPageChange,
  onRefresh,
  onViewBranch,
}: BranchTableProps) {
  const columns = useMemo<ColumnDef<Branch>[]>(
    () => [
      {
        id: 'branch',
        header: 'Branch',
        cell: ({ row }) => {
          const b = row.original
          return (
            <div>
              <p className="font-medium text-foreground">{b.name}</p>
              <p className="font-mono text-xs text-muted-foreground">#{b.id}</p>
            </div>
          )
        },
      },
      {
        id: 'location',
        header: 'Location',
        cell: ({ row }) => {
          const loc = locationString(row.original)
          return (
            <div className="flex items-center gap-1.5 text-sm text-foreground">
              <MapPin className="h-3 w-3 shrink-0 text-muted-foreground" aria-hidden />
              {loc}
            </div>
          )
        },
      },
      {
        id: 'radius',
        header: 'Radius',
        cell: ({ row }) => (
          <span className="font-mono text-sm text-foreground">
            {row.original.radiusKm} km
          </span>
        ),
      },
      {
        id: 'status',
        header: 'Status',
        cell: ({ row }) => {
          const isActive = row.original.isActive
          return (
            <span
              className={cn(
                'inline-flex items-center gap-1.5 rounded-full px-2 py-0.5 text-xs font-medium',
                isActive
                  ? 'bg-green-100 text-green-700 dark:bg-green-400/10 dark:text-green-400'
                  : 'bg-gray-100 text-gray-500 dark:bg-gray-400/10 dark:text-gray-400',
              )}
            >
              <span
                className={cn(
                  'h-1.5 w-1.5 rounded-full',
                  isActive ? 'bg-green-500' : 'bg-gray-400',
                )}
              />
              {isActive ? 'Active' : 'Inactive'}
            </span>
          )
        },
      },
      {
        id: 'contact',
        header: 'Contact',
        cell: ({ row }) => {
          const b = row.original
          if (!b.contactEmail && !b.contactPhone) {
            return <span className="text-sm text-muted-foreground">—</span>
          }
          return (
            <div className="text-sm">
              {b.contactEmail && (
                <p className="max-w-[180px] truncate text-foreground">{b.contactEmail}</p>
              )}
              {b.contactPhone && (
                <p className="font-mono text-xs text-muted-foreground">{b.contactPhone}</p>
              )}
            </div>
          )
        },
      },
      {
        id: 'created',
        header: 'Created',
        cell: ({ row }) => (
          <span className="text-sm text-muted-foreground">
            {formatDate(row.original.createdAt)}
          </span>
        ),
      },
      {
        id: 'actions',
        header: '',
        cell: ({ row }) => (
          <button
            onClick={(e) => {
              e.stopPropagation()
              onViewBranch(row.original)
            }}
            className="rounded-lg px-3 py-1.5 text-xs font-medium text-primary transition-colors hover:bg-primary/5"
          >
            View
          </button>
        ),
      },
    ],
    [onViewBranch],
  )

  const table = useReactTable({
    data,
    columns,
    getCoreRowModel: getCoreRowModel(),
    manualPagination: true,
    pageCount: totalPages,
  })

  const from = totalElements === 0 ? 0 : page * pageSize + 1
  const to = Math.min((page + 1) * pageSize, totalElements)

  return (
    <div className="flex flex-col">
      {/* Toolbar */}
      <div className="flex items-center justify-between border-b border-border px-4 py-3">
        <p className="text-xs text-muted-foreground">
          {isLoading ? 'Loading…' : `${from}–${to} of ${totalElements.toLocaleString()}`}
        </p>
        <button
          onClick={onRefresh}
          disabled={isLoading}
          title="Refresh"
          className="flex items-center gap-1.5 rounded-lg px-2 py-1.5 text-xs text-muted-foreground transition-colors hover:bg-muted hover:text-foreground disabled:opacity-50"
        >
          <RefreshCw className={cn('h-3.5 w-3.5', isLoading && 'animate-spin')} aria-hidden />
          Refresh
        </button>
      </div>

      {/* Table */}
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            {table.getHeaderGroups().map((hg) => (
              <tr key={hg.id} className="border-b border-border bg-muted/30">
                {hg.headers.map((header) => (
                  <th
                    key={header.id}
                    className="whitespace-nowrap px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-muted-foreground"
                  >
                    {flexRender(header.column.columnDef.header, header.getContext())}
                  </th>
                ))}
              </tr>
            ))}
          </thead>
          <tbody className="divide-y divide-border/60">
            {isLoading
              ? Array.from({ length: SKELETON_ROWS }).map((_, i) => (
                  <tr key={i}>
                    {columns.map((_, j) => (
                      <td key={j} className="px-4 py-3">
                        <div className="h-4 animate-pulse rounded bg-muted" />
                      </td>
                    ))}
                  </tr>
                ))
              : data.length === 0
                ? (
                  <tr>
                    <td colSpan={columns.length} className="py-16 text-center">
                      <div className="flex flex-col items-center gap-2">
                        <GitBranch className="h-8 w-8 text-muted-foreground/40" aria-hidden />
                        <p className="text-sm text-muted-foreground">No branches found.</p>
                      </div>
                    </td>
                  </tr>
                )
                : table.getRowModel().rows.map((row) => (
                  <tr
                    key={row.id}
                    onClick={() => onViewBranch(row.original)}
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
      {totalPages > 1 && (
        <div className="flex items-center justify-between border-t border-border px-4 py-3">
          <button
            onClick={() => onPageChange(page - 1)}
            disabled={page === 0 || isLoading}
            className="rounded-lg border border-border px-3 py-1.5 text-xs font-medium transition-colors hover:bg-muted disabled:cursor-not-allowed disabled:opacity-50"
          >
            Previous
          </button>
          <span className="text-xs text-muted-foreground">
            Page {page + 1} of {totalPages}
          </span>
          <button
            onClick={() => onPageChange(page + 1)}
            disabled={page >= totalPages - 1 || isLoading}
            className="rounded-lg border border-border px-3 py-1.5 text-xs font-medium transition-colors hover:bg-muted disabled:cursor-not-allowed disabled:opacity-50"
          >
            Next
          </button>
        </div>
      )}
    </div>
  )
}
