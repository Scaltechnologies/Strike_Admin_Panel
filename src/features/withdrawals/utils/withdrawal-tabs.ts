export type WithdrawalsTab = 'queue' | 'history' | 'insights'

export const isWithdrawalsTab = (v: unknown): v is WithdrawalsTab => v === 'queue' || v === 'history' || v === 'insights'
