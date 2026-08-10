export const storage = {
  get<T>(key: string): T | null {
    try {
      const item = localStorage.getItem(key)
      if (item === null) return null
      return JSON.parse(item) as T
    } catch {
      return null
    }
  },

  set<T>(key: string, value: T): void {
    try {
      localStorage.setItem(key, JSON.stringify(value))
    } catch {
      // Ignore write failures (e.g. private browsing quota exceeded)
    }
  },

  remove(key: string): void {
    try {
      localStorage.removeItem(key)
    } catch {
      // Ignore
    }
  },

  clear(): void {
    try {
      localStorage.clear()
    } catch {
      // Ignore
    }
  },

  has(key: string): boolean {
    try {
      return localStorage.getItem(key) !== null
    } catch {
      return false
    }
  },
}

export const sessionStore = {
  get<T>(key: string): T | null {
    try {
      const item = sessionStorage.getItem(key)
      if (item === null) return null
      return JSON.parse(item) as T
    } catch {
      return null
    }
  },

  set<T>(key: string, value: T): void {
    try {
      sessionStorage.setItem(key, JSON.stringify(value))
    } catch {
      // Ignore
    }
  },

  remove(key: string): void {
    try {
      sessionStorage.removeItem(key)
    } catch {
      // Ignore
    }
  },
}
