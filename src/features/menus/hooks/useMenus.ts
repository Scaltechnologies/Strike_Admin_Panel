import { useQuery } from '@tanstack/react-query'
import { menusApi } from '../api/menus.api'

export const MENU_QUERY_KEYS = {
  categories: (storeId: number) => ['menus', 'categories', storeId] as const,
  items: (storeId: number) => ['menus', 'items', storeId] as const,
}

const DEFAULTS = { staleTime: 1000 * 60 * 5, retry: 1, meta: { suppressError: true } } as const

export function useStoreMenu(storeId: number | null) {
  return useQuery({
    queryKey: MENU_QUERY_KEYS.categories(storeId!),
    queryFn: () => menusApi.getCategoriesWithItems(storeId!),
    enabled: storeId !== null,
    ...DEFAULTS,
  })
}
