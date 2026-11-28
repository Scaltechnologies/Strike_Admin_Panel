import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import axios from 'axios'
import { toast } from 'sonner'
import axiosInstance from '@/api/axios'
import { bannersApi } from './banners.api'
import type { BannerPage, BannerResponse } from '../types/banner.types'

const BASE = '/api/admin/banners'
const OPTS = { retry: 1, meta: { suppressError: true } } as const

export function apiMessage(err: unknown, fallback: string): string {
  if (err instanceof Error && !axios.isAxiosError(err)) return err.message || fallback
  if (axios.isAxiosError(err)) {
    const d = err.response?.data as { message?: string; error?: string } | undefined
    return d?.message || d?.error || fallback
  }
  return fallback
}

/** Every banner, ordered the way the carousel orders them. */
export function useAllBanners() {
  return useQuery({
    queryKey: ['banners', 'all'],
    queryFn: () => axiosInstance.get<BannerPage>(BASE, { params: { page: 0, size: 200 } }).then((r) =>
      [...r.data.content].sort((a, b) => (a.displayOrder ?? 0) - (b.displayOrder ?? 0) || a.id - b.id)),
    staleTime: 15_000,
    ...OPTS,
  })
}

/** Exactly what the customer app gets today (same public endpoint the app calls). */
export function useTodayBanners() {
  return useQuery({
    queryKey: ['banners', 'today'],
    queryFn: () => axiosInstance.get<BannerResponse[]>(`${BASE}/today`).then((r) => r.data),
    staleTime: 15_000,
    ...OPTS,
  })
}

export interface BannerDraft {
  title: string
  description: string
  validFrom: string
  validUntil: string
  isActive: boolean
}

export function useSaveBanner() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async ({ id, draft, file, imageUrl, push }: { id?: number; draft: BannerDraft; file: File | null; imageUrl?: string; push: boolean }) => {
      const url = file ? await bannersApi.uploadImage(file) : imageUrl
      if (!url) throw new Error('Choose an image for the banner.')
      const body = {
        title: draft.title.trim(),
        description: draft.description.trim() || undefined,
        imageUrl: url,
        ...(draft.validFrom ? { validFrom: draft.validFrom } : id ? { noStartDate: true } : {}),
        ...(draft.validUntil ? { validUntil: draft.validUntil } : id ? { noEndDate: true } : {}),
        isActive: push ? false : draft.isActive,
      }
      const saved = id
        ? (await axiosInstance.put<BannerResponse>(`${BASE}/${id}`, body)).data
        : (await axiosInstance.post<BannerResponse>(BASE, body)).data
      // Switching on through activate is what sends the optional push to every customer.
      if (push) await axiosInstance.patch(`${BASE}/${saved.id}/activate`, null, { params: { notify: true } })
      return saved
    },
    meta: { suppressError: true },
    onSuccess: (_d, v) => {
      void qc.invalidateQueries({ queryKey: ['banners'] })
      toast.success(v.id ? 'Banner saved.' : v.push ? 'Banner is live — customers are getting a push.' : 'Banner added.')
    },
  })
}

function useAct<T>(fn: (v: T) => Promise<unknown>, ok: string | ((v: T) => string), fail: string) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: fn,
    meta: { suppressError: true },
    onSuccess: (_d, v) => { void qc.invalidateQueries({ queryKey: ['banners'] }); toast.success(typeof ok === 'function' ? ok(v) : ok) },
    onError: (e) => toast.error(apiMessage(e, fail)),
  })
}

export const useToggleBanner = () => useAct(
  ({ id, on, push }: { id: number; on: boolean; push?: boolean }) =>
    axiosInstance.patch(`${BASE}/${id}/${on ? 'activate' : 'deactivate'}`, null, { params: on ? { notify: !!push } : undefined }),
  ({ on, push }) => (on ? (push ? 'Switched on — push sent to every customer.' : 'Banner switched on.') : 'Banner switched off — it’s gone from the app.'),
  "Couldn't change the banner.",
)
export const useReorderBanners = () => useAct(
  (ids: number[]) => axiosInstance.patch(`${BASE}/reorder`, { ids }),
  'New order saved — the app shows it straight away.',
  "Couldn't save the new order.",
)
export const useDuplicateBanner = () => useAct(
  (id: number) => axiosInstance.post(`${BASE}/${id}/duplicate`),
  'Copy made — it’s switched off until you turn it on.',
  "Couldn't copy the banner.",
)
export const useDeleteBanner = () => useAct(
  (id: number) => axiosInstance.delete(`${BASE}/${id}`),
  'Banner deleted.',
  "Couldn't delete the banner.",
)
