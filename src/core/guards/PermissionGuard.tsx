import type { ReactNode } from 'react'
import type { Permission } from '@/constants/permissions'
import { useAuthStore } from '@/store/auth-store'
import { AccessDenied } from '@/components/common/AccessDenied'

interface PermissionGuardProps {
  children: ReactNode
  permission: Permission
  fallback?: ReactNode
}

export function PermissionGuard({ children, permission, fallback }: PermissionGuardProps) {
  const { user } = useAuthStore()

  // SUPER_ADMIN has all permissions regardless of stored permissions array
  const hasPermission =
    user?.role === 'SUPER_ADMIN' || (user?.permissions.includes(permission) ?? false)

  if (!hasPermission) {
    return fallback ? <>{fallback}</> : <AccessDenied />
  }

  return <>{children}</>
}

interface RoleGuardProps {
  children: ReactNode
  roles: string[]
  fallback?: ReactNode
}

export function RoleGuard({ children, roles, fallback }: RoleGuardProps) {
  const { user } = useAuthStore()

  const hasRole = user ? roles.includes(user.role) : false

  if (!hasRole) {
    return fallback ? <>{fallback}</> : <AccessDenied />
  }

  return <>{children}</>
}
