// Backend returns uploaded-image URLs as API-relative paths (e.g.
// "/api/admin/uploads/categories/xyz.jpg") so the value doesn't bake in a
// host/port that changes across dev/staging/prod. Resolve to an absolute
// URL only at render time — an unresolved relative path in <img src> loads
// against the current page's own origin instead of the API's, which 404s.

import env from '@/config/env'

export function resolveImageUrl(path: string | null | undefined): string | null {
  if (!path) return null
  if (/^(https?:|blob:|data:)/i.test(path)) return path
  return `${env.apiBaseUrl}${path.startsWith('/') ? '' : '/'}${path}`
}
