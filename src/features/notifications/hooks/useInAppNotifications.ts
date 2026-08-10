import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { inAppApi } from '../api/inapp.api'
import type { InAppFilters, SendInAppRequest, SendInAppBulkRequest } from '../types/notification.types'

const KEYS = {
  list: (page: number, size: number, filters: InAppFilters) =>
    ['notifications', 'inapp', 'list', page, size, filters] as const,
  stats: () => ['notifications', 'inapp', 'stats'] as const,
}

export function useInAppList(page: number, size: number, filters: InAppFilters = {}, enabled = true) {
  return useQuery({
    queryKey: KEYS.list(page, size, filters),
    queryFn: () => inAppApi.list(page, size, filters),
    enabled,
    retry: false,
    meta: { suppressError: true },
  })
}

export function useInAppStats(enabled = true) {
  return useQuery({
    queryKey: KEYS.stats(),
    queryFn: inAppApi.getStats,
    enabled,
    retry: false,
    meta: { suppressError: true },
  })
}

export function useRemoveInAppNotification() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (id: number) => inAppApi.remove(id),
    onSuccess: () => {
      toast.success('Notification removed')
      void qc.invalidateQueries({ queryKey: ['notifications', 'inapp'] })
    },
    onError: () => {
      toast.error('Failed to remove notification')
    },
  })
}

export function useSendInApp() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (data: SendInAppRequest) => inAppApi.send(data),
    onSuccess: () => {
      toast.success('In-app notification sent')
      void qc.invalidateQueries({ queryKey: ['notifications', 'inapp'] })
    },
    onError: () => {
      toast.error('Failed to send in-app notification')
    },
  })
}

export function useSendInAppBulk() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (data: SendInAppBulkRequest) => inAppApi.sendBulk(data),
    onSuccess: (result) => {
      if (result.failed > 0) {
        toast.warning(`Sent ${result.sent}/${result.total} — ${result.failed} failed`)
      } else {
        toast.success(`Sent to all ${result.sent} recipients`)
      }
      void qc.invalidateQueries({ queryKey: ['notifications', 'inapp'] })
    },
    onError: () => {
      toast.error('Failed to send in-app notification')
    },
  })
}
