import { create } from 'zustand'
import { persist, createJSONStorage } from 'zustand/middleware'
import axiosInstance from '@/api/axios'
import type { AlertSound } from './sound'

export type AlertType = 'WITHDRAWAL_REQUESTED' | 'MENU_CHANGE_REQUESTED' | 'REDEMPTION' | 'CARD_SOLD' | 'VENDOR_JOINED' | 'CUSTOMER_JOINED'

export interface AdminAlert {
  id: string
  type: AlertType
  priority: AlertSound
  section: string
  title: string
  message: string
  createdAt: string
  link: string
  amount?: number
  actionNeeded: boolean
}

export interface AlertsResponse {
  alerts: AdminAlert[]
  waiting: { withdrawals?: number; menuChanges?: number; vendors?: number; redemptions?: number }
  serverTime: string
}

export const fetchAlerts = (since?: string) =>
  axiosInstance.get<AlertsResponse>('/api/admin/alerts', { params: { since, limit: 60 } }).then((r) => r.data)

export interface AlertSettings {
  sound: boolean
  volume: number
  /** Ring again every 30 s while an unread request that needs action is waiting. */
  repeatUrgent: boolean
  desktop: boolean
  /** Alert types that stay silent (still listed in the bell). */
  silent: AlertType[]
}

const DEFAULT_SETTINGS: AlertSettings = { sound: true, volume: 1, repeatUrgent: true, desktop: true, silent: ['CUSTOMER_JOINED'] }

interface AlertsState {
  alerts: AdminAlert[]
  waiting: AlertsResponse['waiting']
  lastReadAt: string
  settings: AlertSettings
  /** Bumped whenever something new arrives, so the bell can shake. */
  pulse: number
  audioLocked: boolean
  merge: (incoming: AdminAlert[], waiting: AlertsResponse['waiting'], fresh: boolean) => AdminAlert[]
  markAllRead: () => void
  markRead: (a: AdminAlert) => void
  readIds: string[]
  setSettings: (patch: Partial<AlertSettings>) => void
  setAudioLocked: (locked: boolean) => void
}

const MAX_ALERTS = 120

export const useAlertsStore = create<AlertsState>()(
  persist(
    (set, get) => ({
      alerts: [],
      waiting: {},
      lastReadAt: new Date().toISOString(),
      readIds: [],
      settings: DEFAULT_SETTINGS,
      pulse: 0,
      audioLocked: true,

      /** Adds alerts not seen before; returns the ones that are new (only when `fresh`, i.e. not the first load). */
      merge: (incoming, waiting, fresh) => {
        const known = new Set(get().alerts.map((a) => a.id))
        const added = incoming.filter((a) => !known.has(a.id))
        const alerts = [...added, ...get().alerts]
          .sort((a, b) => b.createdAt.localeCompare(a.createdAt))
          .slice(0, MAX_ALERTS)
        set((s) => ({ alerts, waiting, pulse: fresh && added.length ? s.pulse + 1 : s.pulse }))
        return fresh ? added : []
      },
      markAllRead: () => set({ lastReadAt: new Date().toISOString(), readIds: [] }),
      markRead: (a) => set((s) => ({ readIds: s.readIds.includes(a.id) ? s.readIds : [...s.readIds.slice(-200), a.id] })),
      setSettings: (patch) => set((s) => ({ settings: { ...s.settings, ...patch } })),
      setAudioLocked: (audioLocked) => set({ audioLocked }),
    }),
    {
      name: 'strike:admin-alerts',
      storage: createJSONStorage(() => localStorage),
      partialize: (s) => ({ lastReadAt: s.lastReadAt, readIds: s.readIds, settings: s.settings }),
      merge: (persisted, current) => {
        const p = (persisted ?? {}) as Partial<AlertsState>
        return { ...current, ...p, settings: { ...DEFAULT_SETTINGS, ...(p.settings ?? {}) } }
      },
    },
  ),
)

export function isUnread(a: AdminAlert, lastReadAt: string, readIds: string[]): boolean {
  return a.createdAt > lastReadAt && !readIds.includes(a.id)
}
