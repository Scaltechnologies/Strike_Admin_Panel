import { BrandLoader } from '@/components/brand/BrandLoader'
import { cn } from '@/lib/utils'

interface LoadingScreenProps {
  message?: string
  /**
   * overlay: covers the whole window (app start, auth checks).
   * inline: fills only the page area, so the sidebar and header stay visible while a page loads.
   */
  variant?: 'overlay' | 'inline'
}

export function LoadingScreen({ message = 'Loading', variant = 'overlay' }: LoadingScreenProps) {
  return (
    <div
      className={cn(
        'flex items-center justify-center',
        variant === 'overlay'
          ? 'fixed inset-0 z-50 bg-background/85 backdrop-blur-md'
          : 'min-h-[60vh] w-full',
      )}
    >
      <BrandLoader label={message} size={variant === 'overlay' ? 120 : 96} />
    </div>
  )
}
