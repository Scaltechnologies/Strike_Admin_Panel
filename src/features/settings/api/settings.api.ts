import axiosInstance from '@/api/axios'
import { ENDPOINTS } from '@/constants/api/endpoints'
import type { CommissionRateHistoryPage } from '../types/settings.types'

export const commissionSettingsApi = {
  getGlobalRateHistory: (page: number, size: number): Promise<CommissionRateHistoryPage> =>
    axiosInstance
      .get(ENDPOINTS.COMMISSION.RATE_HISTORY_GLOBAL, { params: { page, size } })
      .then((r) => r.data as CommissionRateHistoryPage),
}
