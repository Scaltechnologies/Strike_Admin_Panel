import type { ReactNode } from 'react'
import { cn } from '@/lib/utils'

interface ChartCardProps {
  title: string
  description?: string
  action?: ReactNode
  children: ReactNode
  isLoading?: boolean
  isEmpty?: boolean
  emptyMessage?: string
  className?: string
  contentClassName?: string
}

export function ChartCard({
  title,
  description,
  action,
  children,
  isLoading = false,
  isEmpty = false,
  emptyMessage = 'No chart data available yet.',
  className,
  contentClassName,
}: ChartCardProps) {
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

      <div className={cn('flex-1 p-5', contentClassName)}>
        {isLoading ? (
          <div className="flex h-48 flex-col justify-end gap-2">
            <div className="flex items-end gap-3 h-36">
              {[55, 80, 45, 90, 65, 75, 50].map((h, i) => (
                <div
                  key={i}
                  className="flex-1 animate-pulse rounded-t bg-muted"
                  style={{ height: `${h}%` }}
                />
              ))}
            </div>
            <div className="flex gap-3">
              {Array.from({ length: 7 }).map((_, i) => (
                <div key={i} className="flex-1 h-3 animate-pulse rounded bg-muted" />
              ))}
            </div>
          </div>
        ) : isEmpty ? (
          <div className="flex h-48 flex-col items-center justify-center text-center">
            <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-muted">
              <svg className="h-6 w-6 text-muted-foreground" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
              </svg>
            </div>
            <p className="text-sm text-muted-foreground">{emptyMessage}</p>
          </div>
        ) : (
          children
        )}
      </div>
    </div>
  )
}
