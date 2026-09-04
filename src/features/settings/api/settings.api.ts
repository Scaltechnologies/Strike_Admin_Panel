import axiosInstance from '@/api/axios'
import { ENDPOINTS } from '@/constants/api/endpoints'
import type {
  PlatformSetting,
  GlobalCommissionRate,
  CommissionRateHistoryPage,
  PaymentMode,
  PaymentModeSetting,
} from '../types/settings.types'

export const settingsApi = {
  getByKey: (key: string): Promise<PlatformSetting> =>
    axiosInstance.get(ENDPOINTS.SETTINGS.BY_KEY(key)).then((r) => r.data as PlatformSetting),

  updateByKey: (key: string, settingValue: string): Promise<PlatformSetting> =>
    axiosInstance
      .put(ENDPOINTS.SETTINGS.BY_KEY(key), { settingValue })
      .then((r) => r.data as PlatformSetting),
}

export const paymentModeApi = {
  get: (): Promise<PaymentModeSetting> =>
    axiosInstance.get(ENDPOINTS.SETTINGS.PAYMENT_MODE).then((r) => r.data as PaymentModeSetting),

  update: (paymentMode: PaymentMode): Promise<PaymentModeSetting> =>
    axiosInstance
      .patch(ENDPOINTS.SETTINGS.PAYMENT_MODE, { paymentMode })
      .then((r) => r.data as PaymentModeSetting),
}

export const commissionSettingsApi = {
  getGlobalRate: (): Promise<GlobalCommissionRate> =>
    axiosInstance.get(ENDPOINTS.COMMISSION.RATE_GLOBAL).then((r) => r.data as GlobalCommissionRate),

  updateGlobalRate: (rate: number): Promise<GlobalCommissionRate> =>
    axiosInstance
      .patch(ENDPOINTS.COMMISSION.RATE_GLOBAL, { rate })
      .then((r) => r.data as GlobalCommissionRate),

  getGlobalRateHistory: (page: number, size: number): Promise<CommissionRateHistoryPage> =>
    axiosInstance
      .get(ENDPOINTS.COMMISSION.RATE_HISTORY_GLOBAL, { params: { page, size } })
      .then((r) => r.data as CommissionRateHistoryPage),
}
