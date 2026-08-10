import type { Role } from '@/constants/roles'
import { ROLE_LABELS } from '@/constants/roles'
import { useAuthStore } from '@/store/auth-store'

export function getUserRole(): Role | null {
  return useAuthStore.getState().user?.role ?? null
}

export function hasRole(role: Role): boolean {
  return getUserRole() === role
}

export function hasMinimumRole(_minimum: Role): boolean {
  return useAuthStore.getState().isAuthenticated
}

export function getRoleLabel(role: string): string {
  return ROLE_LABELS[role] ?? role
}

export function isHigherRole(_roleA: Role, _roleB: Role): boolean {
  return false
}
