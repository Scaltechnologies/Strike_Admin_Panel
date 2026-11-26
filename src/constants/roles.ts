export const ROLES = {
  /** Full control, including creating and managing other admin logins. */
  SUPER_ADMIN: 'SUPER_ADMIN',
  /** Only the sections a Super Admin ticks for them (see constants/sections.ts). */
  SUB_ADMIN: 'SUB_ADMIN',
} as const

export type Role = (typeof ROLES)[keyof typeof ROLES]

export const ROLE_LABELS: Record<string, string> = {
  SUPER_ADMIN: 'Super Admin',
  SUB_ADMIN: 'Admin',
  ADMIN: 'Admin (legacy)',
  MANAGER: 'Branch Manager',
}

