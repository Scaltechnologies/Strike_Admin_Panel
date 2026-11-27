import { useState } from 'react'
import { cn } from '@/lib/utils'
import { avatarGradient, vendorInitials } from '@/features/vendors/utils/vendor-meta'
import { usablePhoto } from '../utils/user-meta'

interface UserAvatarProps {
  id: number
  name: string
  photo?: string | null
  /** Tailwind size + text classes, e.g. "h-12 w-12 text-base rounded-2xl" */
  className?: string
  dot?: string
}

/** Profile photo when there is one, otherwise coloured initials. */
export function UserAvatar({ id, name, photo, className, dot }: UserAvatarProps) {
  const [failed, setFailed] = useState(false)
  const src = failed ? null : usablePhoto(photo)
  return (
    <span className={cn('relative flex shrink-0 items-center justify-center bg-gradient-to-br font-bold text-white shadow-lg', avatarGradient(id), className)}>
      {src ? (
        <img src={src} alt="" onError={() => setFailed(true)} className="h-full w-full rounded-[inherit] object-cover" />
      ) : (
        vendorInitials(name)
      )}
      {dot && <span className={cn('absolute -bottom-0.5 -right-0.5 h-3.5 w-3.5 rounded-full ring-2 ring-card', dot)} aria-hidden />}
    </span>
  )
}
