import { useState } from 'react'
import { Link } from '@tanstack/react-router'
import { motion } from 'framer-motion'
import { ArrowLeft, Ban, CalendarDays, Check, Copy, Mail, MapPin, Phone, ShieldCheck, User as UserIcon } from 'lucide-react'
import { toast } from 'sonner'
import { ConfirmationDialog } from '@/components/common/ConfirmationDialog'
import { usePermission } from '@/core/permissions/permissions'
import { PERMISSIONS } from '@/constants/permissions'
import { cn } from '@/lib/utils'
import { formatDate, formatRelative } from '@/utils/helpers/date'
import { avatarGradient } from '@/features/vendors/utils/vendor-meta'
import { useBanUser, useUnbanUser } from '../hooks/useUsers'
import type { UserDetails } from '../types/user.types'
import { UserAvatar } from '../components/UserAvatar'
import { displayName, spendTier, userStatus } from '../utils/user-meta'

function CopyChip({ icon: Icon, value }: { icon: typeof Phone; value: string }) {
  const [copied, setCopied] = useState(false)
  return (
    <button type="button" title="Copy"
      onClick={() => void navigator.clipboard.writeText(value).then(() => { setCopied(true); toast.success('Copied'); setTimeout(() => setCopied(false), 1200) })}
      className="group inline-flex items-center gap-1.5 rounded-lg border border-white/10 bg-white/[0.06] px-2.5 py-1.5 text-xs text-white/80 backdrop-blur transition-colors hover:bg-white/[0.12] hover:text-white">
      <Icon className="h-3.5 w-3.5" />
      <span className="max-w-[220px] truncate">{value}</span>
      {copied ? <Check className="h-3 w-3 text-emerald-300" /> : <Copy className="h-3 w-3 opacity-0 transition-opacity group-hover:opacity-70" />}
    </button>
  )
}

export function UserHero({ userId, details, spent }: { userId: number; details?: UserDetails; spent?: number }) {
  const canEdit = usePermission(PERMISSIONS.USERS.EDIT)
  const [confirm, setConfirm] = useState<'ban' | 'unban' | null>(null)
  const ban = useBanUser()
  const unban = useUnbanUser()

  const auth = details?.auth
  const profile = details?.profile
  const banned = auth?.banned ?? false
  const verified = auth?.verified ?? true
  const status = userStatus({ banned, verified })
  const StatusIcon = status.icon
  const tier = spendTier(Number(spent ?? 0))
  const name = displayName({ id: userId, name: profile?.name, mobileNumber: auth?.mobileNumber ?? profile?.mobileNumber })
  const email = profile?.email && profile.email.includes('@') ? profile.email : null

  const run = () => {
    const done = () => setConfirm(null)
    if (confirm === 'ban') ban.mutate(userId, { onSuccess: done })
    else unban.mutate(userId, { onSuccess: done })
  }

  return (
    <>
      <motion.section initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}
        className="relative overflow-hidden rounded-3xl bg-[#0b0c10] text-white shadow-xl shadow-black/10">
        <div className="auth-aurora pointer-events-none absolute inset-0 opacity-70" aria-hidden><span /><span /><span /></div>
        <div className="auth-grid pointer-events-none absolute inset-0" aria-hidden />
        <div className={cn('pointer-events-none absolute -left-20 -top-24 h-72 w-72 rounded-full bg-gradient-to-br opacity-40 blur-3xl', avatarGradient(userId))} aria-hidden />

        <div className="relative z-10 p-6 sm:p-8">
          <Link to="/users" className="inline-flex items-center gap-1.5 text-xs font-medium text-white/60 transition-colors hover:text-white">
            <ArrowLeft className="h-3.5 w-3.5" /> All customers
          </Link>

          <div className="mt-4 flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
            <div className="flex items-start gap-5">
              <motion.div initial={{ scale: 0.6, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} transition={{ type: 'spring', stiffness: 260, damping: 18 }}>
                <UserAvatar id={userId} name={name} photo={profile?.profilePicUrl} dot={status.dot}
                  className="h-20 w-20 rounded-full text-2xl ring-4 ring-white/15 [&>span]:h-5 [&>span]:w-5 [&>span]:ring-4 [&>span]:ring-[#0b0c10]" />
              </motion.div>
              <div className="min-w-0">
                <p className="text-xs font-medium uppercase tracking-widest text-white/50">Customer #{userId}</p>
                <h1 className="mt-1 flex flex-wrap items-center gap-2 text-2xl font-bold tracking-tight sm:text-3xl">
                  {details ? name : <span className="inline-block h-8 w-48 animate-pulse rounded-lg bg-white/10" />}
                  {tier && <span className={cn('rounded-full px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider', tier.cls)}>{tier.label}</span>}
                </h1>
                <div className="mt-2.5 flex flex-wrap gap-2">
                  <span className={cn('inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-semibold', status.chip)}>
                    <StatusIcon className="h-3.5 w-3.5" />{status.label}
                  </span>
                  {verified && !banned && (
                    <span className="inline-flex items-center gap-1 rounded-full bg-sky-100 px-2.5 py-1 text-xs font-semibold text-sky-700 dark:bg-sky-400/10 dark:text-sky-300">
                      <ShieldCheck className="h-3.5 w-3.5" />Mobile verified
                    </span>
                  )}
                  {profile?.gender && (
                    <span className="inline-flex items-center gap-1 rounded-full bg-white/10 px-2.5 py-1 text-xs font-semibold capitalize text-white/80">
                      <UserIcon className="h-3.5 w-3.5" />{profile.gender.toLowerCase()}
                    </span>
                  )}
                </div>
                <div className="mt-3 flex flex-wrap gap-2">
                  {auth?.mobileNumber && <CopyChip icon={Phone} value={auth.mobileNumber} />}
                  {email && <CopyChip icon={Mail} value={email} />}
                  {auth?.createdAt && (
                    <span className="inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-xs text-white/60"><CalendarDays className="h-3.5 w-3.5" />Joined {formatDate(auth.createdAt)}</span>
                  )}
                  {profile?.lastLocationAt && (
                    <span className="inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-xs text-white/60"><MapPin className="h-3.5 w-3.5" />Last seen {formatRelative(profile.lastLocationAt)}</span>
                  )}
                </div>
              </div>
            </div>

            {canEdit && details && (
              banned ? (
                <button type="button" onClick={() => setConfirm('unban')}
                  className="inline-flex items-center gap-1.5 self-start rounded-xl bg-gradient-to-r from-emerald-400 to-teal-500 px-3.5 py-2 text-sm font-semibold text-white shadow-lg shadow-emerald-500/30 transition-all hover:-translate-y-0.5 lg:self-auto">
                  <ShieldCheck className="h-4 w-4" />Unban
                </button>
              ) : (
                <button type="button" onClick={() => setConfirm('ban')}
                  className="inline-flex items-center gap-1.5 self-start rounded-xl bg-white/10 px-3.5 py-2 text-sm font-semibold text-white transition-all hover:-translate-y-0.5 hover:bg-red-500/80 lg:self-auto">
                  <Ban className="h-4 w-4" />Ban
                </button>
              )
            )}
          </div>
        </div>
      </motion.section>

      <ConfirmationDialog open={confirm === 'ban'} title="Ban customer" confirmLabel="Ban" variant="destructive" isLoading={ban.isPending}
        description={`Ban ${name}? They won't be able to sign in or use their cards until unbanned.`} onConfirm={run} onCancel={() => setConfirm(null)} />
      <ConfirmationDialog open={confirm === 'unban'} title="Unban customer" confirmLabel="Unban" isLoading={unban.isPending}
        description={`Unban ${name}? They'll be able to sign in again.`} onConfirm={run} onCancel={() => setConfirm(null)} />
    </>
  )
}
