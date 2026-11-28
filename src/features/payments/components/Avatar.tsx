import { useState } from 'react'
import { cn } from '@/lib/utils'
import { initials } from '../utils/payment-meta'

/** Photo when it loads, otherwise coloured initials. */
export function Avatar({ src, name, className, tone = 'from-violet-500 to-fuchsia-600' }: { src?: string | null; name?: string | null; className?: string; tone?: string }) {
  const [broken, setBroken] = useState(false)
  if (src && !broken) return <img src={src} alt="" onError={() => setBroken(true)} className={cn('object-cover', className)} />
  return <span className={cn('flex items-center justify-center bg-gradient-to-br font-bold text-white', tone, className)}>{initials(name)}</span>
}
