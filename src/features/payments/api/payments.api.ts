import axiosInstance from '@/api/axios'
import { ENDPOINTS } from '@/constants/api/endpoints'
import type { PaymentResponse, PaymentPage, PaymentStats, PaymentReversalReason } from '../types/payment.types'

export const paymentsApi = {
  list: (page: number, size: number, status?: string): Promise<PaymentPage> =>
    axiosInstance
      .get(ENDPOINTS.PAYMENTS.BASE, { params: { page, size, ...(status ? { status } : {}) } })
      .then((r) => r.data as PaymentPage),

  getStats: (): Promise<PaymentStats> =>
    axiosInstance.get(ENDPOINTS.PAYMENTS.STATS).then((r) => r.data as PaymentStats),

  getById: (id: number): Promise<PaymentResponse> =>
    axiosInstance.get(ENDPOINTS.PAYMENTS.BY_ID(String(id))).then((r) => r.data as PaymentResponse),

  // Reverses a COMPLETED payment (duplicate charge or customer-requested cancellation): marks it
  // REFUNDED, cancels the linked subscription so the wallet balance can't be spent, and voids the
  // vendor's commission for it if that hasn't been settled yet.
  reverse: (id: number, reasonCode: PaymentReversalReason, note?: string): Promise<PaymentResponse> =>
    axiosInstance
      .patch(ENDPOINTS.PAYMENTS.REFUND(String(id)), { reasonCode, note })
      .then((r) => r.data as PaymentResponse),
}
