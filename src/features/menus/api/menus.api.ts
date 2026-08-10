import axiosInstance from '@/api/axios'
import { ENDPOINTS } from '@/constants/api/endpoints'
import type { CategoryWithItemsResponse, MenuItemResponse } from '../types/menu.types'

export const menusApi = {
  getCategoriesWithItems: (storeId: number): Promise<CategoryWithItemsResponse[]> =>
    axiosInstance
      .get(ENDPOINTS.MENUS.CATEGORIES(String(storeId)))
      .then((r) => r.data as CategoryWithItemsResponse[]),

  getItems: (storeId: number): Promise<MenuItemResponse[]> =>
    axiosInstance
      .get(ENDPOINTS.MENUS.ITEMS(String(storeId)))
      .then((r) => r.data as MenuItemResponse[]),
}
