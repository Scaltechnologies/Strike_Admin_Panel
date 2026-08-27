export interface StoreCategoryResponse {
  id: number
  name: string
  displayOrder: number | null
  createdAt: string
  updatedAt: string
}

export interface StoreCategoryRequest {
  name: string
  displayOrder?: number
}
