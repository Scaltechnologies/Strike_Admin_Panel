import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { paymentsApi } from '../api/payments.api'

export const PAYMENT_QUERY_KEYS = {
  all: ['payments'] as const,
  list: (page: number, size: number, status?: string) => ['payments', 'list', page, size, status] as const,
  stats: ['payments', 'stats'] as const,
  detail: (id: number) => ['payments', 'detail', id] as const,
}

const DEFAULTS = { staleTime: 1000 * 30, retry: 1, meta: { suppressError: true } } as const

export function usePaymentList(page: number, size: number, status?: string) {
  return useQuery({
    queryKey: PAYMENT_QUERY_KEYS.list(page, size, status),
    queryFn: () => paymentsApi.list(page, size, status),
    ...DEFAULTS,
  })
}

export function usePaymentStats() {
  return useQuery({
    queryKey: PAYMENT_QUERY_KEYS.stats,
    queryFn: () => paymentsApi.getStats(),
    staleTime: 1000 * 60,
    retry: 1,
    meta: { suppressError: true },
  })
}

export function useRefundPayment() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ id, reason }: { id: number; reason: string }) => paymentsApi.refund(id, reason),
    meta: { suppressError: true },
    onSuccess: () => {
      toast.success('Refund initiated successfully.')
      void qc.invalidateQueries({ queryKey: PAYMENT_QUERY_KEYS.all })
    },
    onError: () => toast.error('Failed to process refund.'),
  })
}
