import type { Role } from '@/constants/roles'
import { ROLE_LABELS } from '@/constants/roles'
import { useAuthStore } from '@/store/auth-store'

export function getUserRole(): Role | null {
  return useAuthStore.getState().user?.role ?? null
}

export function hasRole(role: Role): boolean {
  return getUserRole() === role
}

export function getRoleLabel(role: string): string {
  return ROLE_LABELS[role] ?? role
}
