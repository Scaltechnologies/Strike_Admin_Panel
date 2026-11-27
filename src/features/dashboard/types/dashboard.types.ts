export interface DashboardAdmin {
  email: string
  role: string
}

export interface DashboardVendorStats {
  total: number
  pending: number
  active: number
  suspended: number
  rejected: number
}

export interface DashboardStoreStats {
  total?: number
  active?: number
  inactive?: number
  temporarilyClosed?: number
  suspended?: number
  error?: string
}

export interface DashboardStats {
  totalUsers: number
  totalSubscriptions: number
  totalSubscriptionRevenue: number
  totalCommissionEarned: number
  pendingCommission: number
  todayPayments?: number
  totalRedemptions: number
  totalRedemptionAmount?: number
  vendors: DashboardVendorStats
  stores?: DashboardStoreStats
}

export interface DashboardRevenue {
  today: number
  monthly: number
  total: number
  commissionPending: number
  commissionSettled: number
}

export interface DashboardPendingActions {
  pendingVendors: number
  pendingWithdrawals: number
}

export interface DashboardTopVendor {
  vendorId: number
  hotelName: string
  revenue: number
  count: number
}

export interface DashboardPendingApproval {
  vendorId: number
  hotelName: string
  mobile?: string
  email?: string
  registeredAt: string
}

export interface DashboardRecentVendor {
  vendorId: number
  hotelName: string
  status: string
  registeredAt: string
}

export interface DashboardData {
  admin: DashboardAdmin
  revenue?: DashboardRevenue
  stats: DashboardStats
  pendingActions?: DashboardPendingActions
  topVendors?: DashboardTopVendor[]
  pendingApprovals: DashboardPendingApproval[]
  recentVendorRegistrations: DashboardRecentVendor[]
}

export interface AnalyticsMonthlyRevenue {
  /** "YYYY-MM" */
  month: string
  subscriptionRevenue: number
  commission: number
}

export interface AnalyticsRevenueData {
  monthly: AnalyticsMonthlyRevenue[]
  totalRevenue: number
  paymentRevenue: number
  totalCommission: number
}

export interface AnalyticsPaymentData {
  totalPayments: number
  completedPayments: number
  failedPayments: number
  refundedPayments: number
  totalRevenue: number
  totalDiscounts: number
}
