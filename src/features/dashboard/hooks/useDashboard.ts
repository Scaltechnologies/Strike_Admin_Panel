import { useQuery } from '@tanstack/react-query'
import { dashboardApi } from '../api/dashboard.api'

export const DASHBOARD_QUERY_KEYS = {
  dashboard: ['dashboard'] as const,
  revenue: ['dashboard', 'revenue'] as const,
}

export function useDashboard() {
  return useQuery({
    queryKey: DASHBOARD_QUERY_KEYS.dashboard,
    queryFn: dashboardApi.getDashboard,
    staleTime: 1000 * 60 * 2,
    retry: 1,
    meta: { suppressError: true },
  })
}

export function useRevenueAnalytics() {
  return useQuery({
    queryKey: DASHBOARD_QUERY_KEYS.revenue,
    queryFn: dashboardApi.getRevenueAnalytics,
    staleTime: 1000 * 60 * 5,
    retry: 1,
    meta: { suppressError: true },
  })
}
