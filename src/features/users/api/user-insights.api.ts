import { keepPreviousData, useQuery } from '@tanstack/react-query'
import axiosInstance from '@/api/axios'

export interface DirectoryUser {
  id: number
  mobileNumber: string
  verified: boolean
  banned: boolean
  createdAt: string | null
  name: string | null
  email: string | null
  profilePicUrl: string | null
  gender: string | null
  spent: number
  purchases: number
  lastPurchaseAt: string | null
  activeCards: number
  walletBalance: number
}

export interface DirectoryPage {
  content: DirectoryUser[]
  page: number
  size: number
  totalElements: number
  totalPages: number
  last: boolean
}

export type UserStatusFilter = 'all' | 'active' | 'banned' | 'unverified'
export type UserSegment = 'all' | 'buyers' | 'no_purchases' | 'card_holders' | 'new'
export type UserSort = 'newest' | 'oldest' | 'top_spenders' | 'last_purchase'

export interface DirectoryQuery {
  q: string
  status: UserStatusFilter
  segment: UserSegment
  sort: UserSort
}

export interface UserCounts {
  total: number
  banned: number
  unverified: number
  newThisWeek: number
  buyers: number
  totalSpent: number
  cardHolders: number
}

export interface UserInsights {
  userId: number
  totalSpent?: number
  purchases?: number
  averageOrder?: number
  discountsSaved?: number
  refunds?: number
  refundedAmount?: number
  firstPurchaseAt?: string | null
  lastPurchaseAt?: string | null
  paymentMethods?: { method: string; count: number; amount: number }[]
  favouriteVendors?: { vendorId: number | null; name: string | null; purchases: number; spent: number }[]
  monthly?: { month: string; spent: number; purchases: number }[]
  cards?: { total: number; active: number; walletBalance: number; expiringSoon: number }
  redemptions?: { completed: number; amount: number; pending: number; refused: number; lastRedemptionAt: string | null }
}

export interface UserPurchase {
  id: number
  cardName: string | null
  cardPrice: number
  amountPaid: number
  discount: number
  walletAmount: number
  couponCode: string | null
  paymentMethod: string | null
  status: string
  createdAt: string | null
  refundedAt: string | null
  refundReason: string | null
  vendorId: number | null
  storeId: number | null
  vendorName: string | null
}

export interface PurchasePage {
  content: UserPurchase[]
  page?: number
  size?: number
  totalElements: number
  totalPages: number
  last?: boolean
}

const BASE = '/api/admin/users'

export const userInsightsApi = {
  directory: (query: DirectoryQuery, page: number, size: number) =>
    axiosInstance.get<DirectoryPage>(`${BASE}/directory`, {
      params: { page, size, q: query.q || undefined, status: query.status, segment: query.segment, sort: query.sort },
    }).then((r) => r.data),
  counts: () => axiosInstance.get<UserCounts>(`${BASE}/insights/counts`).then((r) => r.data),
  insights: (userId: number) => axiosInstance.get<UserInsights>(`${BASE}/${userId}/insights`).then((r) => r.data),
  purchases: (userId: number, page: number, size = 10) =>
    axiosInstance.get<PurchasePage>(`${BASE}/${userId}/purchases`, { params: { page, size } }).then((r) => r.data),
}

// Keys sit under ['users', …] so ban/unban (which invalidates ['users']) refreshes them.
export function useUserDirectory(query: DirectoryQuery, page: number, size: number) {
  return useQuery({
    queryKey: ['users', 'directory', query, page, size],
    queryFn: () => userInsightsApi.directory(query, page, size),
    placeholderData: keepPreviousData,
    staleTime: 30_000,
    retry: 1,
    meta: { suppressError: true },
  })
}

export function useUserCounts() {
  return useQuery({ queryKey: ['users', 'insights', 'counts'], queryFn: userInsightsApi.counts, staleTime: 30_000, retry: 1, meta: { suppressError: true } })
}

export function useUserInsights(userId: number | null) {
  return useQuery({
    queryKey: ['users', 'insights', 'summary', userId],
    queryFn: () => userInsightsApi.insights(userId!),
    enabled: userId != null,
    staleTime: 30_000,
    retry: 1,
    meta: { suppressError: true },
  })
}

export function useUserPurchases(userId: number | null, page: number, size = 10) {
  return useQuery({
    queryKey: ['users', userId, 'purchases', page, size],
    queryFn: () => userInsightsApi.purchases(userId!, page, size),
    enabled: userId != null,
    placeholderData: keepPreviousData,
    staleTime: 30_000,
    retry: 1,
    meta: { suppressError: true },
  })
}
