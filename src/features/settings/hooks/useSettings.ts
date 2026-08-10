import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { settingsApi, commissionSettingsApi } from '../api/settings.api'
import { SETTING_KEYS } from '../types/settings.types'

export const SETTINGS_QUERY_KEYS = {
  maintenanceMode: ['settings', SETTING_KEYS.MAINTENANCE_MODE] as const,
  globalCommissionRate: ['settings', 'commission', 'rate'] as const,
  globalCommissionHistory: (page: number) => ['settings', 'commission', 'rate-history', page] as const,
}

export function useMaintenanceMode() {
  return useQuery({
    queryKey: SETTINGS_QUERY_KEYS.maintenanceMode,
    queryFn: () => settingsApi.getByKey(SETTING_KEYS.MAINTENANCE_MODE),
    staleTime: 1000 * 30,
    retry: 1,
    meta: { suppressError: true },
  })
}

export function useUpdateMaintenanceMode() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (on: boolean) => settingsApi.updateByKey(SETTING_KEYS.MAINTENANCE_MODE, on ? 'true' : 'false'),
    meta: { suppressError: true },
    onSuccess: (data) => {
      qc.setQueryData(SETTINGS_QUERY_KEYS.maintenanceMode, data)
      toast.success(data.settingValue === 'true' ? 'Maintenance mode enabled.' : 'Maintenance mode disabled.')
    },
    onError: () => toast.error('Failed to update maintenance mode.'),
  })
}

export function useGlobalCommissionRate() {
  return useQuery({
    queryKey: SETTINGS_QUERY_KEYS.globalCommissionRate,
    queryFn: () => commissionSettingsApi.getGlobalRate(),
    staleTime: 1000 * 30,
    retry: 1,
    meta: { suppressError: true },
  })
}

export function useGlobalCommissionRateHistory(page: number) {
  return useQuery({
    queryKey: SETTINGS_QUERY_KEYS.globalCommissionHistory(page),
    queryFn: () => commissionSettingsApi.getGlobalRateHistory(page, 10),
    meta: { suppressError: true },
  })
}

export function useUpdateGlobalCommissionRate() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (rate: number) => commissionSettingsApi.updateGlobalRate(rate),
    meta: { suppressError: true },
    onSuccess: (data) => {
      qc.setQueryData(SETTINGS_QUERY_KEYS.globalCommissionRate, data)
      void qc.invalidateQueries({ queryKey: ['settings', 'commission', 'rate-history'] })
      toast.success('Default commission rate updated.')
    },
    onError: () => toast.error('Failed to update commission rate.'),
  })
}
