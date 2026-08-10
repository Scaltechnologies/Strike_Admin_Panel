import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { notificationsApi } from '../api/notifications.api'
import type {
  NotificationListFilters,
  SendNotificationRequest,
  SendBulkNotificationRequest,
} from '../types/notification.types'

const KEYS = {
  list: (page: number, size: number, filters: NotificationListFilters) =>
    ['notifications', 'list', page, size, filters] as const,
  stats: () => ['notifications', 'stats'] as const,
}

export function useNotificationList(
  page: number,
  size: number,
  filters: NotificationListFilters = {},
  enabled = true,
) {
  return useQuery({
    queryKey: KEYS.list(page, size, filters),
    queryFn: () => notificationsApi.list(page, size, filters),
    enabled,
    meta: { suppressError: true },
  })
}

export function useNotificationStats() {
  return useQuery({
    queryKey: KEYS.stats(),
    queryFn: notificationsApi.getStats,
    meta: { suppressError: true },
  })
}

export function useSendNotification() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (data: SendNotificationRequest) => notificationsApi.send(data),
    onSuccess: () => {
      toast.success('Notification sent successfully')
      void qc.invalidateQueries({ queryKey: ['notifications'] })
    },
    onError: () => {
      toast.error('Failed to send notification')
    },
  })
}

export function useSendBulkNotification() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (data: SendBulkNotificationRequest) => notificationsApi.sendBulk(data),
    onSuccess: (result) => {
      if (result.failed > 0) {
        toast.warning(`Sent ${result.sent}/${result.total} — ${result.failed} failed`)
      } else {
        toast.success(`Sent to all ${result.sent} recipients`)
      }
      void qc.invalidateQueries({ queryKey: ['notifications'] })
    },
    onError: () => {
      toast.error('Failed to send bulk notification')
    },
  })
}
