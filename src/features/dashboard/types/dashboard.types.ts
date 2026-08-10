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

export interface DashboardStats {
  totalUsers: number
  totalSubscriptions: number
  totalSubscriptionRevenue: number
  totalCommissionEarned: number
  pendingCommission: number
  totalRedemptions: number
  vendors: DashboardVendorStats
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

  stats: DashboardStats

  pendingApprovals: DashboardPendingApproval[]

  recentVendorRegistrations: DashboardRecentVendor[]
}

export interface AnalyticsMonthlyRevenue {
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