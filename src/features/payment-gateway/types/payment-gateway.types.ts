export type PaymentGatewayMode = 'TEST' | 'LIVE'

export interface PaymentGatewayConfigResponse {
  id: number
  provider: string
  mode: PaymentGatewayMode
  keyId: string
  keySecretMasked: string | null
  webhookSecretMasked: string | null
  webhookSecretConfigured: boolean
  active: boolean
  updatedBy: number | null
  updatedAt: string
}

export interface UpdatePaymentGatewayConfigRequest {
  keyId: string
  /** Omit or leave blank to keep the currently-stored secret unchanged. */
  keySecret?: string
  /** Omit or leave blank to keep the currently-stored secret unchanged. */
  webhookSecret?: string
  mode?: PaymentGatewayMode
  isActive?: boolean
}
