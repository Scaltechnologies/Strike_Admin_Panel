import { useMutation } from '@tanstack/react-query'
import { useNavigate } from '@tanstack/react-router'
import { toast } from 'sonner'
import { authApi } from '../api/auth.api'
import { useAuthStore } from '@/store/auth-store'
import { APP_ROUTES } from '@/constants/routes/app-routes'
import { queryClient } from '@/providers/query-client'

export function useLogout() {
  const navigate = useNavigate()
  const { refreshToken, logout } = useAuthStore()

  return useMutation({
    mutationFn: async () => {
      if (refreshToken) {
        await authApi.logout(refreshToken)
      }
    },

    meta: { suppressError: true },

    onSuccess: () => {
      logout()
      queryClient.clear()
      void navigate({ to: APP_ROUTES.AUTH.LOGIN, replace: true })
    },

    onError: () => {
      // Force logout even if the API call fails
      logout()
      queryClient.clear()
      void navigate({ to: APP_ROUTES.AUTH.LOGIN, replace: true })
      toast.error('Session ended.')
    },
  })
}
