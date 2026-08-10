// PENDING BACKEND — notification-service has no push channel (FCM/APNs) or device registry yet.
// Calls here will 404 until that ships. See notification.types.ts for the anticipated contract.
import axiosInstance from '@/api/axios'
import { ENDPOINTS } from '@/constants/api/endpoints'
import type {
  PushDevicePage,
  PushDeviceStats,
  PushDeviceFilters,
  SendPushRequest,
  SendPushResponse,
  SendPushBulkRequest,
  SendPushBulkResponse,
} from '../types/notification.types'

export const pushApi = {
  listDevices: (page = 0, size = 20, filters: PushDeviceFilters = {}): Promise<PushDevicePage> =>
    axiosInstance
      .get<PushDevicePage>(ENDPOINTS.NOTIFICATIONS.PUSH.DEVICES, {
        params: {
          page,
          size,
          recipientType: filters.recipientType || undefined,
          platform: filters.platform || undefined,
          active: filters.active,
        },
      })
      .then((r) => r.data),

  getDeviceStats: (): Promise<PushDeviceStats> =>
    axiosInstance.get<PushDeviceStats>(ENDPOINTS.NOTIFICATIONS.PUSH.DEVICE_STATS).then((r) => r.data),

  revokeDevice: (id: number): Promise<void> =>
    axiosInstance.delete(ENDPOINTS.NOTIFICATIONS.PUSH.DEVICE_BY_ID(id)).then(() => undefined),

  send: (data: SendPushRequest): Promise<SendPushResponse> =>
    axiosInstance.post<SendPushResponse>(ENDPOINTS.NOTIFICATIONS.PUSH.SEND, data).then((r) => r.data),

  sendBulk: (data: SendPushBulkRequest): Promise<SendPushBulkResponse> =>
    axiosInstance.post<SendPushBulkResponse>(ENDPOINTS.NOTIFICATIONS.PUSH.SEND_BULK, data).then((r) => r.data),
}
