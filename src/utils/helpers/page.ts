/**
 * Backend services return pages in two shapes: card / redemption services wrap them as
 * { success, data: { content, totalPages, … } }, while the ledger returns { content, totalPages, … }
 * directly. Reads either, and never throws on missing data.
 */
export function readPage<T>(response: unknown): { content: T[]; totalPages: number; totalElements: number } {
  const outer = (response ?? {}) as { data?: unknown; content?: unknown; totalPages?: unknown; totalElements?: unknown }
  const inner = outer.data && typeof outer.data === 'object' && Array.isArray((outer.data as { content?: unknown }).content)
    ? (outer.data as { content: unknown; totalPages?: unknown; totalElements?: unknown })
    : outer
  return {
    content: Array.isArray(inner.content) ? (inner.content as T[]) : [],
    totalPages: typeof inner.totalPages === 'number' ? inner.totalPages : 0,
    totalElements: typeof inner.totalElements === 'number' ? inner.totalElements : 0,
  }
}
