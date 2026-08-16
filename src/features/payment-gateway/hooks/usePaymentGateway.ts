import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { paymentGatewayApi } from '../api/payment-gateway.api'
import type { UpdatePaymentGatewayConfigRequest } from '../types/payment-gateway.types'

export const PAYMENT_GATEWAY_QUERY_KEYS = {
  byProvider: (provider: string) => ['payment-gateway', provider] as const,
}

export function usePaymentGatewayConfig(provider: string) {
  return useQuery({
    queryKey: PAYMENT_GATEWAY_QUERY_KEYS.byProvider(provider),
    queryFn: () => paymentGatewayApi.get(provider),
    staleTime: 1000 * 30,
    retry: 1,
    meta: { suppressError: true },
  })
}

export function useUpdatePaymentGatewayConfig(provider: string) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (payload: UpdatePaymentGatewayConfigRequest) => paymentGatewayApi.update(provider, payload),
    meta: { suppressError: true },
    onSuccess: () => {
      toast.success('Payment gateway credentials saved.')
      void qc.invalidateQueries({ queryKey: PAYMENT_GATEWAY_QUERY_KEYS.byProvider(provider) })
    },
    onError: () => toast.error('Failed to save payment gateway credentials.'),
  })
}
