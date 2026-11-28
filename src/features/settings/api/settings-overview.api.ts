import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import axios from 'axios'
import { toast } from 'sonner'
import axiosInstance from '@/api/axios'
import type { PaymentMode } from '../types/settings.types'

export interface SettingStamp {
  changedAt: string | null
  changedBy: string | null
}

export interface SettingsHistoryEntry {
  id: number
  action: string
  summary: string | null
  actor: string | null
  actorEmail: string | null
  oldValue: string | null
  newValue: string | null
  details: string | null
  outcome: string | null
  path: string | null
  at: string | null
}

export interface SettingsOverview {
  maintenance: SettingStamp & { on: boolean; message: string }
  paymentMode: SettingStamp & { mode: PaymentMode }
  razorpay: {
    configured: boolean
    mode?: 'TEST' | 'LIVE'
    active?: boolean
    webhookConfigured?: boolean
    keyHint?: string | null
    changedAt?: string | null
  }
  commission: SettingStamp & {
    rate: number
    vendors: number
    onDefault: number
    spread: { rate: string; vendors: number }[]
    earned30d?: number
    sales30d?: number
  }
  menuApproval: SettingStamp & { mode: 'ALL' | 'MANAGERS' | 'OFF'; trusted: number; pending: number }
  history: SettingsHistoryEntry[]
  serverTime: string
}

/** What the user and vendor apps see — the same public check they make on launch. */
export interface AppStatus {
  maintenanceMode: boolean
  maintenanceMessage: string
  paymentMode: PaymentMode
  serverTime: string
}

export const OVERVIEW_KEY = ['settings', 'overview'] as const

export function useSettingsOverview() {
  return useQuery({
    queryKey: OVERVIEW_KEY,
    queryFn: () => axiosInstance.get<SettingsOverview>('/api/admin/settings/overview').then((r) => r.data),
    staleTime: 15_000,
    refetchInterval: 60_000,
    retry: 1,
    meta: { suppressError: true },
  })
}

/** Calls the public status endpoint and times it, so the page can prove what the apps get. */
export async function checkAppStatus(): Promise<{ status: AppStatus; ms: number }> {
  const start = performance.now()
  const { data } = await axiosInstance.get<AppStatus>('/api/app/status', { params: { t: Date.now() } })
  return { status: data, ms: Math.round(performance.now() - start) }
}

export function apiError(err: unknown, fallback: string): string {
  if (axios.isAxiosError(err)) {
    const d = err.response?.data as { error?: string; message?: string } | undefined
    return d?.error || d?.message || fallback
  }
  return fallback
}

function useRefresh() {
  const qc = useQueryClient()
  return () => {
    void qc.invalidateQueries({ queryKey: ['settings'] })
    void qc.invalidateQueries({ queryKey: ['menus', 'approval-settings'] })
  }
}

export function useSaveMaintenance() {
  const refresh = useRefresh()
  return useMutation({
    mutationFn: (body: { enabled?: boolean; message?: string }) =>
      axiosInstance.patch<{ maintenanceMode: boolean; maintenanceMessage: string }>('/api/admin/settings/maintenance', body).then((r) => r.data),
    meta: { suppressError: true },
    onSuccess: (d, body) => {
      refresh()
      if (body.enabled === undefined) toast.success('Message saved — the apps will show it during maintenance.')
      else toast.success(d.maintenanceMode ? 'Maintenance is ON — the apps are now closed.' : 'Maintenance is OFF — the apps are open again.')
    },
    onError: (e) => toast.error(apiError(e, "Couldn't change maintenance mode.")),
  })
}

export function useSavePaymentMode() {
  const refresh = useRefresh()
  return useMutation({
    mutationFn: (paymentMode: PaymentMode) =>
      axiosInstance.patch<{ paymentMode: PaymentMode }>('/api/admin/settings/payment-mode', { paymentMode }).then((r) => r.data),
    meta: { suppressError: true },
    onSuccess: () => { refresh(); toast.success('Payment options updated.') },
    onError: (e) => toast.error(apiError(e, "Couldn't change the payment options.")),
  })
}

export function useSaveDefaultRate() {
  const refresh = useRefresh()
  return useMutation({
    mutationFn: (body: { rate: number; reason?: string }) =>
      axiosInstance.patch<{ globalCommissionRate?: number; error?: string }>('/api/admin/commissions/rate/global', body).then((r) => {
        // This endpoint answers 200 with { error } for a bad value.
        if (r.data.error) throw new Error(r.data.error)
        return r.data
      }),
    meta: { suppressError: true },
    onSuccess: () => { refresh(); toast.success('Default commission saved — new vendors will start on it.') },
    onError: (e) => toast.error(e instanceof Error && !axios.isAxiosError(e) ? e.message : apiError(e, "Couldn't save the commission.")),
  })
}

export function useApplyDefaultRate() {
  const refresh = useRefresh()
  return useMutation({
    mutationFn: (body: { scope: 'ALL' } | { scope: 'FROM_RATE'; fromRate: number }) =>
      axiosInstance.post<{ updated: number; rate: number }>('/api/admin/commissions/rate/global/apply', body).then((r) => r.data),
    meta: { suppressError: true },
    onSuccess: (d) => {
      refresh()
      toast.success(d.updated === 0 ? 'No vendors needed changing.' : `${d.updated} vendor${d.updated === 1 ? '' : 's'} moved to ${d.rate}%.`)
    },
    onError: (e) => toast.error(apiError(e, "Couldn't update the vendors.")),
  })
}
