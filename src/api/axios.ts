import axios from 'axios'
import env from '@/config/env'
import { API_CONFIG } from '@/constants/api/api-config'
import { setupRequestInterceptor } from '@/services/interceptors/request.interceptor'
import { setupResponseInterceptor } from '@/services/interceptors/response.interceptor'

const axiosInstance = axios.create({
  baseURL: env.apiBaseUrl,
  timeout: API_CONFIG.TIMEOUT,
  headers: API_CONFIG.HEADERS,
})

setupRequestInterceptor(axiosInstance)
setupResponseInterceptor(axiosInstance)

export default axiosInstance
