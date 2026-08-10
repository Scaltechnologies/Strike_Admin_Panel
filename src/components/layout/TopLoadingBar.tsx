import { useEffect, useRef, useState } from 'react'
import { useRouterState } from '@tanstack/react-router'
import { cn } from '@/lib/utils'

export function TopLoadingBar() {
  const isLoading = useRouterState({ select: (s) => s.status === 'pending' })
  const [visible, setVisible] = useState(false)
  const [width, setWidth] = useState(0)
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null)

  useEffect(() => {
    if (isLoading) {
      setVisible(true)
      setWidth(10)

      // Fake progress: advance to ~85% while loading
      intervalRef.current = setInterval(() => {
        setWidth((w) => {
          if (w >= 85) return w
          return w + (85 - w) * 0.1
        })
      }, 120)
    } else {
      if (intervalRef.current) clearInterval(intervalRef.current)
      setWidth(100)
      timerRef.current = setTimeout(() => {
        setVisible(false)
        setWidth(0)
      }, 300)
    }

    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current)
      if (timerRef.current) clearTimeout(timerRef.current)
    }
  }, [isLoading])

  if (!visible) return null

  return (
    <div
      className="pointer-events-none fixed left-0 top-0 z-[9999] h-0.5 w-full"
      aria-hidden
    >
      <div
        className={cn(
          'h-full bg-primary shadow-[0_0_8px_theme(colors.primary.DEFAULT)]',
          width === 100 ? 'transition-all duration-200 ease-out' : 'transition-all duration-150 ease-linear',
        )}
        style={{ width: `${width}%` }}
      />
    </div>
  )
}
