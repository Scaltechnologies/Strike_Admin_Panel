import axiosInstance from '@/api/axios'
import { ENDPOINTS } from '@/constants/api/endpoints'
import type { AnalyticsOverview, RevenueData, VendorPerformance, CommissionAnalytics } from '../types/analytics.types'

export const analyticsApi = {
  getOverview: (): Promise<AnalyticsOverview> =>
    axiosInstance.get(ENDPOINTS.ANALYTICS.OVERVIEW).then((r) => r.data as AnalyticsOverview),

  getRevenue: (): Promise<RevenueData[]> =>
    axiosInstance.get(ENDPOINTS.ANALYTICS.REVENUE).then((r) => r.data as RevenueData[]),

  getVendorPerformance: (): Promise<VendorPerformance[]> =>
    axiosInstance.get(ENDPOINTS.ANALYTICS.VENDOR_PERFORMANCE).then((r) => r.data as VendorPerformance[]),

  getCommissions: (): Promise<CommissionAnalytics> =>
    axiosInstance.get(ENDPOINTS.ANALYTICS.COMMISSIONS).then((r) => r.data as CommissionAnalytics),

  getPayments: (): Promise<Record<string, unknown>> =>
    axiosInstance.get(ENDPOINTS.ANALYTICS.PAYMENTS).then((r) => r.data as Record<string, unknown>),
}
