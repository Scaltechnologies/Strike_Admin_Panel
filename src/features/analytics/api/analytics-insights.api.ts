import { keepPreviousData, useQuery } from '@tanstack/react-query'
import axiosInstance from '@/api/axios'

export interface PeriodKpis {
  revenue?: number
  cardsSold?: number
  buyers?: number
  averageOrder?: number
  discounts?: number
  sellingStores?: number
  walletIssued?: number
  refunds?: number
  refundedAmount?: number
  returningBuyers?: number
  strikeEarnings?: number
  redemptions?: number
  redeemedAmount?: number
  newCustomers?: number
  newVendors?: number
  paidOut?: number
}

export type SeriesMetric = 'revenue' | 'earnings' | 'sold' | 'redeemed' | 'customers'

export type SeriesPoint = { key: string } & Record<SeriesMetric | `prev_${SeriesMetric}`, number>

export interface AnalyticsInsights {
  from: string
  to: string
  previousFrom: string
  previousTo: string
  bucket: 'day' | 'week' | 'month'
  current: PeriodKpis
  previous: PeriodKpis
  series: SeriesPoint[]
  paymentMethods: { name: string; count: number; amount: number }[]
  storeTypes: { name: string; count: number; amount: number }[]
  cardOutcomes: { name: string; count: number }[]
  priceBands: { from: number; to: number; count: number; amount: number }[]
  funnel: { step: string; count: number }[]
  heatmap: { day: number; hour: number; count: number }[]
  topVendors: { vendorId: number; name: string | null; revenue: number; previous: number; cardsSold: number }[]
  topCards: { name: string; count: number; amount: number }[]
  coupons: { code: string; uses: number; discount: number; revenue: number }[]
}

export function useAnalyticsInsights(from: string, to: string) {
  return useQuery({
    queryKey: ['analytics', 'insights', from, to],
    queryFn: () => axiosInstance.get<AnalyticsInsights>('/api/admin/analytics/insights', { params: { from, to } }).then((r) => r.data),
    placeholderData: keepPreviousData,
    staleTime: 60_000,
    retry: 1,
    meta: { suppressError: true },
  })
}

/** Categorical colours in a fixed order (validated for colour-blind separation). Never cycled. */
export const SERIES = ['#257de0', '#f47230', '#00b894', '#f2a600', '#ee7fac', '#008a17', '#6a4ce2', '#ec4647'] as const

/** One-hue sequential ramp (light → dark) for magnitude, e.g. the heatmap. */
export const SEQ = ['#eef5fe', '#cce3fd', '#9dc8f7', '#6aabf1', '#338ced', '#2370cd', '#1757ac', '#0e3d7e'] as const
