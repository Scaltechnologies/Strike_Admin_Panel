import { useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { AnimatePresence, motion } from 'framer-motion'
import { X, Bell, Users, Store } from 'lucide-react'
import { cn } from '@/lib/utils'
import { useSendNotification } from '../hooks/useNotifications'
import type { RecipientType } from '../types/notification.types'

// Matches the real backend contract exactly (notification-service `AdminNotificationController.send`):
// body = { mobile, message, recipientId, recipientType, type }. Only `mobile` and `message` are
// actually required server-side (recipientId/recipientType are optional log metadata, recipientType
// defaults to "USER") — there is no broadcast-all capability, so this form always targets one mobile.
const schema = z.object({
  recipientType: z.enum(['USER', 'VENDOR']),
  recipientId: z.number().int().positive('Must be a positive number').optional(),
  mobile: z
    .string()
    .min(10, 'Enter a valid mobile number')
    .max(15, 'Enter a valid mobile number'),
  message: z.string().min(1, 'Message is required').max(500, 'Max 500 characters'),
  type: z.string().optional(),
})

type FormValues = z.infer<typeof schema>

const RECIPIENT_TYPES: { value: RecipientType; label: string; icon: typeof Users }[] = [
  { value: 'USER', label: 'User', icon: Users },
  { value: 'VENDOR', label: 'Vendor', icon: Store },
]

const INPUT_CLS =
  'block w-full rounded-lg border border-border bg-background px-3 py-2 text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring disabled:opacity-60'
const ERROR_CLS = 'mt-1 text-xs text-destructive'

interface Props {
  open: boolean
  onClose: () => void
}

export function SendNotificationModal({ open, onClose }: Props) {
  const { mutate: send, isPending } = useSendNotification()

  const {
    register,
    handleSubmit,
    reset,
    watch,
    formState: { errors },
  } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      recipientType: 'USER',
      recipientId: undefined,
      mobile: '',
      message: '',
      type: 'ANNOUNCEMENT',
    },
  })

  const selectedType = watch('recipientType')

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
    send(
      {
        mobile: values.mobile,
        message: values.message,
        recipientId: values.recipientId,
        recipientType: values.recipientType,
        ...(values.type && { type: values.type }),
      },
      { onSuccess: () => { reset(); onClose() } },
    )
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
            aria-label="Send Notification"
          >
            {/* Header */}
            <div className="flex items-center justify-between border-b border-border px-5 py-4">
              <div className="flex items-center gap-2.5">
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10">
                  <Bell className="h-4 w-4 text-primary" aria-hidden />
                </div>
                <div>
                  <p className="font-semibold text-foreground">Send Notification</p>
                  <p className="text-xs text-muted-foreground">Sends an SMS to a specific user or vendor</p>
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

            {/* Form */}
            <form onSubmit={handleSubmit(onSubmit)} noValidate>
              <div className="space-y-4 p-5">
                {/* Recipient type */}
                <div>
                  <p className="mb-2 text-xs font-medium text-muted-foreground">Recipient Type</p>
                  <div className="grid grid-cols-2 gap-2">
                    {RECIPIENT_TYPES.map((rt) => {
                      const Icon = rt.icon
                      const active = selectedType === rt.value
                      return (
                        <label
                          key={rt.value}
                          className={cn(
                            'flex cursor-pointer items-center justify-center gap-1.5 rounded-xl border p-2.5 text-center transition-colors',
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
                </div>

                {/* Recipient ID + Mobile */}
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="mb-1.5 block text-xs font-medium text-muted-foreground">
                      {selectedType === 'USER' ? 'User' : 'Vendor'} ID
                      <span className="ml-1 text-[10px] font-normal text-muted-foreground">(optional)</span>
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
                  <div>
                    <label className="mb-1.5 block text-xs font-medium text-muted-foreground">
                      Mobile Number
                      <span className="ml-0.5 text-destructive">*</span>
                    </label>
                    <input
                      type="tel"
                      className={cn(INPUT_CLS, 'font-mono', errors.mobile && 'border-destructive')}
                      placeholder="+91XXXXXXXXXX"
                      disabled={isPending}
                      {...register('mobile')}
                    />
                    {errors.mobile && <p className={ERROR_CLS} role="alert">{errors.mobile.message}</p>}
                  </div>
                </div>

                {/* Message */}
                <div>
                  <label className="mb-1.5 block text-xs font-medium text-muted-foreground">
                    Message <span className="text-destructive">*</span>
                  </label>
                  <textarea
                    rows={4}
                    className={cn(INPUT_CLS, 'resize-none', errors.message && 'border-destructive')}
                    placeholder="Write your notification message…"
                    disabled={isPending}
                    {...register('message')}
                  />
                  {errors.message && <p className={ERROR_CLS} role="alert">{errors.message.message}</p>}
                  <p className="mt-1 text-[11px] text-muted-foreground">
                    {watch('message')?.length ?? 0} / 500 characters
                  </p>
                </div>
              </div>

              {/* Footer */}
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
                  <Bell className="h-3.5 w-3.5" aria-hidden />
                  {isPending ? 'Sending…' : 'Send Notification'}
                </button>
              </div>
            </form>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  )
}
