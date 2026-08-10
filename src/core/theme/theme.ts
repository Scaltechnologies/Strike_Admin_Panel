import { STORAGE_KEYS } from '@/constants/storage/storage-keys'
import { THEME, type Theme } from '@/constants/theme'

export function getStoredTheme(): Theme {
  try {
    const stored = localStorage.getItem(STORAGE_KEYS.THEME)
    if (stored === THEME.LIGHT || stored === THEME.DARK || stored === THEME.SYSTEM) {
      return stored
    }
  } catch {
    // localStorage unavailable
  }
  return THEME.SYSTEM
}

export function getSystemTheme(): 'light' | 'dark' {
  return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'
}

export function resolveTheme(theme: Theme): 'light' | 'dark' {
  if (theme === THEME.SYSTEM) return getSystemTheme()
  return theme
}

export function applyTheme(theme: Theme): void {
  const resolved = resolveTheme(theme)
  const root = document.documentElement
  if (resolved === 'dark') {
    root.classList.add('dark')
  } else {
    root.classList.remove('dark')
  }
  try {
    localStorage.setItem(STORAGE_KEYS.THEME, theme)
  } catch {
    // localStorage unavailable
  }
}
