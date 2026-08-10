export type { ApiResponse, ApiError, ApiListResponse } from './api-response'
export type { PaginationParams, PaginationMeta, PaginatedData } from './pagination'

export interface SelectOption<T = string> {
  label: string
  value: T
  disabled?: boolean
  description?: string
}

export interface DateRange {
  from: Date | undefined
  to: Date | undefined
}

export interface BreadcrumbItem {
  label: string
  href?: string
}

export interface ActionItem {
  label: string
  onClick: () => void
  variant?: 'default' | 'destructive' | 'warning'
  disabled?: boolean
}

export type Status = 'active' | 'inactive' | 'pending' | 'blocked' | 'suspended'

export const STATUS_LABELS: Record<Status, string> = {
  active: 'Active',
  inactive: 'Inactive',
  pending: 'Pending',
  blocked: 'Blocked',
  suspended: 'Suspended',
}
