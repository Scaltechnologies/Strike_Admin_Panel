import { useQuery } from '@tanstack/react-query'
import { menusApi } from '../api/menus.api'

export const MENU_QUERY_KEYS = {
  categories: (storeId: number) => ['menus', 'categories', storeId] as const,
  items: (storeId: number) => ['menus', 'items', storeId] as const,
}

const DEFAULTS = { staleTime: 30_000, retry: 1, meta: { suppressError: true } } as const

/** The store's categories that have items, with their items (active categories only). */
export function useStoreMenu(storeId: number | null) {
  return useQuery({
    queryKey: MENU_QUERY_KEYS.categories(storeId!),
    queryFn: () => menusApi.getCategoriesWithItems(storeId!),
    enabled: storeId !== null,
    ...DEFAULTS,
  })
}

/** Every item on the store's menu, including ones in categories that were switched off. */
export function useStoreItems(storeId: number | null) {
  return useQuery({
    queryKey: MENU_QUERY_KEYS.items(storeId!),
    queryFn: () => menusApi.getItems(storeId!),
    enabled: storeId !== null,
    ...DEFAULTS,
  })
}
