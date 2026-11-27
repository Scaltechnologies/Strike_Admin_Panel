import { useQuery } from '@tanstack/react-query'
import axiosInstance from '@/api/axios'

export interface VendorCounts {
  total: number
  ACTIVE: number
  PENDING: number
  SUSPENDED: number
  REJECTED: number
  kycPending: number
  kycVerified: number
}

export interface VendorSales {
  revenue: number
  cardsSold: number
}

export interface VendorInsights {
  vendorId: number
  grossRevenue: number
  onlineRevenue: number
  payAtStoreRevenue: number
  cardsSold: number
  onlineSales: number
  payAtStoreSales: number
  commissionTotal: number
  commissionPending: number
  commissionSettled: number
  commissionRate: number
  payAtStoreOutstanding: number
  withdrawals: { count: number; paidOut: number; pendingAmount: number }
  monthly: { month: string; revenue: number; commission: number; sold: number }[]
}

const BASE = '/api/admin/vendors'

export const vendorInsightsApi = {
  counts: () => axiosInstance.get<VendorCounts>(`${BASE}/insights/counts`).then((r) => r.data),
  sales: (ids: number[]) =>
    axiosInstance
      .get<Record<string, VendorSales>>(`${BASE}/insights/sales`, { params: { ids: ids.join(',') } })
      .then((r) => r.data),
  summary: (vendorId: number) =>
    axiosInstance.get<VendorInsights>(`${BASE}/${vendorId}/insights`).then((r) => r.data),
}

// Keys live under ['vendors', …] so approving/suspending (which invalidates ['vendors']) refreshes them too.
export function useVendorCounts() {
  return useQuery({
    queryKey: ['vendors', 'insights', 'counts'],
    queryFn: vendorInsightsApi.counts,
    staleTime: 30_000,
    retry: 1,
    meta: { suppressError: true },
  })
}

export function useVendorSales(ids: number[]) {
  return useQuery({
    queryKey: ['vendors', 'insights', 'sales', ids],
    queryFn: () => vendorInsightsApi.sales(ids),
    enabled: ids.length > 0,
    staleTime: 60_000,
    retry: 1,
    meta: { suppressError: true },
  })
}

export function useVendorInsights(vendorId: number | null) {
  return useQuery({
    queryKey: ['vendors', 'insights', 'summary', vendorId],
    queryFn: () => vendorInsightsApi.summary(vendorId!),
    enabled: vendorId != null,
    staleTime: 30_000,
    retry: 1,
    meta: { suppressError: true },
  })
}
