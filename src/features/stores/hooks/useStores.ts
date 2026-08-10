import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { branchesApi, storesApi } from '../api/stores.api'
import type { StoreFilters, StoreStatus } from '../types/store.types'

export const STORE_QUERY_KEYS = {
  all: ['stores'] as const,
  list: (page: number, size: number, filters: StoreFilters) =>
    ['stores', 'list', page, size, filters] as const,
  byVendor: (vendorId: number) => ['stores', 'byVendor', vendorId] as const,
  branches: ['branches', 'active'] as const,
}

const QUERY_DEFAULTS = {
  staleTime: 1000 * 60 * 5,
  retry: 1,
  meta: { suppressError: true },
} as const

export function useStores(page: number, size: number, filters: StoreFilters) {
  return useQuery({
    queryKey: STORE_QUERY_KEYS.list(page, size, filters),
    queryFn: () => storesApi.list(page, size, filters),
    staleTime: 1000 * 60,
    retry: 1,
    meta: { suppressError: true },
  })
}

export function useStoreByVendor(vendorId: number | null) {
  return useQuery({
    queryKey: STORE_QUERY_KEYS.byVendor(vendorId!),
    queryFn: () => storesApi.getByVendor(vendorId!),
    enabled: vendorId !== null,
    ...QUERY_DEFAULTS,
  })
}

export function useActiveBranches() {
  return useQuery({
    queryKey: STORE_QUERY_KEYS.branches,
    queryFn: () => branchesApi.listActive(),
    staleTime: 1000 * 60 * 15,
    retry: 1,
    meta: { suppressError: true },
  })
}

export function useUpdateStoreStatus() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ storeId, status }: { storeId: number; status: StoreStatus }) =>
      storesApi.updateStatus(storeId, status),
    meta: { suppressError: true },
    onSuccess: () => {
      toast.success('Store status updated.')
      void queryClient.invalidateQueries({ queryKey: STORE_QUERY_KEYS.all })
    },
    onError: () => {
      toast.error('Failed to update store status.')
    },
  })
}

export function useUpdateStoreManager() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({
      storeId,
      managerName,
      managerPhone,
    }: {
      storeId: number
      managerName?: string
      managerPhone?: string
    }) => storesApi.updateManager(storeId, { managerName, managerPhone }),
    meta: { suppressError: true },
    onSuccess: () => {
      toast.success('Store manager updated.')
      void queryClient.invalidateQueries({ queryKey: STORE_QUERY_KEYS.all })
    },
    onError: () => {
      toast.error('Failed to update store manager.')
    },
  })
}
