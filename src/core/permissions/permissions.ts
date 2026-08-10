import { useAuthStore } from '@/store/auth-store'
import type { Permission } from '@/constants/permissions'

export function usePermission(permission: Permission): boolean {
  const user = useAuthStore.getState().user
  if (!user) return false
  if (user.role === 'SUPER_ADMIN') return true
  return user.permissions.includes(permission)
}

export function useAnyPermission(permissions: Permission[]): boolean {
  const user = useAuthStore.getState().user
  if (!user) return false
  if (user.role === 'SUPER_ADMIN') return true
  return permissions.some((p) => user.permissions.includes(p))
}

export function useAllPermissions(permissions: Permission[]): boolean {
  const user = useAuthStore.getState().user
  if (!user) return false
  if (user.role === 'SUPER_ADMIN') return true
  return permissions.every((p) => user.permissions.includes(p))
}

export function checkPermission(userPermissions: string[], required: Permission): boolean {
  return userPermissions.includes(required)
}
