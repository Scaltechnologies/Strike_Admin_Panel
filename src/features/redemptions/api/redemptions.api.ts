import axiosInstance from '@/api/axios'
import { ENDPOINTS } from '@/constants/api/endpoints'
import type { ApiWrappedPage, RedemptionRecord, RedemptionStats } from '../types/redemption.types'

export const redemptionsApi = {
  list: (page: number, size: number, status?: string): Promise<ApiWrappedPage<RedemptionRecord>> =>
    axiosInstance
      .get(ENDPOINTS.REDEMPTIONS.ALL, { params: { page, size, ...(status ? { status } : {}) } })
      .then((r) => r.data as ApiWrappedPage<RedemptionRecord>),

  listByStore: (
    storeId: number,
    page: number,
    size: number,
    status?: string,
  ): Promise<ApiWrappedPage<RedemptionRecord>> =>
    axiosInstance
      .get(ENDPOINTS.REDEMPTIONS.BY_STORE(String(storeId)), {
        params: { page, size, ...(status ? { status } : {}) },
      })
      .then((r) => r.data as ApiWrappedPage<RedemptionRecord>),

  getStats: (): Promise<RedemptionStats> =>
    axiosInstance.get(ENDPOINTS.REDEMPTIONS.STATS).then((r) => r.data as RedemptionStats),
}
