import type { Role } from '@/constants/roles'

export interface AdminUser {
  id: string
  name: string
  email: string
  phone?: string
  avatar?: string
  role: Role
  permissions: string[]
  branchId?: string
  isActive?: boolean
  lastLoginAt?: string
  createdAt?: string
  updatedAt?: string
}

export interface AuthTokens {
  accessToken: string
  refreshToken?: string
  expiresIn?: number
}

export interface LoginCredentials {
  email: string
  password: string
  rememberMe?: boolean
}

export interface DecodedToken {
  sub: string
  email: string
  role: string
  type: string
  permissions?: string
  branchId?: number
  iat: number
  exp: number
}

// ── Backend DTO shapes (raw responses from the API) ───────────────────────────

export interface AdminLoginResponseDto {
  adminId: number
  email: string
  name: string
  role: string
  branchId: number | null
  permissions: string | null
  token: string
  refreshToken: string
  expiresIn: number
}

export interface AdminRefreshResponseDto {
  token: string
  refreshToken: string
  expiresIn: number
}

export interface AdminMeResponseDto {
  id: number
  email: string
  name: string
  role: string
  active: boolean
  branchId: number | null
  permissions: string | null
  phone: string | null
  lastLoginAt: string | null
  createdAt: string
  updatedAt: string
}

export interface ChangePasswordRequest {
  currentPassword: string
  newPassword: string
}

export interface AdminRegisterRequest {
  email: string
  password: string
  name: string
  role: string
  permissions?: string
  branchId?: number
  phone?: string
}
