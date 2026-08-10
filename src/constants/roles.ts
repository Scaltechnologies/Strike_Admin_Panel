export const ROLES = {
  SUPER_ADMIN: 'SUPER_ADMIN',
} as const

export type Role = (typeof ROLES)[keyof typeof ROLES]

export const ROLE_LABELS: Record<string, string> = {
  SUPER_ADMIN: 'Super Admin',
}
