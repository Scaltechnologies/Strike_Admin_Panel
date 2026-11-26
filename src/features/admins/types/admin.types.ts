import type { AdminMeResponseDto } from '@/types/auth/auth'

export type AdminAccount = AdminMeResponseDto

/** Roles a Super Admin can give to a panel login. */
export type AdminAccountRole = 'SUPER_ADMIN' | 'SUB_ADMIN'

export interface CreateAdminPayload {
  name: string
  email: string
  password: string
  role: AdminAccountRole
  phone?: string
}

export interface UpdateAdminPayload {
  name: string
  email: string
  role: AdminAccountRole
  phone?: string
}

export interface UpdateMyProfilePayload {
  name: string
  email: string
  phone?: string
  /** Required by the backend only when the email changes. */
  currentPassword?: string
}
