import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import type { AxiosError } from 'axios'
import { toast } from 'sonner'
import { paymentsApi } from '../api/payments.api'
import type { PaymentReversalReason } from '../types/payment.types'

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

export function useReversePayment() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ id, reasonCode, note }: { id: number; reasonCode: PaymentReversalReason; note?: string }) =>
      paymentsApi.reverse(id, reasonCode, note),
    meta: { suppressError: true },
    onSuccess: () => {
      toast.success('Payment reversed. Subscription cancelled and commission voided.')
      void qc.invalidateQueries({ queryKey: PAYMENT_QUERY_KEYS.all })
    },
    onError: (error) => {
      const message = (error as AxiosError<{ message?: string }>).response?.data?.message
      toast.error(message ?? 'Failed to reverse payment.')
    },
  })
}
