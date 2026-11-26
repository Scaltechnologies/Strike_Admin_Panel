import axiosInstance from '@/api/axios'
import { ENDPOINTS } from '@/constants/api/endpoints'
import type {
  AdminAccount,
  CreateAdminPayload,
  UpdateAdminPayload,
  UpdateMyProfilePayload,
} from '../types/admin.types'

const A = ENDPOINTS.AUTH.ADMINS

export const adminsApi = {
  list: (): Promise<AdminAccount[]> =>
    axiosInstance.get<AdminAccount[]>(A.BASE).then((r) => r.data),

  create: (payload: CreateAdminPayload): Promise<AdminAccount> =>
    axiosInstance.post<AdminAccount>(A.BASE, payload).then((r) => r.data),

  update: (id: number, payload: UpdateAdminPayload): Promise<AdminAccount> =>
    axiosInstance.put<AdminAccount>(A.BY_ID(String(id)), payload).then((r) => r.data),

  resetPassword: (id: number, newPassword: string): Promise<void> =>
    axiosInstance.patch(A.PASSWORD(String(id)), { newPassword }).then(() => undefined),

  setActive: (id: number, active: boolean): Promise<AdminAccount> =>
    axiosInstance
      .patch<AdminAccount>(active ? A.ACTIVATE(String(id)) : A.DEACTIVATE(String(id)))
      .then((r) => r.data),

  updateMe: (payload: UpdateMyProfilePayload): Promise<AdminAccount> =>
    axiosInstance.patch<AdminAccount>(ENDPOINTS.AUTH.ME, payload).then((r) => r.data),
}
