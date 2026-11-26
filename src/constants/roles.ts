export const ROLES = {
  /** Full control, including creating and managing other admin logins. */
  SUPER_ADMIN: 'SUPER_ADMIN',
  /** Every admin screen except managing other admin logins. */
  SUB_ADMIN: 'SUB_ADMIN',
} as const

export type Role = (typeof ROLES)[keyof typeof ROLES]

export const ROLE_LABELS: Record<string, string> = {
  SUPER_ADMIN: 'Super Admin',
  SUB_ADMIN: 'Admin',
  ADMIN: 'Admin (legacy)',
  MANAGER: 'Branch Manager',
}

/** Roles that can use every admin screen (backend: hasAnyRole('SUPER_ADMIN', 'SUB_ADMIN')). */
export function hasFullAccess(role: string | undefined | null): boolean {
  return role === ROLES.SUPER_ADMIN || role === ROLES.SUB_ADMIN
}
