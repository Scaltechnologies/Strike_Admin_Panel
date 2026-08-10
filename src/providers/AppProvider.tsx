import type { ReactNode } from 'react'
import { Toaster } from 'sonner'
import { ThemeProvider } from '@/core/theme/theme-provider'
import { QueryProvider } from './QueryProvider'

interface AppProviderProps {
  children: ReactNode
}

export function AppProvider({ children }: AppProviderProps) {
  return (
    <ThemeProvider>
      <QueryProvider>
        <Toaster
          richColors
          position="top-right"
          toastOptions={{ duration: 4_000 }}
          expand
        />
        {children}
      </QueryProvider>
    </ThemeProvider>
  )
}
