import axiosInstance from '@/api/axios'
import { ENDPOINTS } from '@/constants/api/endpoints'
import type {
  NotificationPage,
  NotificationStats,
  NotificationLog,
  NotificationListFilters,
  SendNotificationRequest,
  SendNotificationResponse,
  SendBulkNotificationRequest,
  SendBulkNotificationResponse,
} from '../types/notification.types'

export const notificationsApi = {
  list: (page = 0, size = 20, filters: NotificationListFilters = {}): Promise<NotificationPage> =>
    axiosInstance
      .get<NotificationPage>(ENDPOINTS.NOTIFICATIONS.BASE, {
        params: {
          page,
          size,
          status: filters.status || undefined,
          type: filters.type || undefined,
          // PENDING BACKEND — `channel` isn't accepted by the list endpoint yet; sent for forward compat.
          channel: filters.channel || undefined,
        },
      })
      .then((r) => r.data),

  getStats: (): Promise<NotificationStats> =>
    axiosInstance.get<NotificationStats>(ENDPOINTS.NOTIFICATIONS.STATS).then((r) => r.data),

  getById: (id: number): Promise<NotificationLog> =>
    axiosInstance.get<NotificationLog>(ENDPOINTS.NOTIFICATIONS.BY_ID(id)).then((r) => r.data),

  send: (data: SendNotificationRequest): Promise<SendNotificationResponse> =>
    axiosInstance
      .post<SendNotificationResponse>(ENDPOINTS.NOTIFICATIONS.SEND, data)
      .then((r) => r.data),

  sendBulk: (data: SendBulkNotificationRequest): Promise<SendBulkNotificationResponse> =>
    axiosInstance
      .post<SendBulkNotificationResponse>(ENDPOINTS.NOTIFICATIONS.SEND_BULK, data)
      .then((r) => r.data),

  getByUser: (userId: string, page = 0, size = 20): Promise<NotificationPage> =>
    axiosInstance
      .get<NotificationPage>(ENDPOINTS.NOTIFICATIONS.BY_USER(userId), { params: { page, size } })
      .then((r) => r.data),

  getByVendor: (vendorId: string, page = 0, size = 20): Promise<NotificationPage> =>
    axiosInstance
      .get<NotificationPage>(ENDPOINTS.NOTIFICATIONS.BY_VENDOR(vendorId), { params: { page, size } })
      .then((r) => r.data),
}
