export type ApiKeyStatus = 'ACTIVE' | 'REVOKED' | 'EXPIRED'

export interface ApiKeyResponse {
  id: number
  name: string
  keyPrefix: string
  status: ApiKeyStatus
  permissions: string[]
  expiresAt: string | null
  lastUsedAt: string | null
  createdAt: string
  updatedAt: string
}

export interface CreateApiKeyResponse extends ApiKeyResponse {
  rawKey: string
}

export interface ApiKeyPage {
  content: ApiKeyResponse[]
  page: number
  size: number
  totalElements: number
  totalPages: number
  last: boolean
}

export interface ApiKeyStats {
  totalKeys?: number
  activeKeys?: number
  revokedKeys?: number
  expiredKeys?: number
  [key: string]: unknown
}

export interface CreateApiKeyRequest {
  name: string
  permissions?: string[]
  expiresAt?: string
}
