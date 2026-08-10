import type { ReactNode } from 'react'
import { cn } from '@/lib/utils'

interface DashboardWidgetProps {
  title: string
  description?: string
  action?: ReactNode
  children: ReactNode
  isLoading?: boolean
  isEmpty?: boolean
  emptyMessage?: string
  className?: string
}

export function DashboardWidget({
  title,
  description,
  action,
  children,
  isLoading = false,
  isEmpty = false,
  emptyMessage = 'No data available.',
  className,
}: DashboardWidgetProps) {
  return (
    <div className={cn('flex flex-col rounded-xl border border-border bg-card shadow-sm', className)}>
      <div className="flex items-center justify-between gap-4 border-b border-border px-5 py-4">
        <div className="min-w-0">
          <h3 className="text-sm font-semibold text-foreground">{title}</h3>
          {description && (
            <p className="mt-0.5 text-xs text-muted-foreground">{description}</p>
          )}
        </div>
        {action && <div className="shrink-0">{action}</div>}
      </div>

      <div className="flex-1 p-5">
        {isLoading ? (
          <div className="space-y-3">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="flex items-center gap-3">
                <div className="h-8 w-8 animate-pulse rounded-full bg-muted" />
                <div className="flex-1 space-y-1.5">
                  <div className="h-3 w-3/4 animate-pulse rounded bg-muted" />
                  <div className="h-3 w-1/2 animate-pulse rounded bg-muted" />
                </div>
                <div className="h-3 w-12 animate-pulse rounded bg-muted" />
              </div>
            ))}
          </div>
        ) : isEmpty ? (
          <div className="flex flex-col items-center justify-center py-8 text-center">
            <p className="text-sm text-muted-foreground">{emptyMessage}</p>
          </div>
        ) : (
          children
        )}
      </div>
    </div>
  )
}
