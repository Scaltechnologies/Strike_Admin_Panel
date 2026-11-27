export type MenusTab = 'approvals' | 'stores' | 'insights' | 'history' | 'settings'

const TABS: readonly MenusTab[] = ['approvals', 'stores', 'insights', 'history', 'settings']

export const isMenusTab = (v: unknown): v is MenusTab => typeof v === 'string' && (TABS as readonly string[]).includes(v)
