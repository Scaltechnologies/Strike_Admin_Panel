import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { withdrawalsApi } from '../api/withdrawals.api'

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
