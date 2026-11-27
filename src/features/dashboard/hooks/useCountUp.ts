import { useEffect, useRef, useState } from 'react'

const prefersReducedMotion = () =>
  typeof window !== 'undefined' && window.matchMedia?.('(prefers-reduced-motion: reduce)').matches

/**
 * Animates a number from its previous value to `target` (ease-out), so figures "count up" on
 * first load and glide to new values when the dashboard refreshes. Instant with reduced motion.
 */
export function useCountUp(target: number, durationMs = 1100): number {
  const [value, setValue] = useState(0)
  const fromRef = useRef(0)

  useEffect(() => {
    const to = Number.isFinite(target) ? target : 0
    const from = fromRef.current
    if (from === to) return
    if (prefersReducedMotion()) {
      fromRef.current = to
      const id = requestAnimationFrame(() => setValue(to))
      return () => cancelAnimationFrame(id)
    }

    let raf = 0
    const start = performance.now()
    const tick = (now: number) => {
      const t = Math.min(1, (now - start) / durationMs)
      const eased = 1 - Math.pow(1 - t, 3)
      const current = from + (to - from) * eased
      setValue(current)
      fromRef.current = current
      if (t < 1) raf = requestAnimationFrame(tick)
      else fromRef.current = to
    }
    raf = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(raf)
  }, [target, durationMs])

  return value
}
