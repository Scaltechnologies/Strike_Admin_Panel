export interface CardTheme {
  key: string
  label: string
  background: string
  text: string
  shadow: string
  /** Solid accent used for charts and chips that belong to this card. */
  accent: string
}

const THEMES: Record<string, CardTheme> = {
  gold: {
    key: 'gold', label: 'Gold',
    background: 'linear-gradient(135deg, #3b2606 0%, #b7791f 32%, #f6d365 55%, #c68a1d 75%, #4a3008 100%)',
    text: 'text-amber-50', shadow: 'shadow-amber-900/40', accent: '#d69e2e',
  },
  silver: {
    key: 'silver', label: 'Silver',
    background: 'linear-gradient(135deg, #2d3340 0%, #8a94a6 30%, #e6eaf0 52%, #9aa3b2 72%, #353b47 100%)',
    text: 'text-slate-50', shadow: 'shadow-slate-900/40', accent: '#8a94a6',
  },
  platinum: {
    key: 'platinum', label: 'Platinum',
    background: 'linear-gradient(135deg, #1c2430 0%, #4b6075 35%, #b9c7d6 55%, #5b7085 75%, #1a222c 100%)',
    text: 'text-sky-50', shadow: 'shadow-sky-950/40', accent: '#5b7085',
  },
  black: {
    key: 'black', label: 'Black',
    background: 'linear-gradient(135deg, #050505 0%, #1d1d22 45%, #34343d 60%, #0b0b0d 100%)',
    text: 'text-zinc-100', shadow: 'shadow-black/50', accent: '#52525b',
  },
  bolt: {
    key: 'bolt', label: 'Strike',
    background: 'linear-gradient(135deg, #3a0700 0%, #e01a00 35%, #ff6a00 62%, #ffb000 100%)',
    text: 'text-white', shadow: 'shadow-orange-900/40', accent: '#ff6a00',
  },
  rose: {
    key: 'rose', label: 'Rose',
    background: 'linear-gradient(135deg, #3d0a24 0%, #be185d 40%, #f472b6 70%, #7c1d4b 100%)',
    text: 'text-white', shadow: 'shadow-pink-950/40', accent: '#db2777',
  },
  ocean: {
    key: 'ocean', label: 'Ocean',
    background: 'linear-gradient(135deg, #061a3a 0%, #1d4ed8 40%, #38bdf8 70%, #0c2d5e 100%)',
    text: 'text-white', shadow: 'shadow-blue-950/40', accent: '#2563eb',
  },
  emerald: {
    key: 'emerald', label: 'Emerald',
    background: 'linear-gradient(135deg, #032b22 0%, #047857 40%, #34d399 70%, #064e3b 100%)',
    text: 'text-white', shadow: 'shadow-emerald-950/40', accent: '#059669',
  },
  violet: {
    key: 'violet', label: 'Violet',
    background: 'linear-gradient(135deg, #1e0b3d 0%, #6d28d9 40%, #a78bfa 70%, #2e1065 100%)',
    text: 'text-white', shadow: 'shadow-violet-950/40', accent: '#7c3aed',
  },
}

const ROTATION = ['bolt', 'ocean', 'rose', 'emerald', 'violet']

/** Picks a look from the card's name (Gold, Silver, Platinum, Black…), otherwise a stable colour per card. */
export function cardTheme(card: { id: number; name: string }): CardTheme {
  const n = card.name.toLowerCase()
  if (/gold|golden/.test(n)) return THEMES.gold
  if (/platinum|diamond/.test(n)) return THEMES.platinum
  if (/silver/.test(n)) return THEMES.silver
  if (/black|elite|premium|vip/.test(n)) return THEMES.black
  return THEMES[ROTATION[Math.abs(card.id) % ROTATION.length]]
}

export function validityLabel(days: number | null | undefined): string {
  if (!days) return 'No expiry'
  if (days % 365 === 0) return `${days / 365} year${days === 365 ? '' : 's'}`
  if (days % 30 === 0 && days >= 30) return `${days / 30} month${days === 30 ? '' : 's'}`
  return `${days} day${days === 1 ? '' : 's'}`
}

/** Extra money a buyer gets over what they pay, as a percentage of the price. */
export function bonusPercent(price: number, wallet: number): number {
  const p = Number(price) || 0
  const w = Number(wallet) || 0
  if (p <= 0 || w <= p) return 0
  return Math.round(((w - p) / p) * 100)
}

export const HOLDER_STATUS: Record<string, { label: string; color: string; chip: string }> = {
  ACTIVE: { label: 'Active', color: '#10b981', chip: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-400/10 dark:text-emerald-300' },
  EXHAUSTED: { label: 'Used up', color: '#6366f1', chip: 'bg-indigo-100 text-indigo-700 dark:bg-indigo-400/10 dark:text-indigo-300' },
  EXPIRED: { label: 'Expired', color: '#f59e0b', chip: 'bg-amber-100 text-amber-700 dark:bg-amber-400/10 dark:text-amber-300' },
  CANCELLED: { label: 'Cancelled', color: '#ef4444', chip: 'bg-red-100 text-red-700 dark:bg-red-400/10 dark:text-red-300' },
}
