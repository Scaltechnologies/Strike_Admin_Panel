import type { AxiosInstance, InternalAxiosRequestConfig } from 'axios'
import { useAuthStore } from '@/store/auth-store'
import { getBearerHeader } from '@/core/auth/token'

export function setupRequestInterceptor(instance: AxiosInstance): void {
  instance.interceptors.request.use(
    (config: InternalAxiosRequestConfig) => {
      const { accessToken } = useAuthStore.getState()
      if (accessToken) {
        config.headers.Authorization = getBearerHeader(accessToken)
      }
      return config
    },
    (error: unknown) => Promise.reject(error),
  )
}
