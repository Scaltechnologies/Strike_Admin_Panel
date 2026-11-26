import { cn } from '@/lib/utils'

interface StrikeLogoProps {
  /** Tailwind size classes for the bolt, e.g. "h-8 w-8". */
  className?: string
}

/** The Strike lightning-bolt mark (same artwork as the favicon). */
export function StrikeLogo({ className }: StrikeLogoProps) {
  return (
    <img
      src="/strike-bolt.png"
      alt=""
      aria-hidden
      draggable={false}
      className={cn('h-8 w-8 select-none object-contain', className)}
    />
  )
}
