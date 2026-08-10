import type { AxiosInstance, AxiosResponse, AxiosError } from 'axios'
import { toast } from 'sonner'
import { useAuthStore } from '@/store/auth-store'
import { APP_ROUTES } from '@/constants/routes/app-routes'
import { ENDPOINTS } from '@/constants/api/endpoints'

interface ApiErrorResponse {
  message?: string
}

export function setupResponseInterceptor(instance: AxiosInstance): void {
  instance.interceptors.response.use(
    (response: AxiosResponse) => response,
    (error: AxiosError<ApiErrorResponse>) => {
      const status = error.response?.status

      if (status === 401) {
        useAuthStore.getState().logout()
        window.location.href = APP_ROUTES.AUTH.LOGIN
        return Promise.reject(error)
      }

      if (status === 403) {
        // PermissionGuard handles page-level access before any fetch fires.
        // A backend 403 on an individual API call should surface as an error in
        // the UI, not a full-page redirect that takes the user away from context.
        return Promise.reject(error)
      }

      if (!error.response) {
        // Auth login owns its own error messages via the mutation's onError
        const requestUrl = error.config?.url ?? ''
        if (requestUrl.includes(ENDPOINTS.AUTH.LOGIN)) {
          return Promise.reject(error)
        }
        if (error.code === 'ECONNABORTED') {
          toast.error('Request timed out. Please try again.')
        } else {
          toast.error('Network error. Check your connection.')
        }
      }

      return Promise.reject(error)
    },
  )
}
