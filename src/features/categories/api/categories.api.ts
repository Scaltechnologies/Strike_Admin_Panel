import axiosInstance from '@/api/axios'
import env from '@/config/env'
import { ENDPOINTS } from '@/constants/api/endpoints'
import { useAuthStore } from '@/store/auth-store'
import type { CategoryResponse, CategoryStatus, CreateCategoryRequest, UpdateCategoryRequest } from '../types/category.types'

export const categoriesApi = {
  // Deliberately bypasses axiosInstance: it sets a hard `Content-Type: application/json`
  // default that would stomp the multipart boundary a FormData body needs. Raw fetch lets
  // the browser generate the correct boundary itself — same approach as banners.api.ts.
  uploadImage: async (file: File): Promise<string> => {
    const { accessToken } = useAuthStore.getState()
    const formData = new FormData()
    formData.append('file', file)

    const res = await fetch(`${env.apiBaseUrl}${ENDPOINTS.CATEGORIES.UPLOAD}`, {
      method: 'POST',
      headers: accessToken ? { Authorization: `Bearer ${accessToken}` } : undefined,
      body: formData,
    })

    if (!res.ok) {
      if (res.status === 413) {
        throw new Error('That image is too large for the server to accept — please choose a smaller file.')
      }
      throw new Error(`Failed to upload category image (${res.status})`)
    }

    const data = (await res.json()) as { imageUrl: string }
    return data.imageUrl
  },

  list: (): Promise<CategoryResponse[]> =>
    axiosInstance.get(ENDPOINTS.CATEGORIES.BASE).then((r) => r.data as CategoryResponse[]),

  create: (payload: CreateCategoryRequest): Promise<CategoryResponse> =>
    axiosInstance.post(ENDPOINTS.CATEGORIES.BASE, payload).then((r) => r.data as CategoryResponse),

  update: (id: number, payload: UpdateCategoryRequest): Promise<CategoryResponse> =>
    axiosInstance.put(ENDPOINTS.CATEGORIES.BY_ID(id), payload).then((r) => r.data as CategoryResponse),

  updateStatus: (id: number, status: CategoryStatus): Promise<CategoryResponse> =>
    axiosInstance.patch(ENDPOINTS.CATEGORIES.STATUS(id), { status }).then((r) => r.data as CategoryResponse),

  delete: (id: number): Promise<void> =>
    axiosInstance.delete(ENDPOINTS.CATEGORIES.BY_ID(id)).then(() => undefined),
}
