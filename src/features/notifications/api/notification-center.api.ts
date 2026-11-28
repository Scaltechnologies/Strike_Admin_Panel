import { keepPreviousData, useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import axios from 'axios'
import { toast } from 'sonner'
import axiosInstance from '@/api/axios'
import { templatesApi } from './templates.api'

const BASE = '/api/admin/notifications/center'
const OPTS = { retry: 1, meta: { suppressError: true } } as const

export type Audience = 'USER' | 'VENDOR' | 'ADMIN'
export type AudienceKind = 'ALL_CUSTOMERS' | 'ALL_VENDORS' | 'ACTIVE_CARD' | 'NO_CARD' | 'EXPIRING_SOON' | 'INACTIVE_30' | 'STORE_CUSTOMERS' | 'ONE_CUSTOMER' | 'ONE_VENDOR'

export interface CenterOverview {
  days: number
  push?: { sent: number; sent_previous: number; failed: number; muted: number; sent_today: number }
  inApp?: { sent: number; sent_previous: number; personal: number; read: number; broadcasts: number; unread_now: number; sent_today: number }
  otherChannels?: { channel: string; status: string; count: number }[]
  failureReasons?: { reason: string; count: number }[]
  series?: { day: string; push: number; failed: number; inApp: number; muted: number }[]
  reach?: { customers: number; vendors: number; customersWithPush?: number; vendorsWithPush?: number }
  devices?: { recipient_type: Audience; platform: string; active: number; inactive: number; stale: number; added: number }[]
  topEvents?: EventRow[]
  recentSends?: { id: number; action: string; actorName: string | null; actorEmail: string | null; details: string | null; createdAt: string }[]
}

export interface EventRow {
  type: string
  pushSent: number
  pushFailed: number
  pushMuted: number
  inApp: number
  inAppRead: number
  inAppMuted: number
  sms: number
  email: number
  total: number
  lastAt: string | null
  audiences: Audience[]
  templates: ('PUSH' | 'IN_APP')[]
  pushOn: boolean
  inAppOn: boolean
}

export interface FeedRow {
  key: string
  channel: 'PUSH' | 'IN_APP' | 'SMS' | 'EMAIL'
  recipientType: Audience | null
  recipientId: number | null
  recipientName: string | null
  type: string | null
  title: string | null
  message: string | null
  status: string
  errorDetail: string | null
  read: boolean | null
  createdAt: string
}

export interface DeviceRow {
  id: number
  recipientId: number
  recipientType: Audience
  platform: string
  deviceName: string | null
  appVersion: string | null
  active: boolean
  lastSeenAt: string | null
  createdAt: string
  ownerName: string | null
  ownerMobile: string | null
}

export interface Paged<T> { content: T[]; page: number; totalElements: number; totalPages: number }

export interface AudienceCount { kind: AudienceKind; people: number; withPush: number }

/** For STORE searches `devices` carries the store's customer count and `mobile` its address. */
export interface PersonHit { id: number; name: string | null; mobile: string | null; devices: number }

export interface SendResult {
  people: number
  push?: { sent: number; failed: number; total: number }
  inApp?: { sent: number; failed: number; total: number }
}

export function apiMessage(err: unknown, fallback: string): string {
  if (axios.isAxiosError(err)) {
    const d = err.response?.data as { message?: string; error?: string } | undefined
    return d?.message || d?.error || fallback
  }
  return fallback
}

export function useCenterOverview(days: number) {
  return useQuery({
    queryKey: ['notifications', 'center', 'overview', days],
    queryFn: () => axiosInstance.get<CenterOverview>(`${BASE}/overview`, { params: { days } }).then((r) => r.data),
    staleTime: 30_000,
    refetchInterval: 60_000,
    placeholderData: keepPreviousData,
    ...OPTS,
  })
}

export function useEvents(days: number) {
  return useQuery({
    queryKey: ['notifications', 'center', 'events', days],
    queryFn: () => axiosInstance.get<EventRow[]>(`${BASE}/events`, { params: { days } }).then((r) => r.data),
    staleTime: 30_000,
    placeholderData: keepPreviousData,
    ...OPTS,
  })
}

export function useFeed(q: { channel: string; audience: string; status: string; type: string; q: string }, page: number) {
  return useQuery({
    queryKey: ['notifications', 'center', 'feed', q, page],
    queryFn: () => axiosInstance.get<Paged<FeedRow>>(`${BASE}/feed`, {
      params: { channel: q.channel || undefined, audience: q.audience || undefined, status: q.status || undefined, type: q.type || undefined, q: q.q.trim() || undefined, page, size: 30 },
    }).then((r) => r.data),
    placeholderData: keepPreviousData,
    staleTime: 10_000,
    refetchInterval: 30_000,
    ...OPTS,
  })
}

export function useDevices(q: { audience: string; active: string; q: string }, page: number) {
  return useQuery({
    queryKey: ['notifications', 'center', 'devices', q, page],
    queryFn: () => axiosInstance.get<Paged<DeviceRow>>(`${BASE}/devices`, {
      params: { audience: q.audience || undefined, active: q.active === '' ? undefined : q.active === 'true', q: q.q.trim() || undefined, page, size: 30 },
    }).then((r) => r.data),
    placeholderData: keepPreviousData,
    staleTime: 15_000,
    ...OPTS,
  })
}

export function useAudiences(storeId?: number) {
  return useQuery({
    queryKey: ['notifications', 'center', 'audiences', storeId ?? null],
    queryFn: () => axiosInstance.get<AudienceCount[]>(`${BASE}/audiences`, { params: { storeId } }).then((r) => r.data),
    staleTime: 60_000,
    placeholderData: keepPreviousData,
    ...OPTS,
  })
}

export function usePeople(kind: 'USER' | 'VENDOR' | 'STORE', q: string, enabled: boolean) {
  return useQuery({
    queryKey: ['notifications', 'center', 'people', kind, q],
    queryFn: () => axiosInstance.get<PersonHit[]>(`${BASE}/people`, { params: { kind, q } }).then((r) => r.data),
    enabled,
    staleTime: 30_000,
    placeholderData: keepPreviousData,
    ...OPTS,
  })
}

export function useSend() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (body: { audience: AudienceKind; storeId?: number; recipientId?: number; channels: ('PUSH' | 'IN_APP')[]; title: string; message: string }) =>
      axiosInstance.post<SendResult>(`${BASE}/send`, body).then((r) => r.data),
    meta: { suppressError: true },
    onSuccess: () => void qc.invalidateQueries({ queryKey: ['notifications'] }),
  })
}

export function useSwitchEvent() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ type, ...body }: { type: string; push?: boolean; inApp?: boolean }) =>
      axiosInstance.put<{ type: string; pushOn: boolean; inAppOn: boolean }>(`${BASE}/events/${type}`, body).then((r) => r.data),
    meta: { suppressError: true },
    onSuccess: (d) => {
      void qc.invalidateQueries({ queryKey: ['notifications', 'center'] })
      toast.success(!d.pushOn && !d.inAppOn ? 'Switched off — nobody gets this one now.' : 'Saved — takes effect within 20 seconds.')
    },
    onError: (e) => toast.error(apiMessage(e, "Couldn't change it.")),
  })
}

export function useRemoveDevice() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (id: number) => axiosInstance.delete(`/api/admin/notifications/push/devices/${id}`),
    meta: { suppressError: true },
    onSuccess: () => { void qc.invalidateQueries({ queryKey: ['notifications'] }); toast.success('Device removed — it won’t get pushes any more.') },
    onError: (e) => toast.error(apiMessage(e, "Couldn't remove the device.")),
  })
}

/** Custom wording for an automatic message: creates or updates the `{code}_{CHANNEL}` template. */
export function useSaveWording() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async ({ code, channel, name, title, body, existingId }: { code: string; channel: 'PUSH' | 'IN_APP'; name: string; title: string; body: string; existingId?: number }) => {
      if (existingId) return templatesApi.update(existingId, { title, body })
      return templatesApi.create({ code: `${code}_${channel}`, channel, name, title, body })
    },
    meta: { suppressError: true },
    onSuccess: () => { void qc.invalidateQueries({ queryKey: ['notifications'] }); toast.success('Wording saved — used from the next one sent.') },
    onError: (e) => toast.error(apiMessage(e, "Couldn't save the wording.")),
  })
}

/** The saved wording for an event's push and in-app messages, if any. */
export function useWording(code: string | null) {
  return useQuery({
    queryKey: ['notifications', 'center', 'wording', code],
    queryFn: async () => {
      const page = await templatesApi.list(0, 200)
      const find = (ch: string) => page.content.find((t) => t.code.toUpperCase() === `${code}_${ch}`)
      return { PUSH: find('PUSH') ?? null, IN_APP: find('IN_APP') ?? null }
    },
    enabled: !!code,
    staleTime: 0,
    ...OPTS,
  })
}
