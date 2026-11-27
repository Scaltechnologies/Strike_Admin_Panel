import { keepPreviousData, useQuery } from '@tanstack/react-query'
import axiosInstance from '@/api/axios'

export type RedemptionStatusName = 'PENDING' | 'COMPLETED' | 'REJECTED' | 'FAILED' | 'REVERSED' | 'CANCELLED'

export interface RedemptionOverview {
  total?: number
  completed?: number
  pending?: number
  rejected?: number
  failed?: number
  cancelled?: number
  amount?: number
  averageAmount?: number
  largestAmount?: number
  customers?: number
  stores?: number
  todayCount?: number
  todayAmount?: number
  yesterdayCount?: number
  yesterdayAmount?: number
  monthCount?: number
  monthAmount?: number
  successRate?: number | null
  averageApprovalSeconds?: number
  oldestPendingAt?: string | null
  lastRedemptionAt?: string | null
  daily?: { day: string; completed: number; amount: number; refused: number }[]
  hourly?: { hour: number; count: number }[]
  weekdays?: { day: number; count: number }[]
  initiatedBy?: { by: string; count: number }[]
  topStores?: { storeId: number; name: string | null; vendorName: string | null; vendorId: number | null; count: number; amount: number }[]
  topCards?: { name: string; count: number; amount: number }[]
  topItems?: { name: string; quantity: number; amount: number }[]
  refusalReasons?: { reason: string; count: number }[]
}

export interface RedemptionRow {
  id: number
  status: RedemptionStatusName
  amount: number
  balanceAfter: number | null
  cardName: string | null
  initiatedBy: string | null
  failureReason: string | null
  subscriptionId: number | null
  userId: number | null
  customerName: string | null
  customerMobile: string | null
  customerPhoto: string | null
  storeId: number | null
  storeName: string | null
  storeLogo: string | null
  vendorId: number | null
  vendorName: string | null
  itemCount: number
  createdAt: string | null
  approvedAt: string | null
  rejectedAt: string | null
  cancelledAt: string | null
  decisionSeconds?: number
}

export interface RedemptionFeedPage {
  content: RedemptionRow[]
  totalElements: number
  totalPages: number
  matchingAmount?: number
  matchingCompleted?: number
  statusCounts?: Partial<Record<RedemptionStatusName, number>>
}

export type FeedStatus = 'ALL' | 'PENDING' | 'COMPLETED' | 'REFUSED' | 'CANCELLED'
export type FeedSort = 'newest' | 'oldest' | 'amount_high' | 'amount_low'

export interface FeedQuery {
  status: FeedStatus
  q: string
  from: string
  to: string
  sort: FeedSort
  storeId?: number | null
}

export interface RedemptionDetail extends RedemptionRow {
  storeAddress: string | null
  managerName: string | null
  customerEmail: string | null
  items: { menuItemId: number | null; name: string | null; quantity: number; unitPrice: number; totalPrice: number }[]
  card?: {
    subscriptionId: number
    cardId: number | null
    name: string | null
    status: string | null
    walletAmount: number
    cardPrice: number
    walletBalanceNow: number
    purchasedAt: string | null
    expiresAt: string | null
    redemptions: number
  }
  customerRecent?: { id: number; amount: number; status: string; createdAt: string; storeName: string; cardName: string }[]
  customerTotals?: { completed: number; amount: number }
}

const BASE = '/api/admin/redemptions'

export const redemptionInsightsApi = {
  overview: (days: number) => axiosInstance.get<RedemptionOverview>(`${BASE}/insights/overview`, { params: { days } }).then((r) => r.data),
  feed: (q: FeedQuery, page: number, size: number) =>
    axiosInstance.get<RedemptionFeedPage>(`${BASE}/feed`, {
      params: {
        status: q.status, q: q.q || undefined, from: q.from || undefined, to: q.to || undefined,
        sort: q.sort, storeId: q.storeId ?? undefined, page, size,
      },
    }).then((r) => r.data),
  details: (id: number) => axiosInstance.get<RedemptionDetail>(`${BASE}/${id}/details`).then((r) => r.data),
}

const OPTS = { retry: 1, meta: { suppressError: true } } as const

export function useRedemptionOverview(days: number, live: boolean) {
  return useQuery({
    queryKey: ['redemptions', 'overview', days],
    queryFn: () => redemptionInsightsApi.overview(days),
    placeholderData: keepPreviousData,
    staleTime: 10_000,
    refetchInterval: live ? 15_000 : false,
    ...OPTS,
  })
}

export function useRedemptionFeed(q: FeedQuery, page: number, size: number, live: boolean) {
  return useQuery({
    queryKey: ['redemptions', 'feed', q, page, size],
    queryFn: () => redemptionInsightsApi.feed(q, page, size),
    placeholderData: keepPreviousData,
    staleTime: 5_000,
    refetchInterval: live ? 10_000 : false,
    ...OPTS,
  })
}

export function useRedemptionDetails(id: number) {
  return useQuery({ queryKey: ['redemptions', 'details', id], queryFn: () => redemptionInsightsApi.details(id), staleTime: 15_000, ...OPTS })
}
