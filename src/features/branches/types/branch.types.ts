export interface Branch {
  id: number
  name: string
  city: string | null
  state: string | null
  country: string | null
  address: string | null
  radiusKm: number
  latitude: number | null
  longitude: number | null
  isActive: boolean
  contactEmail: string | null
  contactPhone: string | null
  createdAt: string
  updatedAt: string
}

export interface BranchPage {
  content: Branch[]
  page: number
  size: number
  totalElements: number
  totalPages: number
  last: boolean
}

export interface BranchAdminUser {
  id: number
  email: string
  name: string | null
  role: string
  active: boolean | null
  branchId: number | null
  permissions: string | null
  phone: string | null
  lastLoginAt: string | null
  createdAt: string
  updatedAt: string
}

export interface BranchRequest {
  name: string
  city?: string
  state?: string
  country?: string
  address?: string
  radiusKm?: number
  latitude?: number
  longitude?: number
  contactEmail?: string
  contactPhone?: string
}
