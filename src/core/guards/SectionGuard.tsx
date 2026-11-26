import { useEffect, type ReactNode } from 'react'
import { Navigate, useRouterState } from '@tanstack/react-router'
import { useQuery } from '@tanstack/react-query'
import { useAuthStore } from '@/store/auth-store'
import { AccessDenied } from '@/components/common/AccessDenied'
import { ROLES } from '@/constants/roles'
import { SECTIONS, sectionForPath } from '@/constants/sections'
import { authApi } from '@/features/auth/api/auth.api'
import { mapAdminResponseToUser } from '@/utils/helpers/auth-mapper'
import type { AdminUser } from '@/types/auth/auth'

/** Pages only a Super Admin may open, whatever sections they have. */
const SUPER_ADMIN_ONLY_PATHS = ['/admins', '/branches']

function canOpenSection(user: AdminUser, code: string): boolean {
  return user.role === ROLES.SUPER_ADMIN || user.permissions.includes(code)
}

/** First page this admin is allowed to open, used instead of a Dashboard they can't see. */
function firstAllowedPath(user: AdminUser): string | undefined {
  return SECTIONS.find((s) => canOpenSection(user, s.code))?.paths[0]
}

/**
 * Keeps the signed-in admin's role and sections in sync with the server, so a Super Admin's
 * changes (or disabling them) show up without the admin signing out and in again.
 */
function useSyncCurrentAdmin() {
  const updateUser = useAuthStore((s) => s.updateUser)
  const { data } = useQuery({
    queryKey: ['auth', 'me'],
    queryFn: authApi.me,
    staleTime: 60_000,
    refetchOnWindowFocus: true,
    retry: false,
    meta: { suppressError: true },
  })

  useEffect(() => {
    if (!data) return
    const fresh = mapAdminResponseToUser(data)
    updateUser({
      role: fresh.role,
      permissions: fresh.permissions,
      name: fresh.name,
      email: fresh.email,
      phone: fresh.phone,
      isActive: fresh.isActive,
    })
  }, [data, updateUser])
}

/**
 * Blocks pages outside the admin's sections. The backend enforces the same rules; this just
 * shows a clear "Access Denied" instead of a page full of failed requests.
 */
export function SectionGuard({ children }: { children: ReactNode }) {
  useSyncCurrentAdmin()
  const user = useAuthStore((s) => s.user)
  const pathname = useRouterState({ select: (s) => s.location.pathname })

  if (!user) return <>{children}</>
  if (user.role === ROLES.SUPER_ADMIN) return <>{children}</>

  if (SUPER_ADMIN_ONLY_PATHS.some((p) => pathname === p || pathname.startsWith(`${p}/`))) {
    return <AccessDenied message="Only Super Admins can open this page." />
  }

  const section = sectionForPath(pathname)
  if (!section || canOpenSection(user, section)) return <>{children}</>

  // Landing on a Dashboard they don't have (e.g. right after login): go to a page they do have.
  if (pathname === '/dashboard') {
    const fallback = firstAllowedPath(user)
    if (fallback) return <Navigate to={fallback} replace />
    return <AccessDenied message="Your account hasn't been given access to any section yet. Ask a Super Admin." />
  }

  return <AccessDenied message="You don't have access to this section. Ask a Super Admin if you need it." />
}
