import { useEffect, useState } from 'react'
import { useRouterState } from '@tanstack/react-router'
import { cn } from '@/lib/utils'

export function TopLoadingBar() {
  const isLoading = useRouterState({ select: (s) => s.status === 'pending' })
  const [visible, setVisible] = useState(isLoading)
  const [width, setWidth] = useState(isLoading ? 10 : 0)
  const [prevIsLoading, setPrevIsLoading] = useState(isLoading)

  // React's "adjust state when a prop changes" pattern: update during render
  // instead of synchronously inside an effect (avoids an extra render pass).
  if (isLoading !== prevIsLoading) {
    setPrevIsLoading(isLoading)
    if (isLoading) {
      setVisible(true)
      setWidth(10)
    } else {
      setWidth(100)
    }
  }

  useEffect(() => {
    if (isLoading) {
      // Fake progress: advance to ~85% while loading
      const interval = setInterval(() => {
        setWidth((w) => (w >= 85 ? w : w + (85 - w) * 0.1))
      }, 120)
      return () => clearInterval(interval)
    }

    // Finished: let the bar reach 100%, then hide it
    const timer = setTimeout(() => {
      setVisible(false)
      setWidth(0)
    }, 300)
    return () => clearTimeout(timer)
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
