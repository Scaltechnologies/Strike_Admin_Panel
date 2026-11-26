import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { adminsApi } from '../api/admins.api'
import type { CreateAdminPayload, UpdateAdminPayload } from '../types/admin.types'

const QUERY_KEY = ['admin-accounts'] as const

/** The backend returns readable reasons (e.g. "Another admin already uses …"), so show them as-is. */
export function apiErrorMessage(err: unknown, fallback: string): string {
  const data = (err as { response?: { data?: { message?: string; errors?: Record<string, string> } } })
    ?.response?.data
  const fieldError = data?.errors ? Object.values(data.errors)[0] : undefined
  return fieldError || data?.message || fallback
}

export function useAdminList() {
  return useQuery({
    queryKey: QUERY_KEY,
    queryFn: adminsApi.list,
    staleTime: 1000 * 30,
    retry: 1,
  })
}

export function useCreateAdmin() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (payload: CreateAdminPayload) => adminsApi.create(payload),
    meta: { suppressError: true },
    onSuccess: (admin) => {
      toast.success(`Admin login created for ${admin.email}.`)
      void qc.invalidateQueries({ queryKey: QUERY_KEY })
    },
    onError: (err) => toast.error(apiErrorMessage(err, 'Failed to create admin.')),
  })
}

export function useUpdateAdmin() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ id, payload }: { id: number; payload: UpdateAdminPayload }) => adminsApi.update(id, payload),
    meta: { suppressError: true },
    onSuccess: () => {
      toast.success('Admin updated.')
      void qc.invalidateQueries({ queryKey: QUERY_KEY })
    },
    onError: (err) => toast.error(apiErrorMessage(err, 'Failed to update admin.')),
  })
}

export function useResetAdminPassword() {
  return useMutation({
    mutationFn: ({ id, newPassword }: { id: number; newPassword: string }) =>
      adminsApi.resetPassword(id, newPassword),
    meta: { suppressError: true },
    onSuccess: () => toast.success('Password updated. Share the new password with the admin.'),
    onError: (err) => toast.error(apiErrorMessage(err, 'Failed to update password.')),
  })
}

export function useSetAdminActive() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ id, active }: { id: number; active: boolean }) => adminsApi.setActive(id, active),
    meta: { suppressError: true },
    onSuccess: (admin) => {
      toast.success(admin.active ? 'Admin enabled.' : 'Admin disabled. They can no longer sign in.')
      void qc.invalidateQueries({ queryKey: QUERY_KEY })
    },
    onError: (err) => toast.error(apiErrorMessage(err, 'Failed to change admin status.')),
  })
}
