import { useEffect } from 'react'
import { useNavigate } from '@tanstack/react-router'
import type { ReactNode } from 'react'
import { useAuthStore } from '@/store/auth-store'
import { APP_ROUTES } from '@/constants/routes/app-routes'
import { LoadingScreen } from '@/components/common/LoadingScreen'

interface GuestGuardProps {
  children: ReactNode
}

export function GuestGuard({ children }: GuestGuardProps) {
  const { isAuthenticated } = useAuthStore()
  const navigate = useNavigate()

  useEffect(() => {
    if (isAuthenticated) {
      void navigate({ to: APP_ROUTES.DASHBOARD, replace: true })
    }
  }, [isAuthenticated, navigate])

  if (isAuthenticated) {
    return <LoadingScreen />
  }

  return <>{children}</>
}
