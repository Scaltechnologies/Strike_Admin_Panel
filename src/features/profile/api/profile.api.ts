import { keepPreviousData, useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import axiosInstance from '@/api/axios'
import { ENDPOINTS } from '@/constants/api/endpoints'
import { getTokenExpiry } from '@/core/auth/token'
import { useAuthStore } from '@/store/auth-store'
import type { AdminMeResponseDto } from '@/types/auth/auth'

const BASE = '/api/admin/auth/me'

export interface SignInRow {
  id?: number
  action?: 'ADMIN_LOGIN' | 'ADMIN_LOGIN_FAILED'
  outcome?: string
  ipAddress: string | null
  userAgent: string | null
  details?: string | null
  createdAt: string
}

export interface MyActivityRow {
  id: number
  action: string
  summary: string | null
  entityType: string | null
  entityId: number | null
  storeId?: number | null
  outcome: string | null
  httpMethod?: string | null
  path?: string | null
  details?: string | null
  ipAddress?: string | null
  userAgent?: string | null
  createdAt: string
}

export interface MyOverview {
  days: number
  activity: {
    actions: number; actionsPrevious: number; actionsToday: number; failed: number
    daysActive: number; allTime: number; firstActionAt: string | null; lastActionAt: string | null
  }
  signIns: { signIns: number; signInsPrevious: number; failed: number; failedWeek: number; places: number; devices: number }
  account: {
    passwordChangedAt: string | null
    passwordResetByOtherAt: string | null
    profileUpdatedAt: string | null
    sessionsEndedAt: string | null
    lastFailedSignIn: SignInRow | null
    previousSignIn: SignInRow | null
  }
  series: { day: string; actions: number; signIns: number }[]
  areas: { area: string; count: number }[]
  topActions: { action: string; summary: string | null; count: number; failed: number; lastAt: string }[]
  hours: number[]
  recent: MyActivityRow[]
}

export interface ActivityFilters { page: number; size?: number; q?: string; area?: string; failedOnly?: boolean }

interface FreshSession { message: string; token: string; refreshToken: string; expiresIn: number }

export const profileKeys = {
  all: ['my-account'] as const,
  me: ['my-account', 'me'] as const,
  overview: (days: number) => ['my-account', 'overview', days] as const,
  activity: (f: ActivityFilters) => ['my-account', 'activity', f] as const,
  signIns: ['my-account', 'sign-ins'] as const,
}

export const useMe = () =>
  useQuery({ queryKey: profileKeys.me, queryFn: () => axiosInstance.get<AdminMeResponseDto>(ENDPOINTS.AUTH.ME).then((r) => r.data), staleTime: 60_000 })

export const useMyOverview = (days: number) =>
  useQuery({
    queryKey: profileKeys.overview(days),
    queryFn: () => axiosInstance.get<MyOverview>(`${BASE}/overview`, { params: { days } }).then((r) => r.data),
    placeholderData: keepPreviousData,
    staleTime: 30_000,
  })

export const useMyActivity = (f: ActivityFilters) =>
  useQuery({
    queryKey: profileKeys.activity(f),
    queryFn: () => axiosInstance.get<{ content: MyActivityRow[]; totalElements: number; totalPages: number; page: number }>(`${BASE}/activity`, {
      params: { page: f.page, size: f.size ?? 25, q: f.q || undefined, area: f.area || undefined, failedOnly: f.failedOnly || undefined },
    }).then((r) => r.data),
    placeholderData: keepPreviousData,
  })

export const useMySignIns = () =>
  useQuery({ queryKey: profileKeys.signIns, queryFn: () => axiosInstance.get<SignInRow[]>(`${BASE}/sign-ins`, { params: { limit: 40 } }).then((r) => r.data) })

/** Swap in the token pair the server issued after ending every other session. */
function adoptSession(s: FreshSession) {
  const store = useAuthStore.getState()
  store.setTokens(s.token, s.refreshToken)
  const expiry = getTokenExpiry(s.token)
  if (expiry) store.setSessionExpiry(expiry)
}

export function useSignOutOthers() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: () => axiosInstance.post<FreshSession>(`${BASE}/sign-out-others`).then((r) => r.data),
    meta: { suppressError: true },
    onSuccess: (s) => { adoptSession(s); void qc.invalidateQueries({ queryKey: profileKeys.all }) },
  })
}

export function useChangePassword() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (body: { currentPassword: string; newPassword: string }) =>
      axiosInstance.patch<Partial<FreshSession>>(ENDPOINTS.AUTH.CHANGE_PASSWORD, body).then((r) => r.data),
    meta: { suppressError: true },
    onSuccess: (s) => {
      if (s.token && s.refreshToken) adoptSession(s as FreshSession)
      void qc.invalidateQueries({ queryKey: profileKeys.all })
    },
  })
}
