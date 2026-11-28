import { keepPreviousData, useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import axios from 'axios'
import { toast } from 'sonner'
import axiosInstance from '@/api/axios'

const BASE = '/api/admin/payments'
const OPTS = { retry: 1, meta: { suppressError: true } } as const

export type PayStatus = 'PENDING' | 'COMPLETED' | 'FAILED' | 'REFUNDED'
export type RefundMethod = 'RAZORPAY' | 'STORE_CASH' | 'OUTSIDE' | 'NONE'
export type RefundReason = 'DUPLICATE_ENTRY' | 'CUSTOMER_CANCELLED' | 'CARD_NOT_WORKING' | 'STORE_CLOSED' | 'OTHER'
export type FeedStatus = '' | PayStatus | 'REFUNDS_PENDING' | 'REFUND_FAILED' | 'DISPUTED'
export type FeedSort = 'newest' | 'oldest' | 'amount_high' | 'amount_low'

export interface PaymentRow {
  id: number
  userId: number
  subscriptionId: number | null
  vendorId: number
  storeId: number
  cardName: string
  cardPrice: number
  walletAmount: number
  amountPaid: number
  discountApplied: number | null
  couponCode: string | null
  status: PayStatus
  gateway: string
  gatewayTransactionId: string | null
  paymentMethod: 'ONLINE' | 'PAY_AT_STORE' | null
  refundReason: string | null
  refundNote: string | null
  refundedAt: string | null
  refundedBy: number | null
  refundAmount: number | null
  refundMethod: RefundMethod | null
  gatewayRefundId: string | null
  refundStatus: 'PENDING' | 'PROCESSED' | 'FAILED' | null
  refundError: string | null
  cardCancelled: boolean | null
  disputeStatus: string | null
  disputeReason: string | null
  confirmationMethod: string | null
  sourcePaymentId: number | null
  createdAt: string
  updatedAt: string | null
  customerName?: string | null
  customerMobile?: string | null
  customerPic?: string | null
  customerEmail?: string | null
  storeName?: string | null
  storeLogo?: string | null
  storeAddress?: string | null
  storePhone?: string | null
  vendorName?: string | null
  vendorMobile?: string | null
  cardStatus?: string | null
  cardBalance?: number | null
  refundedByName?: string | null
}

export interface FeedPage {
  content: PaymentRow[]
  page: number
  size: number
  totalElements: number
  totalPages: number
  totalAmount: number
}

export interface FeedQuery {
  status: FeedStatus
  method: '' | 'ONLINE' | 'PAY_AT_STORE'
  q: string
  from: string
  to: string
  sort: FeedSort
}

export interface GatewayPayment {
  gatewayPaymentId: string
  orderId: string | null
  status: string | null
  amount: number | null
  amountRefunded: number | null
  refundStatus: string | null
  method: string | null
  vpa: string | null
  bank: string | null
  wallet: string | null
  cardNetwork: string | null
  cardLast4: string | null
  email: string | null
  contact: string | null
  fee: number | null
  tax: number | null
  createdAtEpochSeconds: number | null
}

export interface PaymentOverview {
  days: number
  collected_all?: number; paid_all?: number
  collected_today?: number; paid_today?: number
  collected_month?: number
  collected_period?: number; paid_period?: number
  collected_previous?: number; paid_previous?: number
  refunded_all?: number; refunds_all?: number
  refunded_period?: number; refunds_period?: number
  refunds_pending?: number; refunds_failed?: number
  disputes_open?: number
  discounts_period?: number
  buyers_period?: number
  attempts_success?: number; attempts_failed?: number; attempts_abandoned?: number; attempts_open?: number
  failureReasons?: { reason: string; count: number }[]
  methods?: { method: string; count: number; amount: number }[]
  refundReasons?: { reason: string; count: number; amount: number }[]
  refundMethods?: { method: string; count: number; amount: number }[]
  topCards?: { name: string; count: number; amount: number }[]
  series?: { day: string; collected: number; count: number; online: number; store: number; refunded: number }[]
  hours?: { hour: number; count: number }[]
}

export interface PaymentDetails {
  payment: PaymentRow
  card?: { id: number; status: string; walletBalance: number; originalWalletAmount: number | null; purchasedAt: string | null; expiresAt: string | null }
  redemptions?: { id: number; status: string; totalAmount: number; createdAt: string }[]
  redemptionTotals?: { count: number; amount: number }
  commission?: { commissionRate: number; commissionAmount: number; status: string; settledAt: string | null }
  attempts?: { attemptNumber: number; status: string; gatewayOrderId: string | null; gatewayPaymentId: string | null; failureCode: string | null; failureReason: string | null; signatureVerified: boolean | null; createdAt: string }[]
  events?: { action: string; actorType: string | null; previousStatus: string | null; newStatus: string | null; createdAt: string }[]
  adminActions?: { action: string; actorEmail: string | null; actorName: string | null; outcome: string | null; details: string | null; createdAt: string }[]
  gateway?: GatewayPayment | null
}

export interface RefundPreview {
  paymentId: number
  status: PayStatus
  online: boolean
  canUseRazorpay: boolean
  defaultMethod: RefundMethod
  amountPaid: number
  walletAmount: number
  cardStatus: string | null
  walletBalance: number | null
  walletUsed: number | null
  suggestedAmount: number
  warnings: string[]
  commission?: { commission_amount: number; status: string }
  gateway?: GatewayPayment | null
}

export interface RefundBody {
  reasonCode: RefundReason
  note?: string
  amount?: number
  refundMethod: RefundMethod
  cancelCard: boolean
}

export function apiMessage(err: unknown, fallback: string): string {
  if (axios.isAxiosError(err)) {
    const d = err.response?.data as { message?: string; error?: string } | undefined
    return d?.message || d?.error || fallback
  }
  return fallback
}

export function usePaymentOverview(days: number) {
  return useQuery({
    queryKey: ['payments', 'overview', days],
    queryFn: () => axiosInstance.get<PaymentOverview>(`${BASE}/insights/overview`, { params: { days } }).then((r) => r.data),
    staleTime: 30_000,
    refetchInterval: 60_000,
    placeholderData: keepPreviousData,
    ...OPTS,
  })
}

export function usePaymentFeed(q: FeedQuery, page: number, size = 20) {
  return useQuery({
    queryKey: ['payments', 'feed', q, page, size],
    queryFn: () => axiosInstance.get<FeedPage>(`${BASE}/insights/feed`, {
      params: {
        status: q.status || undefined, method: q.method || undefined, q: q.q.trim() || undefined,
        from: q.from || undefined, to: q.to || undefined, sort: q.sort, page, size,
      },
    }).then((r) => r.data),
    placeholderData: keepPreviousData,
    staleTime: 15_000,
    ...OPTS,
  })
}

export function usePaymentDetails(id: number) {
  return useQuery({
    queryKey: ['payments', 'details', id],
    queryFn: () => axiosInstance.get<PaymentDetails>(`${BASE}/insights/${id}/details`).then((r) => r.data),
    staleTime: 15_000,
    ...OPTS,
  })
}

export function useRefundPreview(id: number | null) {
  return useQuery({
    queryKey: ['payments', 'refund-preview', id],
    queryFn: () => axiosInstance.get<RefundPreview>(`${BASE}/${id}/refund-preview`).then((r) => r.data),
    enabled: id != null,
    staleTime: 0,
    ...OPTS,
  })
}

export function useRefund() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ id, body }: { id: number; body: RefundBody }) =>
      axiosInstance.patch<PaymentRow>(`${BASE}/${id}/refund`, body).then((r) => r.data),
    meta: { suppressError: true },
    onSettled: () => void qc.invalidateQueries({ queryKey: ['payments'] }),
  })
}

export function useSyncRefund() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (id: number) => axiosInstance.post<PaymentRow>(`${BASE}/${id}/refund/sync`).then((r) => r.data),
    meta: { suppressError: true },
    onSuccess: (p) => {
      void qc.invalidateQueries({ queryKey: ['payments'] })
      toast.success(p.refundStatus === 'PROCESSED' ? 'Razorpay has processed the refund.' : `Refund is ${String(p.refundStatus ?? '').toLowerCase()}.`)
    },
    onError: (e) => toast.error(apiMessage(e, "Couldn't check the refund.")),
  })
}
