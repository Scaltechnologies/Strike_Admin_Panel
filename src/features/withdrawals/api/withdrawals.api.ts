import axiosInstance from '@/api/axios'
import { ENDPOINTS } from '@/constants/api/endpoints'
import type { WithdrawalResponse, WithdrawalPage, WithdrawalStats } from '../types/withdrawal.types'

export const withdrawalsApi = {
  list: (page: number, size: number, status?: string): Promise<WithdrawalPage> =>
    axiosInstance
      .get(ENDPOINTS.WITHDRAWALS.BASE, { params: { page, size, ...(status ? { status } : {}) } })
      .then((r) => r.data as WithdrawalPage),

  getStats: (): Promise<WithdrawalStats> =>
    axiosInstance.get(ENDPOINTS.WITHDRAWALS.STATS).then((r) => r.data as WithdrawalStats),

  getById: (id: number): Promise<WithdrawalResponse> =>
    axiosInstance.get(ENDPOINTS.WITHDRAWALS.BY_ID(String(id))).then((r) => r.data as WithdrawalResponse),

  getByVendor: (vendorId: number, page: number, size: number): Promise<WithdrawalPage> =>
    axiosInstance
      .get(ENDPOINTS.WITHDRAWALS.BY_VENDOR(String(vendorId)), { params: { page, size } })
      .then((r) => r.data as WithdrawalPage),

  approve: (id: number, adminNote?: string): Promise<WithdrawalResponse> =>
    axiosInstance
      .patch(ENDPOINTS.WITHDRAWALS.APPROVE(String(id)), { adminNote })
      .then((r) => r.data as WithdrawalResponse),

  reject: (id: number, adminNote?: string): Promise<WithdrawalResponse> =>
    axiosInstance
      .patch(ENDPOINTS.WITHDRAWALS.REJECT(String(id)), { adminNote })
      .then((r) => r.data as WithdrawalResponse),
}
