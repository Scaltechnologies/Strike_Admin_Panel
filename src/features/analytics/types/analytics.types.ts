export interface AnalyticsOverview {
  totalUsers?: number
  totalVendors?: number
  totalRevenue?: number
  totalOrders?: number
  activeSubscriptions?: number
  pendingWithdrawals?: number
  [key: string]: unknown
}

export interface RevenueData {
  period?: string
  revenue?: number
  commissions?: number
  [key: string]: unknown
}

export interface VendorPerformance {
  vendorId?: number
  vendorName?: string
  totalRevenue?: number
  totalOrders?: number
  commissionEarned?: number
  [key: string]: unknown
}

export interface CommissionAnalytics {
  totalCommissions?: number
  settledCommissions?: number
  pendingCommissions?: number
  totalAmount?: number
  [key: string]: unknown
}
