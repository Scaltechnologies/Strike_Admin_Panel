import { createJSONStorage } from 'zustand/middleware'

export const localStoragePersist = createJSONStorage(() => localStorage)
export const sessionStoragePersist = createJSONStorage(() => sessionStorage)
