import { useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { AnimatePresence, motion } from 'framer-motion'
import { X, Smartphone, Users, Store, ShieldCheck, Radio, Target } from 'lucide-react'
import { cn } from '@/lib/utils'
import { useSendPush, useSendPushBulk } from '../../hooks/usePushNotifications'
import type { RecipientType, BroadcastSegment } from '../../types/notification.types'

// PENDING BACKEND — anticipated contract for POST /api/admin/notifications/push/send(/bulk).
// Unlike SMS (which has no broadcast capability), push is well suited to segment-wide sends, so this
// form supports both a specific-recipient target and an all-{users,vendors,admins} broadcast.
const schema = z
  .object({
    targetMode: z.enum(['specific', 'broadcast']),
    recipientType: z.enum(['USER', 'VENDOR', 'ADMIN']),
    recipientId: z.number().int().positive('Must be a positive number').optional(),
    segment: z.enum(['ALL_USERS', 'ALL_VENDORS', 'ALL_ADMINS']),
    title: z.string().min(1, 'Title is required').max(65, 'Max 65 characters'),
    message: z.string().min(1, 'Message is required').max(240, 'Max 240 characters'),
  })
  .superRefine((values, ctx) => {
    if (values.targetMode === 'specific' && values.recipientId == null) {
      ctx.addIssue({
        code: 'custom',
        path: ['recipientId'],
        message: 'Recipient ID is required for a specific target',
      })
    }
  })

type FormValues = z.infer<typeof schema>

const RECIPIENT_TYPES: { value: RecipientType; label: string; icon: typeof Users }[] = [
  { value: 'USER', label: 'User', icon: Users },
  { value: 'VENDOR', label: 'Vendor', icon: Store },
  { value: 'ADMIN', label: 'Admin', icon: ShieldCheck },
]

const SEGMENTS: { value: BroadcastSegment; label: string }[] = [
  { value: 'ALL_USERS', label: 'All Users' },
  { value: 'ALL_VENDORS', label: 'All Vendors' },
  { value: 'ALL_ADMINS', label: 'All Admins' },
]

const INPUT_CLS =
  'block w-full rounded-lg border border-border bg-background px-3 py-2 text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring disabled:opacity-60'
const ERROR_CLS = 'mt-1 text-xs text-destructive'

interface Props {
  open: boolean
  onClose: () => void
}

export function SendPushModal({ open, onClose }: Props) {
  const { mutate: sendPush, isPending: sendingOne } = useSendPush()
  const { mutate: sendPushBulk, isPending: sendingBulk } = useSendPushBulk()
  const isPending = sendingOne || sendingBulk

  const {
    register,
    handleSubmit,
    reset,
    watch,
    formState: { errors },
  } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      targetMode: 'specific',
      recipientType: 'USER',
      recipientId: undefined,
      segment: 'ALL_USERS',
      title: '',
      message: '',
    },
  })

  const targetMode = watch('targetMode')
  const recipientType = watch('recipientType')

  useEffect(() => {
    if (!open) reset()
  }, [open, reset])

  useEffect(() => {
    const h = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && !isPending) onClose()
    }
    document.addEventListener('keydown', h)
    return () => document.removeEventListener('keydown', h)
  }, [onClose, isPending])

  function onSubmit(values: FormValues) {
    if (values.targetMode === 'specific') {
      sendPush(
        {
          recipientId: values.recipientId,
          recipientType: values.recipientType,
          title: values.title,
          message: values.message,
        },
        { onSuccess: () => { reset(); onClose() } },
      )
    } else {
      sendPushBulk(
        { segment: values.segment, title: values.title, message: values.message },
        { onSuccess: () => { reset(); onClose() } },
      )
    }
  }

  return (
    <AnimatePresence>
      {open && (
        <>
          <motion.div
            key="bd"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 z-40 bg-black/50 backdrop-blur-sm"
            onClick={() => !isPending && onClose()}
            aria-hidden
          />
          <motion.div
            key="modal"
            initial={{ opacity: 0, scale: 0.95, y: 10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 10 }}
            transition={{ type: 'spring', damping: 30, stiffness: 300 }}
            className="fixed inset-x-4 top-1/2 z-50 mx-auto max-w-lg -translate-y-1/2 rounded-2xl border border-border bg-card shadow-2xl"
            role="dialog"
            aria-modal="true"
            aria-label="Send Push Notification"
          >
            <div className="flex items-center justify-between border-b border-border px-5 py-4">
              <div className="flex items-center gap-2.5">
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10">
                  <Smartphone className="h-4 w-4 text-primary" aria-hidden />
                </div>
                <div>
                  <p className="font-semibold text-foreground">Send Push Notification</p>
                  <p className="text-xs text-muted-foreground">Target one recipient or broadcast to a segment</p>
                </div>
              </div>
              <button
                type="button"
                onClick={onClose}
                disabled={isPending}
                aria-label="Close"
                className="flex h-8 w-8 items-center justify-center rounded-lg text-muted-foreground transition-colors hover:bg-muted hover:text-foreground disabled:opacity-50"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <form onSubmit={handleSubmit(onSubmit)} noValidate>
              <div className="space-y-4 p-5">
                {/* Target mode */}
                <div>
                  <p className="mb-2 text-xs font-medium text-muted-foreground">Target</p>
                  <div className="grid grid-cols-2 gap-2">
                    <label
                      className={cn(
                        'flex cursor-pointer items-center justify-center gap-1.5 rounded-xl border p-2.5 text-center transition-colors',
                        targetMode === 'specific'
                          ? 'border-primary bg-primary/5 text-primary'
                          : 'border-border text-muted-foreground hover:bg-muted hover:text-foreground',
                      )}
                    >
                      <input type="radio" value="specific" className="sr-only" {...register('targetMode')} />
                      <Target className="h-4 w-4" aria-hidden />
                      <span className="text-xs font-semibold">Specific Recipient</span>
                    </label>
                    <label
                      className={cn(
                        'flex cursor-pointer items-center justify-center gap-1.5 rounded-xl border p-2.5 text-center transition-colors',
                        targetMode === 'broadcast'
                          ? 'border-primary bg-primary/5 text-primary'
                          : 'border-border text-muted-foreground hover:bg-muted hover:text-foreground',
                      )}
                    >
                      <input type="radio" value="broadcast" className="sr-only" {...register('targetMode')} />
                      <Radio className="h-4 w-4" aria-hidden />
                      <span className="text-xs font-semibold">Broadcast Segment</span>
                    </label>
                  </div>
                </div>

                {targetMode === 'specific' ? (
                  <div className="grid grid-cols-3 gap-2">
                    {RECIPIENT_TYPES.map((rt) => {
                      const Icon = rt.icon
                      const active = recipientType === rt.value
                      return (
                        <label
                          key={rt.value}
                          className={cn(
                            'flex cursor-pointer flex-col items-center justify-center gap-1 rounded-xl border p-2 text-center transition-colors',
                            active
                              ? 'border-primary bg-primary/5 text-primary'
                              : 'border-border text-muted-foreground hover:bg-muted hover:text-foreground',
                          )}
                        >
                          <input type="radio" value={rt.value} className="sr-only" {...register('recipientType')} />
                          <Icon className="h-4 w-4" aria-hidden />
                          <span className="text-xs font-semibold">{rt.label}</span>
                        </label>
                      )
                    })}
                  </div>
                ) : (
                  <div>
                    <label className="mb-1.5 block text-xs font-medium text-muted-foreground">Segment</label>
                    <select
                      className={INPUT_CLS}
                      disabled={isPending}
                      {...register('segment')}
                    >
                      {SEGMENTS.map((s) => (
                        <option key={s.value} value={s.value}>{s.label}</option>
                      ))}
                    </select>
                  </div>
                )}

                {targetMode === 'specific' && (
                  <div>
                    <label className="mb-1.5 block text-xs font-medium text-muted-foreground">
                      {recipientType === 'USER' ? 'User' : recipientType === 'VENDOR' ? 'Vendor' : 'Admin'} ID
                      <span className="ml-0.5 text-destructive">*</span>
                    </label>
                    <input
                      type="number"
                      min={1}
                      className={cn(INPUT_CLS, 'font-mono', errors.recipientId && 'border-destructive')}
                      placeholder="e.g. 42"
                      disabled={isPending}
                      {...register('recipientId', {
                        setValueAs: (v) => (v === '' || v == null || Number.isNaN(Number(v)) ? undefined : Number(v)),
                      })}
                    />
                    {errors.recipientId && <p className={ERROR_CLS} role="alert">{errors.recipientId.message}</p>}
                  </div>
                )}

                <div>
                  <label className="mb-1.5 block text-xs font-medium text-muted-foreground">
                    Title <span className="text-destructive">*</span>
                  </label>
                  <input
                    type="text"
                    className={cn(INPUT_CLS, errors.title && 'border-destructive')}
                    placeholder="e.g. Your subscription is expiring soon"
                    disabled={isPending}
                    {...register('title')}
                  />
                  {errors.title && <p className={ERROR_CLS} role="alert">{errors.title.message}</p>}
                  <p className="mt-1 text-[11px] text-muted-foreground">{watch('title')?.length ?? 0} / 65 characters</p>
                </div>

                <div>
                  <label className="mb-1.5 block text-xs font-medium text-muted-foreground">
                    Message <span className="text-destructive">*</span>
                  </label>
                  <textarea
                    rows={3}
                    className={cn(INPUT_CLS, 'resize-none', errors.message && 'border-destructive')}
                    placeholder="Write the push notification body…"
                    disabled={isPending}
                    {...register('message')}
                  />
                  {errors.message && <p className={ERROR_CLS} role="alert">{errors.message.message}</p>}
                  <p className="mt-1 text-[11px] text-muted-foreground">{watch('message')?.length ?? 0} / 240 characters</p>
                </div>
              </div>

              <div className="flex items-center justify-end gap-3 border-t border-border px-5 py-4">
                <button
                  type="button"
                  onClick={onClose}
                  disabled={isPending}
                  className="rounded-lg border border-border px-4 py-2 text-sm font-medium text-foreground transition-colors hover:bg-muted disabled:opacity-60"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isPending}
                  className="flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground transition-colors hover:bg-primary/90 disabled:opacity-60"
                >
                  <Smartphone className="h-3.5 w-3.5" aria-hidden />
                  {isPending ? 'Sending…' : targetMode === 'broadcast' ? 'Broadcast Push' : 'Send Push'}
                </button>
              </div>
            </form>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  )
}
