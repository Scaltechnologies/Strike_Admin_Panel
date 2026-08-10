import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { pushApi } from '../api/push.api'
import type {
  PushDeviceFilters,
  SendPushRequest,
  SendPushBulkRequest,
} from '../types/notification.types'

const KEYS = {
  devices: (page: number, size: number, filters: PushDeviceFilters) =>
    ['notifications', 'push', 'devices', page, size, filters] as const,
  deviceStats: () => ['notifications', 'push', 'device-stats'] as const,
}

export function usePushDeviceList(
  page: number,
  size: number,
  filters: PushDeviceFilters = {},
  enabled = true,
) {
  return useQuery({
    queryKey: KEYS.devices(page, size, filters),
    queryFn: () => pushApi.listDevices(page, size, filters),
    enabled,
    retry: false,
    meta: { suppressError: true },
  })
}

export function usePushDeviceStats(enabled = true) {
  return useQuery({
    queryKey: KEYS.deviceStats(),
    queryFn: pushApi.getDeviceStats,
    enabled,
    retry: false,
    meta: { suppressError: true },
  })
}

export function useRevokePushDevice() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (id: number) => pushApi.revokeDevice(id),
    onSuccess: () => {
      toast.success('Device revoked')
      void qc.invalidateQueries({ queryKey: ['notifications', 'push'] })
    },
    onError: () => {
      toast.error('Failed to revoke device')
    },
  })
}

export function useSendPush() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (data: SendPushRequest) => pushApi.send(data),
    onSuccess: () => {
      toast.success('Push notification sent')
      void qc.invalidateQueries({ queryKey: ['notifications'] })
    },
    onError: () => {
      toast.error('Failed to send push notification')
    },
  })
}

export function useSendPushBulk() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (data: SendPushBulkRequest) => pushApi.sendBulk(data),
    onSuccess: (result) => {
      if (result.failed > 0) {
        toast.warning(`Sent ${result.sent}/${result.total} — ${result.failed} failed`)
      } else {
        toast.success(`Sent to all ${result.sent} recipients`)
      }
      void qc.invalidateQueries({ queryKey: ['notifications'] })
    },
    onError: () => {
      toast.error('Failed to send push notification')
    },
  })
}
