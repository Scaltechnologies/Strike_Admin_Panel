import { keepPreviousData, useQuery } from '@tanstack/react-query'
import axiosInstance from '@/api/axios'

export interface CatalogCard {
  id: number
  name: string
  description: string | null
  cardPrice: number
  walletAmount: number
  validityInDays: number | null
  imageUrl: string | null
  isActive: boolean
  createdAt: string | null
  vendorId: number | null
  storeId: number | null
  vendorName: string | null
  storeName: string | null
  sold: number
  activeHolders: number
  revenue: number
  lastSoldAt: string | null
  categories: string[]
  storeAddress?: string | null
  updatedAt?: string | null
}

export interface CatalogPage {
  content: CatalogCard[]
  page: number
  size: number
  totalElements: number
  totalPages: number
  last: boolean
}

export type CardStatusFilter = 'all' | 'active' | 'inactive'
export type CardSort = 'newest' | 'oldest' | 'best_selling' | 'top_revenue' | 'price_high' | 'price_low'

export interface CatalogQuery {
  q: string
  vendorId: number | null
  status: CardStatusFilter
  sort: CardSort
}

export interface CardCounts {
  total?: number
  active?: number
  vendors?: number
  sold?: number
  activeHolders?: number
  revenue?: number
  walletOutstanding?: number
}

export interface CardBuyer {
  subscriptionId: number
  userId: number | null
  name: string | null
  mobileNumber: string | null
  profilePicUrl: string | null
  status: string
  walletBalance: number
  paid: number
  couponCode: string | null
  purchasedAt: string | null
  expiresAt: string | null
}

export interface CardInsights {
  card: CatalogCard
  categories?: { id: number; name: string; imageUrl: string | null }[]
  menuItemCount?: number
  stats?: {
    sold: number
    buyers: number
    active: number
    expired: number
    exhausted: number
    cancelled: number
    expiringSoon: number
    revenue: number
    averagePaid: number
    discounts: number
    walletIssued: number
    walletLeft: number
    firstSoldAt: string | null
    lastSoldAt: string | null
  }
  monthly?: { month: string; sold: number; revenue: number }[]
  recentBuyers?: CardBuyer[]
  redemptions?: { completed: number; amount: number; refused: number }
}

const BASE = '/api/admin/cards'

export const cardInsightsApi = {
  catalog: (query: CatalogQuery, page: number, size: number) =>
    axiosInstance.get<CatalogPage>(`${BASE}/catalog`, {
      params: { page, size, q: query.q || undefined, vendorId: query.vendorId ?? undefined, status: query.status, sort: query.sort },
    }).then((r) => r.data),
  counts: () => axiosInstance.get<CardCounts>(`${BASE}/insights/counts`).then((r) => r.data),
  insights: (cardId: number) => axiosInstance.get<CardInsights>(`${BASE}/${cardId}/insights`).then((r) => r.data),
}

const OPTS = { staleTime: 30_000, retry: 1, meta: { suppressError: true } } as const

export function useCardCatalog(query: CatalogQuery, page: number, size: number) {
  return useQuery({
    queryKey: ['cards', 'catalog', query, page, size],
    queryFn: () => cardInsightsApi.catalog(query, page, size),
    placeholderData: keepPreviousData,
    ...OPTS,
  })
}

export function useCardCounts() {
  return useQuery({ queryKey: ['cards', 'insights', 'counts'], queryFn: cardInsightsApi.counts, ...OPTS })
}

export function useCardInsights(cardId: number) {
  return useQuery({ queryKey: ['cards', 'insights', cardId], queryFn: () => cardInsightsApi.insights(cardId), ...OPTS })
}
