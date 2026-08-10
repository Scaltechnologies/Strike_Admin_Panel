import axiosInstance from '@/api/axios'
import { ENDPOINTS } from '@/constants/api/endpoints'
import type {
  AdminLoginResponseDto,
  AdminRefreshResponseDto,
  AdminMeResponseDto,
  ChangePasswordRequest,
  AdminRegisterRequest,
} from '@/types/auth/auth'

export const authApi = {
  login(credentials: { email: string; password: string }): Promise<AdminLoginResponseDto> {
    return axiosInstance
      .post<AdminLoginResponseDto>(ENDPOINTS.AUTH.LOGIN, credentials)
      .then((r) => r.data)
  },

  logout(refreshToken: string): Promise<void> {
    return axiosInstance
      .post(ENDPOINTS.AUTH.LOGOUT, { refreshToken })
      .then(() => undefined)
  },

  refresh(refreshToken: string): Promise<AdminRefreshResponseDto> {
    return axiosInstance
      .post<AdminRefreshResponseDto>(ENDPOINTS.AUTH.REFRESH, { refreshToken })
      .then((r) => r.data)
  },

  me(): Promise<AdminMeResponseDto> {
    return axiosInstance.get<AdminMeResponseDto>(ENDPOINTS.AUTH.ME).then((r) => r.data)
  },

  changePassword(data: ChangePasswordRequest): Promise<void> {
    return axiosInstance
      .patch(ENDPOINTS.AUTH.CHANGE_PASSWORD, data)
      .then(() => undefined)
  },

  register(data: AdminRegisterRequest): Promise<AdminMeResponseDto> {
    return axiosInstance
      .post<AdminMeResponseDto>(ENDPOINTS.AUTH.REGISTER, data)
      .then((r) => r.data)
  },
}
