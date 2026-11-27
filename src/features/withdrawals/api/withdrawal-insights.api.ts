import { keepPreviousData, useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import type { AxiosError } from 'axios'
import { toast } from 'sonner'
import axiosInstance from '@/api/axios'
import { formatInrFull } from '@/features/vendors/utils/vendor-meta'

export type PayoutStatus = 'PENDING' | 'APPROVED' | 'REJECTED'
export type PayoutMethod = 'UPI' | 'BANK_TRANSFER'

export interface PayoutOverview {
  total?: number
  pending?: number
  pendingAmount?: number
  oldestPendingAt?: string | null
  approved?: number
  paid?: number
  rejected?: number
  paidThisMonth?: number
  paidThisMonthCount?: number
  paidToday?: number
  decidedToday?: number
  averageAmount?: number
  largestAmount?: number
  vendors?: number
  averageReviewSeconds?: number
  vendorEarnings?: number
  stillWithdrawable?: number
  daily?: { day: string; requested: number; paid: number; requests: number }[]
  methods?: { method: string; count: number; amount: number }[]
  topVendors?: { vendorId: number; name: string | null; count: number; amount: number }[]
  rejectionReasons?: { reason: string; count: number }[]
}

export interface PayoutRow {
  id: number
  vendorId: number
  vendorName: string | null
  vendorMobile: string | null
  storeLogo: string | null
  amount: number
  method: PayoutMethod
  upiId: string | null
  bankAccountName: string | null
  bankAccountNumber: string | null
  ifscCode: string | null
  note: string | null
  status: PayoutStatus
  adminNote: string | null
  createdAt: string | null
  reviewedAt: string | null
  decisionSeconds?: number
  vendorEarned?: number
  vendorPaidOut?: number
  vendorWaiting?: number
  vendorPayouts?: number
  balanceForThis?: number
  covered?: boolean
  firstPayout?: boolean
}

export interface PayoutPage {
  content: PayoutRow[]
  totalElements: number
  totalPages: number
  matchingAmount?: number
  statusCounts?: Partial<Record<PayoutStatus, number>>
}

export interface PayoutDetail extends PayoutRow {
  store?: { id: number; name: string | null; address: string | null; phone: string | null; status: string | null }
  reviewedByName?: string | null
  earningsByMonth?: { month: string; earned: number; sales: number }[]
  history?: { id: number; amount: number; status: PayoutStatus; method: PayoutMethod; createdAt: string | null; reviewedAt: string | null; adminNote: string | null }[]
}

export interface PayoutQuery {
  status: PayoutStatus | 'ALL'
  method: PayoutMethod | ''
  q: string
  from: string
  to: string
  sort: 'newest' | 'oldest' | 'amount_high' | 'amount_low'
}

const BASE = '/api/admin/withdrawals'

export const payoutsApi = {
  overview: (days: number) => axiosInstance.get<PayoutOverview>(`${BASE}/insights/overview`, { params: { days } }).then((r) => r.data),
  feed: (q: PayoutQuery, page: number, size: number) =>
    axiosInstance.get<PayoutPage>(`${BASE}/feed`, {
      params: { status: q.status, method: q.method || undefined, q: q.q || undefined, from: q.from || undefined, to: q.to || undefined, sort: q.sort, page, size },
    }).then((r) => r.data),
  details: (id: number) => axiosInstance.get<PayoutDetail>(`${BASE}/${id}/details`).then((r) => r.data),
  approve: (id: number, adminNote?: string) => axiosInstance.patch(`${BASE}/${id}/approve`, { adminNote }).then((r) => r.data),
  reject: (id: number, adminNote: string) => axiosInstance.patch(`${BASE}/${id}/reject`, { adminNote }).then((r) => r.data),
  bulkApprove: (ids: number[], note?: string) =>
    axiosInstance.post<{ approved: number[]; failed: { id: number; reason: string }[] }>(`${BASE}/bulk-approve`, { ids, note }).then((r) => r.data),
}

const OPTS = { retry: 1, meta: { suppressError: true } } as const

// Keys live under ['withdrawals', …] so every approve/reject refreshes all of them.
export function usePayoutOverview(days: number) {
  return useQuery({ queryKey: ['withdrawals', 'overview', days], queryFn: () => payoutsApi.overview(days), placeholderData: keepPreviousData, staleTime: 10_000, refetchInterval: 30_000, ...OPTS })
}

export function usePayoutFeed(q: PayoutQuery, page: number, size = 20) {
  return useQuery({
    queryKey: ['withdrawals', 'feed', q, page, size],
    queryFn: () => payoutsApi.feed(q, page, size),
    placeholderData: keepPreviousData,
    staleTime: 5_000,
    refetchInterval: q.status === 'PENDING' ? 15_000 : false,
    ...OPTS,
  })
}

export function usePayoutDetails(id: number) {
  return useQuery({ queryKey: ['withdrawals', 'details', id], queryFn: () => payoutsApi.details(id), staleTime: 10_000, ...OPTS })
}

const err = (e: unknown, f: string) => (e as AxiosError<{ message?: string }>)?.response?.data?.message || f

function useRefresh() {
  const qc = useQueryClient()
  return () => { void qc.invalidateQueries({ queryKey: ['withdrawals'] }); void qc.invalidateQueries({ queryKey: ['dashboard'] }) }
}

export function useMarkPaid() {
  const refresh = useRefresh()
  return useMutation({
    mutationFn: ({ row, reference, note }: { row: PayoutRow; reference?: string; note?: string }) =>
      payoutsApi.approve(row.id, [reference ? `Paid · ref ${reference}` : null, note].filter(Boolean).join(' — ') || undefined),
    meta: { suppressError: true },
    onSuccess: (_d, v) => { refresh(); toast.success(`${formatInrFull(v.row.amount)} to ${v.row.vendorName ?? 'the vendor'} marked as paid — they’ve been notified`) },
    onError: (e) => toast.error(err(e, "Couldn't approve this withdrawal")),
  })
}

export function useRejectPayout() {
  const refresh = useRefresh()
  return useMutation({
    mutationFn: ({ row, reason }: { row: PayoutRow; reason: string }) => payoutsApi.reject(row.id, reason),
    meta: { suppressError: true },
    onSuccess: () => { refresh(); toast.success('Rejected — the vendor will see your reason') },
    onError: (e) => toast.error(err(e, "Couldn't reject this withdrawal")),
  })
}

export function useBulkMarkPaid() {
  const refresh = useRefresh()
  return useMutation({
    mutationFn: ({ ids, note }: { ids: number[]; note?: string }) => payoutsApi.bulkApprove(ids, note),
    meta: { suppressError: true },
    onSuccess: (r) => { refresh(); toast.success(r.failed.length ? `${r.approved.length} marked paid, ${r.failed.length} skipped` : `${r.approved.length} withdrawals marked as paid`) },
    onError: (e) => toast.error(err(e, "Couldn't approve these withdrawals")),
  })
}
