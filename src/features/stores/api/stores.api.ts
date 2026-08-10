import axiosInstance from '@/api/axios'
import { ENDPOINTS } from '@/constants/api/endpoints'
import type { Branch, StoreFilters, StorePage, StoreRecord, StoreStatus } from '../types/store.types'

export const storesApi = {
  list: (page: number, size: number, filters: StoreFilters): Promise<StorePage> =>
    axiosInstance
      .get(ENDPOINTS.STORES.BASE, {
        params: {
          page,
          size,
          ...(filters.status ? { status: filters.status } : {}),
          ...(filters.q ? { query: filters.q } : {}),
        },
      })
      .then((r) => r.data as StorePage),

  getByVendor: (vendorId: number): Promise<StoreRecord | null> =>
    axiosInstance
      .get(ENDPOINTS.STORES.BY_VENDOR(String(vendorId)))
      .then((r) => (r.data as StoreRecord[])[0] ?? null),

  getById: (storeId: number): Promise<StoreRecord> =>
    axiosInstance.get(ENDPOINTS.STORES.BY_ID(String(storeId))).then((r) => r.data as StoreRecord),

  updateStatus: (storeId: number, status: StoreStatus): Promise<StoreRecord> =>
    axiosInstance
      .patch(ENDPOINTS.STORES.STATUS(String(storeId)), { status })
      .then((r) => r.data as StoreRecord),

  updateManager: (
    storeId: number,
    body: { managerName?: string; managerPhone?: string },
  ): Promise<StoreRecord> =>
    axiosInstance
      .patch(ENDPOINTS.STORES.MANAGER(String(storeId)), body)
      .then((r) => r.data as StoreRecord),
}

export const branchesApi = {
  listActive: (): Promise<Branch[]> =>
    axiosInstance.get(ENDPOINTS.BRANCHES.ACTIVE).then((r) => r.data as Branch[]),
}
