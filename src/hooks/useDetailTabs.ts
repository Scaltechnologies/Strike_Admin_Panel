import { useState } from 'react'

function readPersistedTab(persistKey: string | undefined, fallback: string): string {
  if (!persistKey || typeof window === 'undefined') return fallback
  return window.sessionStorage.getItem(`detail-tabs:${persistKey}`) ?? fallback
}

/**
 * Remembers the active tab for `persistKey` in sessionStorage across remounts within a session.
 * `forcedTab` (e.g. a `?tab=` URL search param for deep linking) always wins over the remembered
 * value on initial mount — an explicit link should never be overridden by a stale session tab.
 */
export function usePersistedTab(persistKey: string | undefined, defaultTab: string, forcedTab?: string) {
  const [activeTab, setActiveTabState] = useState(() => forcedTab ?? readPersistedTab(persistKey, defaultTab))

  const setActiveTab = (tabId: string) => {
    setActiveTabState(tabId)
    if (persistKey && typeof window !== 'undefined') {
      window.sessionStorage.setItem(`detail-tabs:${persistKey}`, tabId)
    }
  }

  return [activeTab, setActiveTab] as const
}
