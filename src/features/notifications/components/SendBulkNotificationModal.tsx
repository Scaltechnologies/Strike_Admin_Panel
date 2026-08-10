import { useEffect } from 'react'
import { useForm, useFieldArray } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { AnimatePresence, motion } from 'framer-motion'
import { X, Send, Plus, Trash2 } from 'lucide-react'
import { cn } from '@/lib/utils'
import { useSendBulkNotification } from '../hooks/useNotifications'

// Matches POST /api/admin/notifications/send/bulk exactly — an explicit recipient list, one shared
// message. There is no "send to all users" capability on the backend, so this form never claims one.
const schema = z.object({
  message: z.string().min(1, 'Message is required').max(500, 'Max 500 characters'),
  type: z.string().optional(),
  recipients: z
    .array(
      z.object({
        mobile: z.string().min(10, 'Required').max(15, 'Invalid'),
        recipientId: z.number().int().positive('Must be a positive number').optional(),
        recipientType: z.enum(['USER', 'VENDOR']),
      }),
    )
    .min(1, 'Add at least one recipient'),
})

type FormValues = z.infer<typeof schema>

const INPUT_CLS =
  'block w-full rounded-lg border border-border bg-background px-2.5 py-1.5 text-xs placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring disabled:opacity-60'

interface Props {
  open: boolean
  onClose: () => void
}

export function SendBulkNotificationModal({ open, onClose }: Props) {
  const { mutate: sendBulk, isPending } = useSendBulkNotification()

  const {
    register,
    handleSubmit,
    reset,
    control,
    watch,
    formState: { errors },
  } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      message: '',
      type: 'ANNOUNCEMENT',
      recipients: [{ mobile: '', recipientId: undefined, recipientType: 'USER' }],
    },
  })

  const { fields, append, remove } = useFieldArray({ control, name: 'recipients' })

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
    sendBulk(
      { message: values.message, type: values.type, recipients: values.recipients },
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
            className="fixed inset-x-4 top-1/2 z-50 mx-auto flex max-h-[85vh] max-w-xl -translate-y-1/2 flex-col rounded-2xl border border-border bg-card shadow-2xl"
            role="dialog"
            aria-modal="true"
            aria-label="Send Bulk Notification"
          >
            {/* Header */}
            <div className="flex shrink-0 items-center justify-between border-b border-border px-5 py-4">
              <div className="flex items-center gap-2.5">
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10">
                  <Send className="h-4 w-4 text-primary" aria-hidden />
                </div>
                <div>
                  <p className="font-semibold text-foreground">Send Bulk Notification</p>
                  <p className="text-xs text-muted-foreground">One message, an explicit list of recipients</p>
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
            <form onSubmit={handleSubmit(onSubmit)} noValidate className="flex min-h-0 flex-1 flex-col">
              <div className="min-h-0 flex-1 space-y-4 overflow-y-auto p-5">
                {/* Message */}
                <div>
                  <label className="mb-1.5 block text-xs font-medium text-muted-foreground">
                    Message <span className="text-destructive">*</span>
                  </label>
                  <textarea
                    rows={3}
                    className={cn(
                      'block w-full resize-none rounded-lg border border-border bg-background px-3 py-2 text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring disabled:opacity-60',
                      errors.message && 'border-destructive',
                    )}
                    placeholder="Write the shared message…"
                    disabled={isPending}
                    {...register('message')}
                  />
                  {errors.message && <p className="mt-1 text-xs text-destructive" role="alert">{errors.message.message}</p>}
                  <p className="mt-1 text-[11px] text-muted-foreground">{watch('message')?.length ?? 0} / 500 characters</p>
                </div>

                {/* Recipients */}
                <div>
                  <div className="mb-2 flex items-center justify-between">
                    <p className="text-xs font-medium text-muted-foreground">
                      Recipients ({fields.length})
                    </p>
                    <button
                      type="button"
                      onClick={() => append({ mobile: '', recipientId: undefined, recipientType: 'USER' })}
                      disabled={isPending}
                      className="flex items-center gap-1 rounded-lg border border-border px-2 py-1 text-xs font-medium text-foreground transition-colors hover:bg-muted disabled:opacity-50"
                    >
                      <Plus className="h-3 w-3" /> Add
                    </button>
                  </div>
                  {errors.recipients?.root?.message && (
                    <p className="mb-2 text-xs text-destructive" role="alert">{errors.recipients.root.message}</p>
                  )}
                  <div className="space-y-2">
                    {fields.map((field, index) => (
                      <div key={field.id} className="flex items-center gap-2 rounded-lg border border-border p-2">
                        <select
                          className={cn(INPUT_CLS, 'w-24 shrink-0')}
                          disabled={isPending}
                          {...register(`recipients.${index}.recipientType`)}
                        >
                          <option value="USER">User</option>
                          <option value="VENDOR">Vendor</option>
                        </select>
                        <input
                          type="number"
                          min={1}
                          placeholder="ID"
                          className={cn(INPUT_CLS, 'w-20 shrink-0 font-mono')}
                          disabled={isPending}
                          {...register(`recipients.${index}.recipientId`, {
                            setValueAs: (v) => (v === '' || v == null || Number.isNaN(Number(v)) ? undefined : Number(v)),
                          })}
                        />
                        <input
                          type="tel"
                          placeholder="Mobile number"
                          className={cn(INPUT_CLS, 'flex-1 font-mono')}
                          disabled={isPending}
                          {...register(`recipients.${index}.mobile`)}
                        />
                        <button
                          type="button"
                          onClick={() => remove(index)}
                          disabled={isPending || fields.length === 1}
                          className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg text-muted-foreground transition-colors hover:bg-destructive/10 hover:text-destructive disabled:opacity-30"
                          aria-label="Remove recipient"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Footer */}
              <div className="flex shrink-0 items-center justify-end gap-3 border-t border-border px-5 py-4">
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
                  <Send className="h-3.5 w-3.5" aria-hidden />
                  {isPending ? 'Sending…' : `Send to ${fields.length} Recipient${fields.length === 1 ? '' : 's'}`}
                </button>
              </div>
            </form>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  )
}
