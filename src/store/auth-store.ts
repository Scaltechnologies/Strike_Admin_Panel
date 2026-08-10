import { create } from 'zustand'
import { persist, createJSONStorage } from 'zustand/middleware'
import type { AdminUser } from '@/types/auth/auth'
import { STORAGE_KEYS } from '@/constants/storage/storage-keys'

interface AuthState {
  accessToken: string | null
  refreshToken: string | null
  user: AdminUser | null
  isAuthenticated: boolean
  isLoading: boolean
  rememberMe: boolean
  sessionExpiresAt: number | null
}

interface AuthActions {
  login: (user: AdminUser, accessToken: string, refreshToken?: string) => void
  logout: () => void
  updateUser: (updates: Partial<AdminUser>) => void
  setTokens: (accessToken: string, refreshToken?: string) => void
  clearSession: () => void
  setLoading: (loading: boolean) => void
  setRememberMe: (value: boolean) => void
  setSessionExpiry: (expiresAt: number) => void
}

type AuthStore = AuthState & AuthActions

const initialState: AuthState = {
  accessToken: null,
  refreshToken: null,
  user: null,
  isAuthenticated: false,
  isLoading: false,
  rememberMe: false,
  sessionExpiresAt: null,
}

export const useAuthStore = create<AuthStore>()(
  persist(
    (set) => ({
      ...initialState,

      login: (user, accessToken, refreshToken) =>
        set({
          user,
          accessToken,
          refreshToken: refreshToken ?? null,
          isAuthenticated: true,
          isLoading: false,
        }),

      logout: () => set({ ...initialState }),

      updateUser: (updates) =>
        set((state) => ({
          user: state.user ? { ...state.user, ...updates } : null,
        })),

      setTokens: (accessToken, refreshToken) =>
        set({ accessToken, refreshToken: refreshToken ?? null }),

      clearSession: () => set({ ...initialState }),

      setLoading: (loading) => set({ isLoading: loading }),

      setRememberMe: (value) => set({ rememberMe: value }),

      setSessionExpiry: (expiresAt) => set({ sessionExpiresAt: expiresAt }),
    }),
    {
      name: STORAGE_KEYS.AUTH_STORE,
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({
        accessToken: state.accessToken,
        refreshToken: state.refreshToken,
        user: state.user,
        isAuthenticated: state.isAuthenticated,
        rememberMe: state.rememberMe,
        sessionExpiresAt: state.sessionExpiresAt,
      }),
    },
  ),
)
