// PENDING BACKEND — the NotificationLog entity has no in-app storage or read-state fields, and no
// in-app controller exists in notification-service yet. Calls here will 404 until that ships.
import axiosInstance from '@/api/axios'
import { ENDPOINTS } from '@/constants/api/endpoints'
import type {
  InAppPage,
  InAppStats,
  InAppFilters,
  SendInAppRequest,
  SendInAppResponse,
  SendInAppBulkRequest,
  SendInAppBulkResponse,
} from '../types/notification.types'

export const inAppApi = {
  list: (page = 0, size = 20, filters: InAppFilters = {}): Promise<InAppPage> =>
    axiosInstance
      .get<InAppPage>(ENDPOINTS.NOTIFICATIONS.IN_APP.BASE, {
        params: {
          page,
          size,
          recipientType: filters.recipientType || undefined,
          recipientId: filters.recipientId,
          isRead: filters.isRead,
        },
      })
      .then((r) => r.data),

  getStats: (): Promise<InAppStats> =>
    axiosInstance.get<InAppStats>(ENDPOINTS.NOTIFICATIONS.IN_APP.STATS).then((r) => r.data),

  remove: (id: number): Promise<void> =>
    axiosInstance.delete(ENDPOINTS.NOTIFICATIONS.IN_APP.BY_ID(id)).then(() => undefined),

  send: (data: SendInAppRequest): Promise<SendInAppResponse> =>
    axiosInstance.post<SendInAppResponse>(ENDPOINTS.NOTIFICATIONS.IN_APP.SEND, data).then((r) => r.data),

  sendBulk: (data: SendInAppBulkRequest): Promise<SendInAppBulkResponse> =>
    axiosInstance
      .post<SendInAppBulkResponse>(ENDPOINTS.NOTIFICATIONS.IN_APP.SEND_BULK, data)
      .then((r) => r.data),
}
