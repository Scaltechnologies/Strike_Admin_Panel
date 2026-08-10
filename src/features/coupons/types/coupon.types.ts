export type DiscountType = 'PERCENTAGE' | 'FLAT'

export interface CouponResponse {
  id: number
  code: string
  title: string
  description: string | null
  discountType: string
  discountValue: number
  maxDiscountAmount: number | null
  minPurchaseAmount: number | null
  maxUses: number | null
  usedCount: number
  vendorId: number | null
  validFrom: string
  validUntil: string
  isActive: boolean
  createdAt: string
  updatedAt: string
}

export interface CreateCouponRequest {
  code: string
  title: string
  description?: string
  discountType: DiscountType
  discountValue: number
  maxDiscountAmount?: number
  minPurchaseAmount?: number
  maxUses?: number
  vendorId?: number
  validFrom: string
  validUntil: string
}

export interface CouponPage {
  content: CouponResponse[]
  page: number
  size: number
  totalElements: number
  totalPages: number
  last: boolean
}

export interface CouponStats {
  totalCoupons: number
  activeCoupons: number
  totalUsages: number
}
