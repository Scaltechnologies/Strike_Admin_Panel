import { useQuery } from '@tanstack/react-query'
import { dashboardApi } from '../api/dashboard.api'

export const DASHBOARD_QUERY_KEYS = {
  dashboard: ['dashboard'] as const,
  revenue: ['dashboard', 'revenue'] as const,
  payments: ['dashboard', 'payments'] as const,
}

/** The dashboard refreshes itself every minute while it's open. */
export const DASHBOARD_REFRESH_MS = 60_000

export function useDashboard() {
  return useQuery({
    queryKey: DASHBOARD_QUERY_KEYS.dashboard,
    queryFn: dashboardApi.getDashboard,
    staleTime: 30_000,
    refetchInterval: DASHBOARD_REFRESH_MS,
    retry: 1,
    meta: { suppressError: true },
  })
}

export function useRevenueAnalytics() {
  return useQuery({
    queryKey: DASHBOARD_QUERY_KEYS.revenue,
    queryFn: dashboardApi.getRevenueAnalytics,
    staleTime: 60_000,
    refetchInterval: DASHBOARD_REFRESH_MS * 5,
    retry: 1,
    meta: { suppressError: true },
  })
}

export function usePaymentAnalytics() {
  return useQuery({
    queryKey: DASHBOARD_QUERY_KEYS.payments,
    queryFn: dashboardApi.getPaymentAnalytics,
    staleTime: 60_000,
    refetchInterval: DASHBOARD_REFRESH_MS * 2,
    retry: 1,
    meta: { suppressError: true },
  })
}
