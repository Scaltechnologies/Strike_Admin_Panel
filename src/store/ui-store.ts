import { create } from 'zustand'
import { persist, createJSONStorage } from 'zustand/middleware'
import { STORAGE_KEYS } from '@/constants/storage/storage-keys'

interface UIState {
  sidebarCollapsed: boolean
  mobileSidebarOpen: boolean
  searchOpen: boolean
  notificationsOpen: boolean
}

interface UIActions {
  setSidebarCollapsed: (collapsed: boolean) => void
  toggleSidebar: () => void
  setMobileSidebarOpen: (open: boolean) => void
  toggleMobileSidebar: () => void
  setSearchOpen: (open: boolean) => void
  setNotificationsOpen: (open: boolean) => void
}

type UIStore = UIState & UIActions

export const useUIStore = create<UIStore>()(
  persist(
    (set) => ({
      sidebarCollapsed: false,
      mobileSidebarOpen: false,
      searchOpen: false,
      notificationsOpen: false,

      setSidebarCollapsed: (collapsed) => set({ sidebarCollapsed: collapsed }),
      toggleSidebar: () => set((state) => ({ sidebarCollapsed: !state.sidebarCollapsed })),
      setMobileSidebarOpen: (open) => set({ mobileSidebarOpen: open }),
      toggleMobileSidebar: () => set((state) => ({ mobileSidebarOpen: !state.mobileSidebarOpen })),
      setSearchOpen: (open) => set({ searchOpen: open }),
      setNotificationsOpen: (open) => set({ notificationsOpen: open }),
    }),
    {
      name: STORAGE_KEYS.SIDEBAR_COLLAPSED,
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({ sidebarCollapsed: state.sidebarCollapsed }),
    },
  ),
)
