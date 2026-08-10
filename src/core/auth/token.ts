import type { DecodedToken } from '@/types/auth/auth'

export function decodeToken(token: string): DecodedToken | null {
  try {
    const parts = token.split('.')
    if (parts.length !== 3) return null
    const base64 = parts[1].replace(/-/g, '+').replace(/_/g, '/')
    const json = decodeURIComponent(
      atob(base64)
        .split('')
        .map((c) => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
        .join(''),
    )
    return JSON.parse(json) as DecodedToken
  } catch {
    return null
  }
}

export function isTokenExpired(token: string): boolean {
  const decoded = decodeToken(token)
  if (!decoded) return true
  return decoded.exp * 1000 < Date.now()
}

export function getTokenExpiry(token: string): number | null {
  const decoded = decodeToken(token)
  if (!decoded) return null
  return decoded.exp * 1000
}

export function getBearerHeader(token: string): string {
  return `Bearer ${token}`
}
