import { useQuery } from '@tanstack/react-query'
import { analyticsApi } from '../api/analytics.api'

const DEFAULTS = { staleTime: 1000 * 60 * 2, retry: 1, meta: { suppressError: true } } as const

export function useAnalyticsOverview() {
  return useQuery({
    queryKey: ['analytics', 'overview'],
    queryFn: () => analyticsApi.getOverview(),
    ...DEFAULTS,
  })
}

export function useRevenueAnalytics() {
  return useQuery({
    queryKey: ['analytics', 'revenue'],
    queryFn: () => analyticsApi.getRevenue(),
    ...DEFAULTS,
  })
}

export function useVendorPerformance() {
  return useQuery({
    queryKey: ['analytics', 'vendor-performance'],
    queryFn: () => analyticsApi.getVendorPerformance(),
    ...DEFAULTS,
  })
}

export function useCommissionAnalytics() {
  return useQuery({
    queryKey: ['analytics', 'commissions'],
    queryFn: () => analyticsApi.getCommissions(),
    ...DEFAULTS,
  })
}
