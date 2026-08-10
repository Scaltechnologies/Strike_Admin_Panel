export interface ApiResponse<T = unknown> {
  data: T
  message: string
  success: boolean
  timestamp?: string
  meta?: Record<string, unknown>
}

export interface ApiError {
  message: string
  code?: string
  statusCode: number
  errors?: Record<string, string[]>
  timestamp?: string
}

export interface ApiListResponse<T> {
  data: T[]
  message: string
  success: boolean
  total: number
  page: number
  pageSize: number
  totalPages: number
}
