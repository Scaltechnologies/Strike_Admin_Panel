export interface BannerResponse {
  id: number
  title: string
  imageUrl: string
  linkUrl: string | null
  description: string | null
  isActive: boolean
  validFrom: string | null
  validUntil: string | null
  displayOrder: number
  createdAt: string
  updatedAt: string
}

export interface BannerPage {
  content: BannerResponse[]
  page: number
  size: number
  totalElements: number
  totalPages: number
  last: boolean
}

export interface BannerStats {
  total?: number
  active?: number
  inactive?: number
  [key: string]: unknown
}

export interface CreateBannerRequest {
  title: string
  imageUrl: string
  linkUrl?: string
  description?: string
  validFrom?: string
  validUntil?: string
  displayOrder?: number
}

export type UpdateBannerRequest = Partial<CreateBannerRequest>
