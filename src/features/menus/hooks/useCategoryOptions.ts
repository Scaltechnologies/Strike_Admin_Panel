import { useMemo } from 'react'
import { useQuery } from '@tanstack/react-query'
import { categoriesApi } from '@/features/categories/api/categories.api'
import type { CategoryOption } from '../components/ItemFormDialog'

/**
 * Active menu categories for the item form. Falls back to the names the menu pages already know
 * (an admin with Menus but not Categories access can't list them all).
 */
export function useCategoryOptions(known?: Record<string, string>) {
  const list = useQuery({
    queryKey: ['menus', 'category-options'],
    queryFn: categoriesApi.list,
    staleTime: 5 * 60_000,
    retry: false,
    meta: { suppressError: true },
  })
  return useMemo(() => {
    const byId = new Map<number, CategoryOption>()
    for (const c of list.data ?? []) if (c.status === 'ACTIVE') byId.set(c.id, { id: c.id, name: c.name })
    if (!list.data) for (const [id, name] of Object.entries(known ?? {})) byId.set(Number(id), { id: Number(id), name })
    const names: Record<string, string> = { ...(known ?? {}) }
    for (const c of list.data ?? []) names[String(c.id)] = c.name
    return { options: [...byId.values()].sort((a, b) => a.name.localeCompare(b.name)), names }
  }, [list.data, known])
}
