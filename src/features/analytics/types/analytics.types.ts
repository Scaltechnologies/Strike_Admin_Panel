// Shapes mirror admin-service AdminAnalyticsController responses exactly.

export interface AnalyticsOverview {
  totalUsers?: number
  totalVendors?: number
  totalRevenue?: number
  totalSubscriptionRevenue?: number
  totalCommissionEarned?: number
  pendingCommission?: number
  totalOrders?: number
  totalRedemptions?: number
  activeSubscriptions?: number
  totalSubscriptions?: number
  pendingWithdrawals?: number
  [key: string]: unknown
}

export interface RevenueMonth {
  month: string
  subscriptionRevenue: number
  commission: number
}

export interface RevenueData {
  monthly: RevenueMonth[]
  totalRevenue: number
  paymentRevenue: number
  totalCommission: number
}

export interface VendorPerformance {
  vendorId: number
  hotelName?: string
  commissionRate?: number
  totalSubscriptionRevenue?: number
  totalCommission?: number
  subscriptionCount?: number
}

export interface CommissionAnalytics {
  totalCommission?: number
  totalPending?: number
  totalSettled?: number
  pendingCount?: number
  settledCount?: number
  [key: string]: unknown
}
