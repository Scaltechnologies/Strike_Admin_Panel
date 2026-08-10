import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { adminUsersApi, branchesApi } from '../api/branches.api'
import type { BranchRequest } from '../types/branch.types'

export const BRANCH_QUERY_KEYS = {
  all: ['branches'] as const,
  list: (page: number, size: number) => ['branches', 'list', page, size] as const,
  active: ['branches', 'active'] as const,
  detail: (id: number) => ['branches', 'detail', id] as const,
  managers: (id: number) => ['branches', 'managers', id] as const,
  adminUsers: ['admin-users'] as const,
}

const Q = { staleTime: 1000 * 60, retry: 1, meta: { suppressError: true } } as const

export function useBranchesList(page: number, size: number) {
  return useQuery({
    queryKey: BRANCH_QUERY_KEYS.list(page, size),
    queryFn: () => branchesApi.list(page, size),
    ...Q,
  })
}

export function useActiveBranches() {
  return useQuery({
    queryKey: BRANCH_QUERY_KEYS.active,
    queryFn: () => branchesApi.listActive(),
    staleTime: 1000 * 60 * 15,
    retry: 1,
    meta: { suppressError: true },
  })
}

export function useBranchDetail(id: number | null) {
  return useQuery({
    queryKey: BRANCH_QUERY_KEYS.detail(id!),
    queryFn: () => branchesApi.getById(id!),
    enabled: id !== null,
    ...Q,
  })
}

export function useBranchManagers(id: number | null) {
  return useQuery({
    queryKey: BRANCH_QUERY_KEYS.managers(id!),
    queryFn: () => branchesApi.getManagers(id!),
    enabled: id !== null,
    ...Q,
  })
}

export function useAllAdminUsers(enabled: boolean) {
  return useQuery({
    queryKey: BRANCH_QUERY_KEYS.adminUsers,
    queryFn: () => adminUsersApi.list(),
    enabled,
    staleTime: 1000 * 60 * 5,
    retry: 1,
    meta: { suppressError: true },
  })
}

export function useCreateBranch() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (req: BranchRequest) => branchesApi.create(req),
    meta: { suppressError: true },
    onSuccess: () => {
      toast.success('Branch created.')
      void queryClient.invalidateQueries({ queryKey: BRANCH_QUERY_KEYS.all })
    },
    onError: () => {
      toast.error('Failed to create branch.')
    },
  })
}

export function useUpdateBranch() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ id, req }: { id: number; req: Partial<BranchRequest> }) =>
      branchesApi.update(id, req),
    meta: { suppressError: true },
    onSuccess: (_data, { id }) => {
      toast.success('Branch updated.')
      void queryClient.invalidateQueries({ queryKey: BRANCH_QUERY_KEYS.all })
      void queryClient.invalidateQueries({ queryKey: BRANCH_QUERY_KEYS.detail(id) })
    },
    onError: () => {
      toast.error('Failed to update branch.')
    },
  })
}

export function useUpdateBranchRadius() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ id, radiusKm }: { id: number; radiusKm: number }) =>
      branchesApi.updateRadius(id, radiusKm),
    meta: { suppressError: true },
    onSuccess: (_data, { id }) => {
      toast.success('Radius updated.')
      void queryClient.invalidateQueries({ queryKey: BRANCH_QUERY_KEYS.all })
      void queryClient.invalidateQueries({ queryKey: BRANCH_QUERY_KEYS.detail(id) })
    },
    onError: () => {
      toast.error('Failed to update radius.')
    },
  })
}

export function useActivateBranch() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (id: number) => branchesApi.activate(id),
    meta: { suppressError: true },
    onSuccess: (_data, id) => {
      toast.success('Branch activated.')
      void queryClient.invalidateQueries({ queryKey: BRANCH_QUERY_KEYS.all })
      void queryClient.invalidateQueries({ queryKey: BRANCH_QUERY_KEYS.detail(id) })
    },
    onError: () => {
      toast.error('Failed to activate branch.')
    },
  })
}

export function useDeactivateBranch() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (id: number) => branchesApi.deactivate(id),
    meta: { suppressError: true },
    onSuccess: (_data, id) => {
      toast.success('Branch deactivated.')
      void queryClient.invalidateQueries({ queryKey: BRANCH_QUERY_KEYS.all })
      void queryClient.invalidateQueries({ queryKey: BRANCH_QUERY_KEYS.detail(id) })
    },
    onError: () => {
      toast.error('Failed to deactivate branch.')
    },
  })
}

export function useAssignBranchManager() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ branchId, adminId }: { branchId: number; adminId: number }) =>
      branchesApi.assignManager(branchId, adminId),
    meta: { suppressError: true },
    onSuccess: (_data, { branchId }) => {
      toast.success('Manager assigned.')
      void queryClient.invalidateQueries({ queryKey: BRANCH_QUERY_KEYS.managers(branchId) })
    },
    onError: () => {
      toast.error('Failed to assign manager.')
    },
  })
}
