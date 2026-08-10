import axiosInstance from '@/api/axios'
import { ENDPOINTS } from '@/constants/api/endpoints'
import type { PaymentResponse, PaymentPage, PaymentStats } from '../types/payment.types'

export const paymentsApi = {
  list: (page: number, size: number, status?: string): Promise<PaymentPage> =>
    axiosInstance
      .get(ENDPOINTS.PAYMENTS.BASE, { params: { page, size, ...(status ? { status } : {}) } })
      .then((r) => r.data as PaymentPage),

  getStats: (): Promise<PaymentStats> =>
    axiosInstance.get(ENDPOINTS.PAYMENTS.STATS).then((r) => r.data as PaymentStats),

  getById: (id: number): Promise<PaymentResponse> =>
    axiosInstance.get(ENDPOINTS.PAYMENTS.BY_ID(String(id))).then((r) => r.data as PaymentResponse),

  refund: (id: number, reason: string): Promise<PaymentResponse> =>
    axiosInstance
      .post(ENDPOINTS.PAYMENTS.REFUND(String(id)), { reason })
      .then((r) => r.data as PaymentResponse),
}
