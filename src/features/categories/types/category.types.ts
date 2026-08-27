export type CategoryStatus = 'ACTIVE' | 'INACTIVE'

export interface CategoryResponse {
  id: number
  name: string
  description: string | null
  imageUrl: string | null
  displayOrder: number | null
  status: CategoryStatus
}

export interface CreateCategoryRequest {
  name: string
  description?: string
  imageUrl?: string
  displayOrder?: number
}

export type UpdateCategoryRequest = Partial<CreateCategoryRequest>
