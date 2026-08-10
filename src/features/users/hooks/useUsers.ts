import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { usersApi } from '../api/users.api'

export const USER_QUERY_KEYS = {
  all: ['users'] as const,
  list: (page: number, size: number) => ['users', 'list', page, size] as const,
  detail: (id: number) => ['users', 'detail', id] as const,
  subscriptions: (id: number, page: number) => ['users', id, 'subscriptions', page] as const,
  redemptions: (id: number, page: number) => ['users', id, 'redemptions', page] as const,
  transactions: (id: number, page: number) => ['users', id, 'transactions', page] as const,
}

export function useUsers(page: number, size: number) {
  return useQuery({
    queryKey: USER_QUERY_KEYS.list(page, size),
    queryFn: () => usersApi.list(page, size),
    staleTime: 1000 * 60,
    retry: 1,
    meta: { suppressError: true },
  })
}

export function useUserDetails(userId: number | null) {
  return useQuery({
    queryKey: USER_QUERY_KEYS.detail(userId!),
    queryFn: () => usersApi.getById(userId!),
    enabled: userId !== null,
    staleTime: 1000 * 60 * 5,
    retry: 1,
    meta: { suppressError: true },
  })
}

export function useUserSubscriptions(userId: number | null, page: number) {
  return useQuery({
    queryKey: USER_QUERY_KEYS.subscriptions(userId!, page),
    queryFn: () => usersApi.getSubscriptions(userId!, page, 10),
    enabled: userId !== null,
    staleTime: 1000 * 60 * 5,
    retry: 1,
    meta: { suppressError: true },
  })
}

export function useUserRedemptions(userId: number | null, page: number) {
  return useQuery({
    queryKey: USER_QUERY_KEYS.redemptions(userId!, page),
    queryFn: () => usersApi.getRedemptions(userId!, page, 10),
    enabled: userId !== null,
    staleTime: 1000 * 60 * 5,
    retry: 1,
    meta: { suppressError: true },
  })
}

export function useUserTransactions(userId: number | null, page: number) {
  return useQuery({
    queryKey: USER_QUERY_KEYS.transactions(userId!, page),
    queryFn: () => usersApi.getTransactions(userId!, page, 10),
    enabled: userId !== null,
    staleTime: 1000 * 60 * 5,
    retry: 1,
    meta: { suppressError: true },
  })
}

export function useBanUser() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (userId: number) => usersApi.ban(userId),
    meta: { suppressError: true },
    onSuccess: (_data, userId) => {
      toast.success('User has been banned successfully.')
      void queryClient.invalidateQueries({ queryKey: USER_QUERY_KEYS.all })
      void queryClient.invalidateQueries({ queryKey: USER_QUERY_KEYS.detail(userId) })
    },
    onError: () => {
      toast.error('Failed to ban user. Please try again.')
    },
  })
}

export function useUnbanUser() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (userId: number) => usersApi.unban(userId),
    meta: { suppressError: true },
    onSuccess: (_data, userId) => {
      toast.success('User has been unbanned successfully.')
      void queryClient.invalidateQueries({ queryKey: USER_QUERY_KEYS.all })
      void queryClient.invalidateQueries({ queryKey: USER_QUERY_KEYS.detail(userId) })
    },
    onError: () => {
      toast.error('Failed to unban user. Please try again.')
    },
  })
}
