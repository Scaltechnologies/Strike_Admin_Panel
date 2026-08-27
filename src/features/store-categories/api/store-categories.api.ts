import axiosInstance from '@/api/axios'
import { ENDPOINTS } from '@/constants/api/endpoints'
import type { StoreCategoryRequest, StoreCategoryResponse } from '../types/store-category.types'

export const storeCategoriesApi = {
  list: (): Promise<StoreCategoryResponse[]> =>
    axiosInstance.get(ENDPOINTS.STORE_CATEGORIES.BASE).then((r) => r.data as StoreCategoryResponse[]),

  create: (payload: StoreCategoryRequest): Promise<StoreCategoryResponse> =>
    axiosInstance.post(ENDPOINTS.STORE_CATEGORIES.BASE, payload).then((r) => r.data as StoreCategoryResponse),

  update: (id: number, payload: StoreCategoryRequest): Promise<StoreCategoryResponse> =>
    axiosInstance.put(ENDPOINTS.STORE_CATEGORIES.BY_ID(id), payload).then((r) => r.data as StoreCategoryResponse),

  delete: (id: number): Promise<void> =>
    axiosInstance.delete(ENDPOINTS.STORE_CATEGORIES.BY_ID(id)).then(() => undefined),
}
