import axiosInstance from '@/api/axios'
import { ENDPOINTS } from '@/constants/api/endpoints'
import type { Branch, BranchAdminUser, BranchPage, BranchRequest } from '../types/branch.types'

export const branchesApi = {
  list: (page: number, size: number): Promise<BranchPage> =>
    axiosInstance
      .get(ENDPOINTS.BRANCHES.BASE, { params: { page, size } })
      .then((r) => r.data as BranchPage),

  listActive: (): Promise<Branch[]> =>
    axiosInstance.get(ENDPOINTS.BRANCHES.ACTIVE).then((r) => r.data as Branch[]),

  getById: (id: number): Promise<Branch> =>
    axiosInstance.get(ENDPOINTS.BRANCHES.BY_ID(String(id))).then((r) => r.data as Branch),

  create: (req: BranchRequest): Promise<Branch> =>
    axiosInstance.post(ENDPOINTS.BRANCHES.BASE, req).then((r) => r.data as Branch),

  update: (id: number, req: Partial<BranchRequest>): Promise<Branch> =>
    axiosInstance
      .put(ENDPOINTS.BRANCHES.BY_ID(String(id)), req)
      .then((r) => r.data as Branch),

  updateRadius: (id: number, radiusKm: number): Promise<Branch> =>
    axiosInstance
      .patch(ENDPOINTS.BRANCHES.RADIUS(String(id)), { radiusKm })
      .then((r) => r.data as Branch),

  activate: (id: number): Promise<Branch> =>
    axiosInstance
      .patch(ENDPOINTS.BRANCHES.ACTIVATE(String(id)))
      .then((r) => r.data as Branch),

  deactivate: (id: number): Promise<Branch> =>
    axiosInstance
      .patch(ENDPOINTS.BRANCHES.DEACTIVATE(String(id)))
      .then((r) => r.data as Branch),

  getManagers: (id: number): Promise<BranchAdminUser[]> =>
    axiosInstance
      .get(ENDPOINTS.BRANCHES.MANAGERS(String(id)))
      .then((r) => r.data as BranchAdminUser[]),

  assignManager: (branchId: number, adminId: number): Promise<string> =>
    axiosInstance
      .patch(ENDPOINTS.BRANCHES.ASSIGN_MANAGER(String(branchId), String(adminId)))
      .then((r) => r.data as string),
}

export const adminUsersApi = {
  list: (): Promise<BranchAdminUser[]> =>
    axiosInstance
      .get(ENDPOINTS.AUTH.ADMINS.BASE)
      .then((r) => r.data as BranchAdminUser[]),
}
