import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { apiKeysApi } from '../api/api-keys.api'
import type { CreateApiKeyRequest } from '../types/api-key.types'

export const API_KEY_QUERY_KEYS = {
  all: ['api-keys'] as const,
  list: (page: number, size: number) => ['api-keys', 'list', page, size] as const,
  stats: ['api-keys', 'stats'] as const,
}

const DEFAULTS = { staleTime: 1000 * 30, retry: 1, meta: { suppressError: true } } as const

export function useApiKeyList(page: number, size: number) {
  return useQuery({
    queryKey: API_KEY_QUERY_KEYS.list(page, size),
    queryFn: () => apiKeysApi.list(page, size),
    ...DEFAULTS,
  })
}

export function useApiKeyStats() {
  return useQuery({
    queryKey: API_KEY_QUERY_KEYS.stats,
    queryFn: () => apiKeysApi.getStats(),
    staleTime: 1000 * 60,
    retry: 1,
    meta: { suppressError: true },
  })
}

export function useCreateApiKey() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (payload: CreateApiKeyRequest) => apiKeysApi.create(payload),
    meta: { suppressError: true },
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: API_KEY_QUERY_KEYS.all })
    },
    onError: () => toast.error('Failed to create API key.'),
  })
}

export function useRevokeApiKey() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (id: number) => apiKeysApi.revoke(id),
    meta: { suppressError: true },
    onSuccess: () => {
      toast.success('API key revoked.')
      void qc.invalidateQueries({ queryKey: API_KEY_QUERY_KEYS.all })
    },
    onError: () => toast.error('Failed to revoke API key.'),
  })
}

export function useDeleteApiKey() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (id: number) => apiKeysApi.delete(id),
    meta: { suppressError: true },
    onSuccess: () => {
      toast.success('API key deleted.')
      void qc.invalidateQueries({ queryKey: API_KEY_QUERY_KEYS.all })
    },
    onError: () => toast.error('Failed to delete API key.'),
  })
}
