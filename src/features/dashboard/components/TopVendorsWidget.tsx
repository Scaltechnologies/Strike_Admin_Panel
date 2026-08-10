import { DashboardWidget } from '@/components/dashboard/DashboardWidget'
import { StatusBadge } from '@/components/common/StatusBadge'
import { formatDate } from '@/utils/helpers/date'
import type { DashboardData } from '../types/dashboard.types'

interface TopVendorsWidgetProps {
  data?: DashboardData
  isLoading: boolean
}

export function TopVendorsWidget({ data, isLoading }: TopVendorsWidgetProps) {
  const vendors = data?.recentVendorRegistrations ?? []

  return (
    <DashboardWidget
      title="Recent Vendors"
      description="Latest vendor registrations"
      isLoading={isLoading}
      isEmpty={!isLoading && vendors.length === 0}
      emptyMessage="No recent vendor registrations."
    >
      <ul className="space-y-3" role="list">
        {vendors.map((vendor) => (
          <li
            key={vendor.vendorId}
            className="flex items-center justify-between gap-3 rounded-lg border border-border/60 px-3 py-2.5"
          >
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-medium text-foreground">
                {vendor.hotelName}
              </p>
              <p className="mt-0.5 text-xs text-muted-foreground">
                {formatDate(vendor.registeredAt)}
              </p>
            </div>
            <StatusBadge status={vendor.status.toLowerCase()} label={vendor.status} size="sm" />
          </li>
        ))}
      </ul>
    </DashboardWidget>
  )
}
