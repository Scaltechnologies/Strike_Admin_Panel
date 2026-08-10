export interface BannerResponse {
  id: number
  title: string
  imageUrl: string
  linkUrl: string | null
  description: string | null
  active: boolean
  startDate: string | null
  endDate: string | null
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
  totalBanners?: number
  activeBanners?: number
  inactiveBanners?: number
  [key: string]: unknown
}

export interface CreateBannerRequest {
  title: string
  imageUrl: string
  linkUrl?: string
  description?: string
  startDate?: string
  endDate?: string
  displayOrder?: number
}

export type UpdateBannerRequest = Partial<CreateBannerRequest>
