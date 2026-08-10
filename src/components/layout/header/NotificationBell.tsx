import { useState, useRef, useEffect } from 'react'
import { Bell, X } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import { cn } from '@/lib/utils'

export function NotificationBell() {
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!open) return
    const handler = (e: MouseEvent) => {
      if (!ref.current?.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [open])

  useEffect(() => {
    if (!open) return
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setOpen(false)
    }
    document.addEventListener('keydown', handler)
    return () => document.removeEventListener('keydown', handler)
  }, [open])

  return (
    <div ref={ref} className="relative">
      <button
        onClick={() => setOpen((v) => !v)}
        aria-label="Notifications"
        aria-expanded={open}
        aria-haspopup="dialog"
        className={cn(
          'relative flex h-8 w-8 items-center justify-center rounded-lg text-muted-foreground',
          'transition-colors hover:bg-accent hover:text-foreground',
          'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring',
        )}
      >
        <Bell className="h-4 w-4" aria-hidden />
        {/* Unread dot — TODO Phase 3: wire to real notification count */}
        <span
          className="absolute right-1.5 top-1.5 h-1.5 w-1.5 rounded-full bg-primary"
          aria-label="Unread notifications"
        />
      </button>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: -4 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: -4 }}
            transition={{ duration: 0.15 }}
            className="absolute right-0 top-10 z-50 w-80 rounded-xl border border-border bg-popover shadow-lg"
            role="dialog"
            aria-label="Notifications"
          >
            <div className="flex items-center justify-between border-b border-border px-4 py-3">
              <h2 className="text-sm font-semibold text-foreground">Notifications</h2>
              <button
                onClick={() => setOpen(false)}
                aria-label="Close notifications"
                className="flex h-6 w-6 items-center justify-center rounded text-muted-foreground transition-colors hover:text-foreground"
              >
                <X className="h-3.5 w-3.5" aria-hidden />
              </button>
            </div>

            <div className="flex flex-col items-center justify-center px-4 py-10">
              <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-full bg-muted">
                <Bell className="h-5 w-5 text-muted-foreground" aria-hidden />
              </div>
              <p className="text-sm font-medium text-foreground">No notifications</p>
              <p className="mt-1 text-xs text-muted-foreground">
                You're all caught up!
              </p>
              {/* TODO Phase 3: Connect to GET /api/admin/notifications */}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
