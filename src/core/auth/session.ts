import { useAuthStore } from '@/store/auth-store'
import { isTokenExpired } from './token'

export function isSessionValid(): boolean {
  const { accessToken, isAuthenticated } = useAuthStore.getState()
  if (!isAuthenticated || !accessToken) return false
  return !isTokenExpired(accessToken)
}

export function getSessionUser() {
  return useAuthStore.getState().user
}

export function clearSession(): void {
  useAuthStore.getState().clearSession()
}

export function refreshSession(accessToken: string, refreshToken?: string): void {
  useAuthStore.getState().setTokens(accessToken, refreshToken)
}
