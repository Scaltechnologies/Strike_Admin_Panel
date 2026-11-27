import axiosInstance from '@/api/axios'
import { ENDPOINTS } from '@/constants/api/endpoints'
import type { AnalyticsPaymentData, AnalyticsRevenueData, DashboardData } from '../types/dashboard.types'

export const dashboardApi = {
  getDashboard(): Promise<DashboardData> {
    return axiosInstance.get<DashboardData>(ENDPOINTS.DASHBOARD.BASE).then((r) => r.data)
  },

  getRevenueAnalytics(): Promise<AnalyticsRevenueData> {
    return axiosInstance.get<AnalyticsRevenueData>(ENDPOINTS.ANALYTICS.REVENUE).then((r) => r.data)
  },

  getPaymentAnalytics(): Promise<AnalyticsPaymentData> {
    return axiosInstance.get<AnalyticsPaymentData>(ENDPOINTS.ANALYTICS.PAYMENTS).then((r) => r.data)
  },
}
