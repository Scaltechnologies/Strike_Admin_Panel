import { keepPreviousData, useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import axios from 'axios'
import { toast } from 'sonner'
import axiosInstance from '@/api/axios'
import type { CreateCouponRequest } from '../types/coupon.types'

const BASE = '/api/admin/coupons'
const OPTS = { retry: 1, meta: { suppressError: true } } as const

export type CouponState = 'LIVE' | 'SCHEDULED' | 'EXPIRED' | 'PAUSED' | 'USED_UP' | 'WAITING' | 'REJECTED'
export type CouponSort = 'newest' | 'most_used' | 'most_discount' | 'ending'

export interface CouponRow {
  id: number
  code: string
  title: string
  description: string | null
  discountType: 'PERCENTAGE' | 'FLAT' | string
  discountValue: number
  maxDiscountAmount: number | null
  minPurchaseAmount: number | null
  maxUses: number | null
  usedCount: number
  vendorId: number | null
  validFrom: string
  validUntil: string
  isActive: boolean
  approvalStatus: string | null
  rejectionReason: string | null
  createdAt: string
  state: CouponState
  uses?: number
  discountGiven?: number
  revenue?: number
  customers?: number
  lastUsed?: string | null
  vendorName?: string | null
  vendorMobile?: string | null
  storeName?: string | null
}

export interface CouponOverview {
  days: number
  states?: Record<CouponState, number>
  total?: number
  platformWide?: number
  storeOnly?: number
  uses?: number; uses_previous?: number
  discount?: number; discount_previous?: number
  revenue?: number; revenue_previous?: number
  customers?: number
  uses_month?: number; discount_month?: number
  uses_all?: number; discount_all?: number
  series?: { day: string; uses: number; discount: number; revenue: number }[]
  top?: { id: number; code: string; title: string; discount_type: string; discount_value: number; uses: number; discount: number; revenue: number }[]
  expiringSoon?: { id: number; code: string; title: string; validUntil: string; usedCount: number; maxUses: number | null }[]
  nearlyUsedUp?: { id: number; code: string; title: string; usedCount: number; maxUses: number }[]
}

export interface CouponPageResult {
  content: CouponRow[]
  page: number
  size: number
  totalElements: number
  totalPages: number
}

export interface CouponDetails {
  coupon: CouponRow
  totals?: { uses: number; discount: number; revenue: number; full_price: number; customers: number; average_discount: number; first_used: string | null; last_used: string | null }
  series?: { day: string; uses: number; discount: number }[]
  recent?: { id: number; userId: number; subscriptionId: number | null; originalAmount: number; discountApplied: number; finalAmount: number; usedAt: string; customerName?: string | null; customerMobile?: string | null; storeName?: string | null; cardName?: string | null; paymentId?: number | null }[]
  stores?: { id: number; name: string; uses: number; discount: number }[]
}

export function apiMessage(err: unknown, fallback: string): string {
  if (axios.isAxiosError(err)) {
    const d = err.response?.data as { message?: string; error?: string } | undefined
    return d?.message || d?.error || fallback
  }
  return fallback
}

export function useCouponOverview(days: number) {
  return useQuery({
    queryKey: ['coupons', 'overview', days],
    queryFn: () => axiosInstance.get<CouponOverview>(`${BASE}/insights/overview`, { params: { days } }).then((r) => r.data),
    staleTime: 30_000,
    placeholderData: keepPreviousData,
    ...OPTS,
  })
}

export function useCouponRows(q: { state: CouponState | ''; scope: '' | 'PLATFORM' | 'STORE'; q: string; sort: CouponSort }, page: number, size = 24) {
  return useQuery({
    queryKey: ['coupons', 'rows', q, page, size],
    queryFn: () => axiosInstance.get<CouponPageResult>(`${BASE}/insights/list`, {
      params: { state: q.state || undefined, scope: q.scope || undefined, q: q.q.trim() || undefined, sort: q.sort, page, size },
    }).then((r) => r.data),
    placeholderData: keepPreviousData,
    staleTime: 15_000,
    ...OPTS,
  })
}

export function useCouponDetails(id: number) {
  return useQuery({
    queryKey: ['coupons', 'details', id],
    queryFn: () => axiosInstance.get<CouponDetails>(`${BASE}/insights/${id}/details`).then((r) => r.data),
    staleTime: 15_000,
    ...OPTS,
  })
}

function useAct<T>(fn: (v: T) => Promise<unknown>, ok: string | ((v: T) => string), fail: string) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: fn,
    meta: { suppressError: true },
    onSuccess: (_d, v) => { void qc.invalidateQueries({ queryKey: ['coupons'] }); toast.success(typeof ok === 'function' ? ok(v) : ok) },
    onError: (e) => toast.error(apiMessage(e, fail)),
  })
}

export const useSaveCoupon = () => useAct(
  ({ id, req }: { id?: number; req: CreateCouponRequest }) => (id ? axiosInstance.put(`${BASE}/${id}`, req) : axiosInstance.post(BASE, req)),
  ({ id }) => (id ? 'Coupon saved.' : 'Coupon created — it’s ready to use.'),
  "Couldn't save the coupon.",
)
export const usePauseCoupon = () => useAct(
  ({ id, pause }: { id: number; pause: boolean }) => axiosInstance.patch(`${BASE}/${id}/${pause ? 'deactivate' : 'activate'}`),
  ({ pause }) => (pause ? 'Coupon paused — customers can’t use it now.' : 'Coupon switched back on.'),
  "Couldn't change the coupon.",
)
export const useApproveRequest = () => useAct(
  (id: number) => axiosInstance.patch(`${BASE}/${id}/approve`),
  'Approved — the coupon is live for the store.',
  "Couldn't approve the request.",
)
export const useRejectRequest = () => useAct(
  ({ id, reason }: { id: number; reason: string }) => axiosInstance.patch(`${BASE}/${id}/reject`, { reason }),
  'Request turned down — the store has been told why.',
  "Couldn't turn down the request.",
)
