import { useState } from 'react'
import { ChevronDown, ChevronRight } from 'lucide-react'
import { StatusBadge } from '@/components/common/StatusBadge'
import { cn } from '@/lib/utils'
import type { CategoryWithItemsResponse } from '../types/vendor.types'

interface VendorMenuTableProps {
  data: { data: CategoryWithItemsResponse[] } | undefined
  isLoading: boolean
}

function formatCurrency(value: number) {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 2,
  }).format(value)
}

function availabilityVariant(status: string) {
  switch (status?.toUpperCase()) {
    case 'AVAILABLE': return 'active'
    case 'UNAVAILABLE': return 'inactive'
    case 'OUT_OF_STOCK': return 'warning'
    default: return 'default'
  }
}

export function VendorMenuTable({ data, isLoading }: VendorMenuTableProps) {
  const categories = data?.data ?? []
  const [expanded, setExpanded] = useState<Set<number>>(new Set([0]))

  function toggle(idx: number) {
    setExpanded((prev) => {
      const next = new Set(prev)
      if (next.has(idx)) next.delete(idx)
      else next.add(idx)
      return next
    })
  }

  if (isLoading) {
    return (
      <div className="space-y-2">
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className="h-12 animate-pulse rounded-xl bg-muted" />
        ))}
      </div>
    )
  }

  if (categories.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-center">
        <p className="text-sm text-muted-foreground">No menu data available.</p>
      </div>
    )
  }

  return (
    <div className="space-y-2">
      {categories.map((cat, idx) => (
        <div key={cat.id} className="rounded-xl border border-border overflow-hidden">
          {/* Category header */}
          <button
            onClick={() => toggle(idx)}
            className={cn(
              'flex w-full items-center justify-between px-4 py-3 text-left',
              'bg-muted/40 transition-colors hover:bg-muted/60',
              'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-ring',
            )}
            aria-expanded={expanded.has(idx)}
          >
            <div className="flex items-center gap-3">
              {expanded.has(idx) ? (
                <ChevronDown className="h-4 w-4 text-muted-foreground" aria-hidden />
              ) : (
                <ChevronRight className="h-4 w-4 text-muted-foreground" aria-hidden />
              )}
              <div>
                <span className="text-sm font-semibold text-foreground">{cat.name}</span>
                {cat.description && (
                  <span className="ml-2 text-xs text-muted-foreground">{cat.description}</span>
                )}
              </div>
            </div>
            <span className="text-xs text-muted-foreground">{cat.items.length} items</span>
          </button>

          {/* Items */}
          {expanded.has(idx) && cat.items.length > 0 && (
            <div className="divide-y divide-border/60">
              {cat.items.map((item) => (
                <div
                  key={item.id}
                  className="flex items-center justify-between gap-4 px-4 py-2.5"
                >
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium text-foreground">{item.name}</p>
                    {item.description && (
                      <p className="mt-0.5 truncate text-xs text-muted-foreground">{item.description}</p>
                    )}
                    <div className="mt-1 flex items-center gap-2">
                      <span className="text-xs text-muted-foreground">{item.itemType}</span>
                    </div>
                  </div>
                  <div className="flex shrink-0 items-center gap-3">
                    <span className="text-sm font-semibold text-foreground">
                      {formatCurrency(item.price)}
                    </span>
                    <StatusBadge
                      status={availabilityVariant(item.availabilityStatus)}
                      label={item.availabilityStatus?.toLowerCase().replace('_', ' ') ?? 'unknown'}
                      size="sm"
                    />
                  </div>
                </div>
              ))}
            </div>
          )}

          {expanded.has(idx) && cat.items.length === 0 && (
            <p className="px-4 py-3 text-sm text-muted-foreground">No items in this category.</p>
          )}
        </div>
      ))}
    </div>
  )
}
