// Notification templates — backed by notification-service's NotificationTemplate entity/controller
// (proxied verbatim by admin-service).
import axiosInstance from '@/api/axios'
import { ENDPOINTS } from '@/constants/api/endpoints'
import type {
  TemplatePage,
  TemplateFilters,
  NotificationTemplate,
  CreateTemplateRequest,
  UpdateTemplateRequest,
} from '../types/notification.types'

export const templatesApi = {
  list: (page = 0, size = 20, filters: TemplateFilters = {}): Promise<TemplatePage> =>
    axiosInstance
      .get<TemplatePage>(ENDPOINTS.NOTIFICATIONS.TEMPLATES.BASE, {
        params: { page, size, channel: filters.channel || undefined, active: filters.active },
      })
      .then((r) => r.data),

  create: (data: CreateTemplateRequest): Promise<NotificationTemplate> =>
    axiosInstance
      .post<NotificationTemplate>(ENDPOINTS.NOTIFICATIONS.TEMPLATES.BASE, data)
      .then((r) => r.data),

  update: (id: number, data: UpdateTemplateRequest): Promise<NotificationTemplate> =>
    axiosInstance
      .put<NotificationTemplate>(ENDPOINTS.NOTIFICATIONS.TEMPLATES.BY_ID(id), data)
      .then((r) => r.data),

  remove: (id: number): Promise<void> =>
    axiosInstance.delete(ENDPOINTS.NOTIFICATIONS.TEMPLATES.BY_ID(id)).then(() => undefined),

  toggle: (id: number): Promise<NotificationTemplate> =>
    axiosInstance
      .patch<NotificationTemplate>(ENDPOINTS.NOTIFICATIONS.TEMPLATES.TOGGLE(id))
      .then((r) => r.data),
}
