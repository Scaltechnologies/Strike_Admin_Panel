import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { bannersApi } from '../api/banners.api'
import type { CreateBannerRequest, UpdateBannerRequest } from '../types/banner.types'

export const BANNER_QUERY_KEYS = {
  all: ['banners'] as const,
  list: (page: number, size: number) => ['banners', 'list', page, size] as const,
  stats: ['banners', 'stats'] as const,
  detail: (id: number) => ['banners', 'detail', id] as const,
}

const DEFAULTS = { staleTime: 1000 * 30, retry: 1, meta: { suppressError: true } } as const

export function useBannerList(page: number, size: number) {
  return useQuery({
    queryKey: BANNER_QUERY_KEYS.list(page, size),
    queryFn: () => bannersApi.list(page, size),
    ...DEFAULTS,
  })
}

export function useBannerStats() {
  return useQuery({
    queryKey: BANNER_QUERY_KEYS.stats,
    queryFn: () => bannersApi.getStats(),
    staleTime: 1000 * 60,
    retry: 1,
    meta: { suppressError: true },
  })
}

export function useCreateBanner() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (payload: CreateBannerRequest) => bannersApi.create(payload),
    meta: { suppressError: true },
    onSuccess: () => {
      toast.success('Banner created successfully.')
      void qc.invalidateQueries({ queryKey: BANNER_QUERY_KEYS.all })
    },
    onError: () => toast.error('Failed to create banner.'),
  })
}

export function useUpdateBanner() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ id, payload }: { id: number; payload: UpdateBannerRequest }) =>
      bannersApi.update(id, payload),
    meta: { suppressError: true },
    onSuccess: () => {
      toast.success('Banner updated successfully.')
      void qc.invalidateQueries({ queryKey: BANNER_QUERY_KEYS.all })
    },
    onError: () => toast.error('Failed to update banner.'),
  })
}

export function useDeleteBanner() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (id: number) => bannersApi.delete(id),
    meta: { suppressError: true },
    onSuccess: () => {
      toast.success('Banner deleted.')
      void qc.invalidateQueries({ queryKey: BANNER_QUERY_KEYS.all })
    },
    onError: () => toast.error('Failed to delete banner.'),
  })
}

export function useToggleBanner() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ id, active }: { id: number; active: boolean }) =>
      active ? bannersApi.deactivate(id) : bannersApi.activate(id),
    meta: { suppressError: true },
    onSuccess: (_, vars) => {
      toast.success(vars.active ? 'Banner deactivated.' : 'Banner activated.')
      void qc.invalidateQueries({ queryKey: BANNER_QUERY_KEYS.all })
    },
    onError: () => toast.error('Failed to update banner status.'),
  })
}
