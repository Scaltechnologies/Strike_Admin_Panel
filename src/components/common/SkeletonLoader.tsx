import { cn } from '@/lib/utils'

interface SkeletonLoaderProps {
  className?: string
}

export function SkeletonLoader({ className }: SkeletonLoaderProps) {
  return (
    <div
      aria-hidden
      className={cn('animate-pulse rounded-md bg-muted', className)}
    />
  )
}

interface SkeletonCardProps {
  rows?: number
  className?: string
}

export function SkeletonCard({ rows = 3, className }: SkeletonCardProps) {
  return (
    <div className={cn('rounded-xl border border-border bg-card p-6', className)}>
      <SkeletonLoader className="mb-4 h-5 w-1/3" />
      <div className="space-y-3">
        {Array.from({ length: rows }, (_, i) => (
          <SkeletonLoader key={i} className="h-4 w-full" />
        ))}
      </div>
    </div>
  )
}

interface SkeletonTableProps {
  rows?: number
  cols?: number
}

export function SkeletonTable({ rows = 5, cols = 4 }: SkeletonTableProps) {
  return (
    <div className="overflow-hidden rounded-xl border border-border">
      <div className="border-b border-border bg-muted/50 px-4 py-3">
        <div className="flex gap-4">
          {Array.from({ length: cols }, (_, i) => (
            <SkeletonLoader key={i} className="h-4 flex-1" />
          ))}
        </div>
      </div>
      <div className="divide-y divide-border bg-card">
        {Array.from({ length: rows }, (_, i) => (
          <div key={i} className="flex gap-4 px-4 py-4">
            {Array.from({ length: cols }, (_, j) => (
              <SkeletonLoader key={j} className="h-4 flex-1" />
            ))}
          </div>
        ))}
      </div>
    </div>
  )
}
