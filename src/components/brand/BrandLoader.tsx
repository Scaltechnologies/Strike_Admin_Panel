import { cn } from '@/lib/utils'

interface BrandLoaderProps {
  /** Text under the loader. Pass null to hide it. */
  label?: string | null
  /** Ring diameter in px. */
  size?: number
  className?: string
}

/**
 * Animated Strike loader: the bolt charging inside a spinning gradient ring, with a spark
 * orbiting it and a charging bar underneath. Styles live in index.css (.strike-loader).
 */
export function BrandLoader({ label = 'Loading', size = 120, className }: BrandLoaderProps) {
  return (
    <div role="status" aria-live="polite" className={cn('flex flex-col items-center gap-6', className)}>
      <div className="strike-loader" style={{ '--sl-size': `${size}px` } as React.CSSProperties}>
        <div className="sl-glow" />
        <div className="sl-ring--outer" />
        <div className="sl-ring" />
        <div className="sl-orbit" />
        <div className="sl-bolt">
          <img src="/strike-bolt.png" alt="" draggable={false} />
          <span className="sl-shine" />
        </div>
      </div>
      <div className="flex flex-col items-center gap-3">
        <div className="sl-bar" />
        {label !== null && (
          <p className="text-xs font-medium uppercase tracking-[0.25em] text-muted-foreground">
            {label}
            <span className="sr-only">…</span>
          </p>
        )}
      </div>
    </div>
  )
}
