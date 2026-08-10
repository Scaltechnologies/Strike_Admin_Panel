import { useMutation } from '@tanstack/react-query'
import { useNavigate } from '@tanstack/react-router'
import type { AxiosError } from 'axios'
import { toast } from 'sonner'
import { authApi } from '../api/auth.api'
import { mapLoginResponseToUser } from '@/utils/helpers/auth-mapper'
import { useAuthStore } from '@/store/auth-store'
import { APP_ROUTES } from '@/constants/routes/app-routes'
import { getTokenExpiry } from '@/core/auth/token'
import type { LoginCredentials } from '@/types/auth/auth'

interface BackendError {
  message?: string
  error?: string
}

export function useLogin() {
  const navigate = useNavigate()
  const { login, setRememberMe, setSessionExpiry } = useAuthStore()

  return useMutation({
    mutationFn: (credentials: LoginCredentials) =>
      authApi.login({ email: credentials.email, password: credentials.password }),

    meta: { suppressError: true },

    onSuccess: (data, variables) => {
      const user = mapLoginResponseToUser(data)
      login(user, data.token, data.refreshToken)
      setRememberMe(variables.rememberMe ?? false)

      const expiry = getTokenExpiry(data.token)
      if (expiry) setSessionExpiry(expiry)

      void navigate({ to: APP_ROUTES.DASHBOARD, replace: true })
      toast.success(`Welcome back, ${user.name}!`)
    },

    onError: (error: unknown) => {
      const axiosError = error as AxiosError<BackendError>
      if (!axiosError.response) {
        if (axiosError.code === 'ECONNABORTED') {
          toast.error('Request timed out. Please try again.')
        } else {
          toast.error('Unable to connect to server. Please check your connection.')
        }
        return
      }
      const message =
        axiosError.response.data?.message ?? 'Login failed. Please check your credentials.'
      toast.error(message)
    },
  })
}
