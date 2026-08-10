import { Clock, ArrowDownCircle, ArrowRight } from 'lucide-react'
import { Link } from '@tanstack/react-router'
import { DashboardWidget } from '@/components/dashboard/DashboardWidget'
import type { DashboardData } from '../types/dashboard.types'
import { cn } from '@/lib/utils'

interface PendingActionsWidgetProps {
  data?: DashboardData
  isLoading: boolean
}

export function PendingActionsWidget({
  data,
  isLoading,
}: PendingActionsWidgetProps) {
  const pendingVendorCount = data?.stats?.vendors?.pending ?? 0

  // Backend currently returns pendingApprovals only
  const pendingApprovalCount = data?.pendingApprovals?.length ?? 0

  const actions = [
    {
      label: 'Pending Vendor Approvals',
      count: pendingVendorCount,
      icon: Clock,
      href: '/vendors',
      urgency:
        pendingVendorCount > 5
          ? 'high'
          : pendingVendorCount > 0
          ? 'medium'
          : 'none',
    },
    {
      label: 'Approval Queue',
      count: pendingApprovalCount,
      icon: ArrowDownCircle,
      href: '/vendors',
      urgency:
        pendingApprovalCount > 10
          ? 'high'
          : pendingApprovalCount > 0
          ? 'medium'
          : 'none',
    },
  ]

  const hasActions = actions.some((a) => a.count > 0)

  return (
    <DashboardWidget
      title="Pending Actions"
      description="Items requiring your attention"
      isLoading={isLoading}
      isEmpty={!isLoading && !hasActions}
      emptyMessage="No pending actions. Everything is up to date!"
    >
      <ul className="space-y-2">
        {actions.map((action) => {
          const Icon = action.icon

          return (
            <li key={action.label}>
              <Link
                to={action.href}
                className={cn(
                  'flex items-center gap-3 rounded-lg border p-3 transition-colors',
                  'hover:bg-accent',
                  action.urgency === 'high'
                    ? 'border-red-200 bg-red-50 dark:border-red-800 dark:bg-red-950/20'
                    : action.urgency === 'medium'
                    ? 'border-amber-200 bg-amber-50 dark:border-amber-800 dark:bg-amber-950/20'
                    : 'border-border'
                )}
              >
                <div
                  className={cn(
                    'flex h-8 w-8 items-center justify-center rounded-full',
                    action.urgency === 'high'
                      ? 'bg-red-100 text-red-600'
                      : action.urgency === 'medium'
                      ? 'bg-amber-100 text-amber-600'
                      : 'bg-muted text-muted-foreground'
                  )}
                >
                  <Icon className="h-4 w-4" />
                </div>

                <div className="flex-1">
                  <p className="text-sm font-medium">{action.label}</p>
                </div>

                <div className="flex items-center gap-2">
                  <span
                    className={cn(
                      'rounded-full px-2 py-1 text-xs font-semibold',
                      action.urgency === 'high'
                        ? 'bg-red-100 text-red-700'
                        : action.urgency === 'medium'
                        ? 'bg-amber-100 text-amber-700'
                        : 'bg-muted text-muted-foreground'
                    )}
                  >
                    {action.count}
                  </span>

                  <ArrowRight className="h-4 w-4 text-muted-foreground" />
                </div>
              </Link>
            </li>
          )
        })}
      </ul>
    </DashboardWidget>
  )
}