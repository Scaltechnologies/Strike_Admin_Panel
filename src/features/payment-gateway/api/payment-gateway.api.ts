import axios from 'axios'
import axiosInstance from '@/api/axios'
import { ENDPOINTS } from '@/constants/api/endpoints'
import type { PaymentGatewayConfigResponse, UpdatePaymentGatewayConfigRequest } from '../types/payment-gateway.types'

export const paymentGatewayApi = {
  /** Returns null when the provider has never been configured (backend responds 404) — that is a
   *  valid, expected state here, not an error. */
  get: (provider: string): Promise<PaymentGatewayConfigResponse | null> =>
    axiosInstance
      .get(ENDPOINTS.PAYMENT_GATEWAY.BY_PROVIDER(provider))
      .then((r) => r.data as PaymentGatewayConfigResponse)
      .catch((err: unknown) => {
        if (axios.isAxiosError(err) && err.response?.status === 404) return null
        throw err
      }),

  update: (provider: string, payload: UpdatePaymentGatewayConfigRequest): Promise<PaymentGatewayConfigResponse> =>
    axiosInstance
      .put(ENDPOINTS.PAYMENT_GATEWAY.BY_PROVIDER(provider), payload)
      .then((r) => r.data as PaymentGatewayConfigResponse),
}
