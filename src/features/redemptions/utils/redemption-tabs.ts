export type RedemptionsTab = 'overview' | 'activity'

export const isRedemptionsTab = (v: unknown): v is RedemptionsTab => v === 'overview' || v === 'activity'
