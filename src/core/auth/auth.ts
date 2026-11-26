import { useAuthStore } from '@/store/auth-store'
import type { AdminUser } from '@/types/auth/auth'
import type { Role } from '@/constants/roles'
import { ROLES } from '@/constants/roles'

export function getCurrentUser(): AdminUser | null {
  return useAuthStore.getState().user
}

export function getAccessToken(): string | null {
  return useAuthStore.getState().accessToken
}

export function isAuthenticated(): boolean {
  return useAuthStore.getState().isAuthenticated
}

export function hasPermission(permission: string): boolean {
  const user = useAuthStore.getState().user
  if (!user) return false
  if (user.role === ROLES.SUPER_ADMIN) return true
  return user.permissions.includes(permission)
}

export function hasAnyPermission(permissions: string[]): boolean {
  const user = useAuthStore.getState().user
  if (!user) return false
  if (user.role === ROLES.SUPER_ADMIN) return true
  return permissions.some((p) => user.permissions.includes(p))
}

export function hasAllPermissions(permissions: string[]): boolean {
  const user = useAuthStore.getState().user
  if (!user) return false
  if (user.role === ROLES.SUPER_ADMIN) return true
  return permissions.every((p) => user.permissions.includes(p))
}

export function hasRole(role: Role): boolean {
  const user = useAuthStore.getState().user
  if (!user) return false
  return user.role === role
}

export function hasMinimumRole(minimumRole: Role): boolean {
  void minimumRole
  return useAuthStore.getState().isAuthenticated
}

export function isSuperAdmin(): boolean {
  const user = useAuthStore.getState().user
  return user?.role === ROLES.SUPER_ADMIN
}
