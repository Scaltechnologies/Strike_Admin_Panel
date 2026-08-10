import type { ReactNode } from 'react'
import { TrendingUp, TrendingDown, Minus } from 'lucide-react'
import { cn } from '@/lib/utils'

interface StatCardProps {
  title: string
  value: ReactNode
  icon: ReactNode
  trend?: {
    value: number
    label?: string
  }
  variant?: 'default' | 'warning' | 'success' | 'danger'
  isLoading?: boolean
  className?: string
}

const variantStyles = {
  default: 'bg-card border-border',
  warning: 'bg-amber-50/50 border-amber-200 dark:bg-amber-950/20 dark:border-amber-800',
  success: 'bg-green-50/50 border-green-200 dark:bg-green-950/20 dark:border-green-800',
  danger: 'bg-red-50/50 border-red-200 dark:bg-red-950/20 dark:border-red-800',
}

const iconBgStyles = {
  default: 'bg-primary/10 text-primary',
  warning: 'bg-amber-100 text-amber-600 dark:bg-amber-900/40 dark:text-amber-400',
  success: 'bg-green-100 text-green-600 dark:bg-green-900/40 dark:text-green-400',
  danger: 'bg-red-100 text-red-600 dark:bg-red-900/40 dark:text-red-400',
}

export function StatCard({
  title,
  value,
  icon,
  trend,
  variant = 'default',
  isLoading = false,
  className,
}: StatCardProps) {
  const trendPositive = trend && trend.value > 0
  const trendNeutral = trend && trend.value === 0

  return (
    <div
      className={cn(
        'rounded-xl border p-5 shadow-sm transition-shadow hover:shadow-md',
        variantStyles[variant],
        className,
      )}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          <p className="text-sm font-medium text-muted-foreground">{title}</p>
          {isLoading ? (
            <div className="mt-2 h-8 w-24 animate-pulse rounded-md bg-muted" />
          ) : (
            <p className="mt-1.5 text-2xl font-semibold tracking-tight text-foreground">
              {value}
            </p>
          )}
          {trend && !isLoading && (
            <div className="mt-2 flex items-center gap-1 text-xs">
              {trendNeutral ? (
                <Minus className="h-3 w-3 text-muted-foreground" />
              ) : trendPositive ? (
                <TrendingUp className="h-3 w-3 text-green-500" />
              ) : (
                <TrendingDown className="h-3 w-3 text-red-500" />
              )}
              <span
                className={cn(
                  'font-medium',
                  trendNeutral
                    ? 'text-muted-foreground'
                    : trendPositive
                      ? 'text-green-600 dark:text-green-400'
                      : 'text-red-600 dark:text-red-400',
                )}
              >
                {trendPositive ? '+' : ''}{trend.value}%
              </span>
              {trend.label && (
                <span className="text-muted-foreground">{trend.label}</span>
              )}
            </div>
          )}
          {isLoading && trend !== undefined && (
            <div className="mt-2 h-4 w-16 animate-pulse rounded bg-muted" />
          )}
        </div>
        <div className={cn('flex h-10 w-10 shrink-0 items-center justify-center rounded-lg', iconBgStyles[variant])}>
          {icon}
        </div>
      </div>
    </div>
  )
}
