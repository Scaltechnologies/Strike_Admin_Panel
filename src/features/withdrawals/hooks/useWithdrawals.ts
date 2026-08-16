import { useQuery, useQueries, useMutation, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { withdrawalsApi } from '../api/withdrawals.api'
import { vendorsApi } from '@/features/vendors/api/vendors.api'
import type { VendorRecord } from '@/features/vendors/types/vendor.types'

export const WITHDRAWAL_QUERY_KEYS = {
  all: ['withdrawals'] as const,
  list: (page: number, size: number, status?: string) => ['withdrawals', 'list', page, size, status] as const,
  stats: ['withdrawals', 'stats'] as const,
  detail: (id: number) => ['withdrawals', 'detail', id] as const,
  byVendor: (vendorId: number, page: number) => ['withdrawals', 'vendor', vendorId, page] as const,
}

const DEFAULTS = { staleTime: 1000 * 30, retry: 1, meta: { suppressError: true } } as const

export function useWithdrawalList(page: number, size: number, status?: string) {
  return useQuery({
    queryKey: WITHDRAWAL_QUERY_KEYS.list(page, size, status),
    queryFn: () => withdrawalsApi.list(page, size, status),
    ...DEFAULTS,
  })
}

export function useVendorWithdrawals(vendorId: number | null, page: number, size = 10) {
  return useQuery({
    queryKey: WITHDRAWAL_QUERY_KEYS.byVendor(vendorId!, page),
    queryFn: () => withdrawalsApi.getByVendor(vendorId!, page, size),
    enabled: vendorId !== null,
    ...DEFAULTS,
  })
}

// Resolves vendorId -> VendorRecord for the rows currently on screen. Each unique vendor is
// fetched (and cached by react-query) at most once regardless of how many withdrawal rows
// reference it.
export function useVendorLookup(vendorIds: number[]) {
  const uniqueIds = Array.from(new Set(vendorIds))

  const results = useQueries({
    queries: uniqueIds.map((id) => ({
      queryKey: ['vendors', 'detail', id],
      queryFn: () => vendorsApi.getById(id),
      staleTime: 1000 * 60 * 5,
      retry: 1,
      meta: { suppressError: true },
    })),
  })

  const map = new Map<number, VendorRecord>()
  uniqueIds.forEach((id, i) => {
    const data = results[i]?.data
    if (data) map.set(id, data)
  })
  return map
}

export function resolveVendorName(vendorId: number, vendorMap: Map<number, VendorRecord>): string {
  const vendor = vendorMap.get(vendorId)
  return vendor?.hotelName || vendor?.mobileNumber || `Vendor #${vendorId}`
}

export function useWithdrawalStats() {
  return useQuery({
    queryKey: WITHDRAWAL_QUERY_KEYS.stats,
    queryFn: () => withdrawalsApi.getStats(),
    staleTime: 1000 * 60,
    retry: 1,
    meta: { suppressError: true },
  })
}

export function useApproveWithdrawal() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ id, adminNote }: { id: number; adminNote?: string }) =>
      withdrawalsApi.approve(id, adminNote),
    meta: { suppressError: true },
    onSuccess: () => {
      toast.success('Withdrawal approved.')
      void qc.invalidateQueries({ queryKey: WITHDRAWAL_QUERY_KEYS.all })
    },
    onError: () => toast.error('Failed to approve withdrawal.'),
  })
}

export function useRejectWithdrawal() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ id, adminNote }: { id: number; adminNote?: string }) =>
      withdrawalsApi.reject(id, adminNote),
    meta: { suppressError: true },
    onSuccess: () => {
      toast.success('Withdrawal rejected.')
      void qc.invalidateQueries({ queryKey: WITHDRAWAL_QUERY_KEYS.all })
    },
    onError: () => toast.error('Failed to reject withdrawal.'),
  })
}
