// PENDING BACKEND — no template entity or controller exists in notification-service yet. Messages
// are freeform text passed at send time today. Calls here will 404 until templates ship.
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
