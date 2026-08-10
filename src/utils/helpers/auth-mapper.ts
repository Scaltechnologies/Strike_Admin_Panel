import type { AdminUser, AdminLoginResponseDto, AdminMeResponseDto } from '@/types/auth/auth'
import type { Role } from '@/constants/roles'

function parsePermissions(raw: string | null | undefined): string[] {
  if (!raw) return []
  return raw
    .split(',')
    .map((p) => p.trim())
    .filter(Boolean)
}

export function mapLoginResponseToUser(dto: AdminLoginResponseDto): AdminUser {
  return {
    id: String(dto.adminId),
    email: dto.email,
    name: dto.name,
    role: dto.role as Role,
    permissions: parsePermissions(dto.permissions),
    branchId: dto.branchId != null ? String(dto.branchId) : undefined,
    isActive: true,
  }
}

export function mapAdminResponseToUser(dto: AdminMeResponseDto): AdminUser {
  return {
    id: String(dto.id),
    email: dto.email,
    name: dto.name,
    phone: dto.phone ?? undefined,
    role: dto.role as Role,
    permissions: parsePermissions(dto.permissions),
    branchId: dto.branchId != null ? String(dto.branchId) : undefined,
    isActive: dto.active,
    lastLoginAt: dto.lastLoginAt ?? undefined,
    createdAt: dto.createdAt,
    updatedAt: dto.updatedAt,
  }
}
