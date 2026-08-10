import { Link } from '@tanstack/react-router'
import { ArrowRight } from 'lucide-react'
import { DashboardWidget } from '@/components/dashboard/DashboardWidget'
import { StatusBadge } from '@/components/common/StatusBadge'
import { formatRelative } from '@/utils/helpers/date'
import type { DashboardData } from '../types/dashboard.types'

interface RecentVendorsWidgetProps {
  data?: DashboardData
  isLoading: boolean
}

export function RecentVendorsWidget({ data, isLoading }: RecentVendorsWidgetProps) {
  const vendors = data?.recentVendorRegistrations ?? []

  return (
    <DashboardWidget
      title="Recent Registrations"
      description="Latest vendor sign-ups"
      action={
        <Link
          to="/vendors"
          className="flex items-center gap-1 text-xs font-medium text-primary hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring rounded"
        >
          View all <ArrowRight className="h-3 w-3" aria-hidden />
        </Link>
      }
      isLoading={isLoading}
      isEmpty={!isLoading && vendors.length === 0}
      emptyMessage="No vendor registrations yet."
    >
      <ul className="divide-y divide-border" role="list">
        {vendors.map((vendor) => (
          <li key={vendor.vendorId} className="flex items-center gap-3 py-2.5 first:pt-0 last:pb-0">
            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary/10 text-xs font-semibold text-primary">
              {vendor.hotelName?.slice(0, 2).toUpperCase() ?? '??'}
            </div>
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-medium text-foreground">{vendor.hotelName}</p>
              <p className="text-xs text-muted-foreground">
                {vendor.registeredAt ? formatRelative(vendor.registeredAt) : '—'}
              </p>
            </div>
            <StatusBadge status={vendor.status?.toLowerCase() ?? 'default'} size="sm" />
          </li>
        ))}
      </ul>
    </DashboardWidget>
  )
}
