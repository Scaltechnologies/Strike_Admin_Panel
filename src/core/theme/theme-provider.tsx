import { useEffect, useState } from 'react'
import type { ReactNode } from 'react'
import { THEME, type Theme } from '@/constants/theme'
import { applyTheme, getStoredTheme, resolveTheme } from './theme'
import { ThemeContext } from './theme-context'

interface ThemeProviderProps {
  children: ReactNode
}

export function ThemeProvider({ children }: ThemeProviderProps) {
  const [theme, setThemeState] = useState<Theme>(getStoredTheme)
  const [resolvedTheme, setResolvedTheme] = useState<'light' | 'dark'>(() =>
    resolveTheme(getStoredTheme()),
  )

  const setTheme = (newTheme: Theme) => {
    setThemeState(newTheme)
    applyTheme(newTheme)
    setResolvedTheme(resolveTheme(newTheme))
  }

  useEffect(() => {
    applyTheme(theme)
    if (theme !== THEME.SYSTEM) return

    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)')
    const handleChange = () => {
      applyTheme(THEME.SYSTEM)
      setResolvedTheme(mediaQuery.matches ? 'dark' : 'light')
    }
    mediaQuery.addEventListener('change', handleChange)
    return () => mediaQuery.removeEventListener('change', handleChange)
  }, [theme])

  return (
    <ThemeContext.Provider value={{ theme, resolvedTheme, setTheme }}>
      {children}
    </ThemeContext.Provider>
  )
}
