import { useState, useRef, useEffect } from 'react'
import { Sun, Moon, Monitor, Check } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import { useTheme } from '@/core/theme/use-theme'
import { THEME } from '@/constants/theme'
import type { Theme } from '@/constants/theme'
import { cn } from '@/lib/utils'

const OPTIONS: { value: Theme; label: string; icon: typeof Sun }[] = [
  { value: THEME.LIGHT, label: 'Light', icon: Sun },
  { value: THEME.DARK, label: 'Dark', icon: Moon },
  { value: THEME.SYSTEM, label: 'System', icon: Monitor },
]

export function ThemeToggle() {
  const { theme, resolvedTheme, setTheme } = useTheme()
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

  const CurrentIcon = resolvedTheme === 'dark' ? Moon : Sun

  return (
    <div ref={ref} className="relative">
      <button
        onClick={() => setOpen((v) => !v)}
        aria-label="Toggle theme"
        aria-expanded={open}
        aria-haspopup="menu"
        className={cn(
          'flex h-8 w-8 items-center justify-center rounded-lg text-muted-foreground',
          'transition-colors hover:bg-accent hover:text-foreground',
          'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring',
        )}
      >
        <CurrentIcon className="h-4 w-4" aria-hidden />
      </button>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: -4 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: -4 }}
            transition={{ duration: 0.15 }}
            className="absolute right-0 top-10 z-50 min-w-36 rounded-xl border border-border bg-popover p-1.5 shadow-lg"
            role="menu"
            aria-label="Theme options"
          >
            {OPTIONS.map((option) => {
              const Icon = option.icon
              return (
                <button
                  key={option.value}
                  role="menuitem"
                  onClick={() => { setTheme(option.value); setOpen(false) }}
                  className={cn(
                    'flex w-full items-center gap-2.5 rounded-lg px-3 py-2 text-sm transition-colors',
                    theme === option.value
                      ? 'bg-accent text-foreground'
                      : 'text-muted-foreground hover:bg-accent hover:text-foreground',
                    'focus-visible:outline-none focus-visible:bg-accent',
                  )}
                >
                  <Icon className="h-3.5 w-3.5 shrink-0" aria-hidden />
                  <span className="flex-1 text-left">{option.label}</span>
                  {theme === option.value && (
                    <Check className="h-3 w-3 text-primary" aria-hidden />
                  )}
                </button>
              )
            })}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
