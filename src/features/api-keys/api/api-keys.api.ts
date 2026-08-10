import axiosInstance from '@/api/axios'
import { ENDPOINTS } from '@/constants/api/endpoints'
import type { ApiKeyResponse, ApiKeyPage, ApiKeyStats, CreateApiKeyRequest, CreateApiKeyResponse } from '../types/api-key.types'

export const apiKeysApi = {
  list: (page: number, size: number): Promise<ApiKeyPage> =>
    axiosInstance
      .get(ENDPOINTS.API_KEYS.BASE, { params: { page, size } })
      .then((r) => r.data as ApiKeyPage),

  getStats: (): Promise<ApiKeyStats> =>
    axiosInstance.get(ENDPOINTS.API_KEYS.STATS).then((r) => r.data as ApiKeyStats),

  create: (payload: CreateApiKeyRequest): Promise<CreateApiKeyResponse> =>
    axiosInstance.post(ENDPOINTS.API_KEYS.BASE, payload).then((r) => r.data as CreateApiKeyResponse),

  revoke: (id: number): Promise<ApiKeyResponse> =>
    axiosInstance.patch(ENDPOINTS.API_KEYS.REVOKE(String(id))).then((r) => r.data as ApiKeyResponse),

  activate: (id: number): Promise<ApiKeyResponse> =>
    axiosInstance.patch(ENDPOINTS.API_KEYS.ACTIVATE(String(id))).then((r) => r.data as ApiKeyResponse),

  delete: (id: number): Promise<void> =>
    axiosInstance.delete(ENDPOINTS.API_KEYS.BY_ID(String(id))).then(() => undefined),
}
