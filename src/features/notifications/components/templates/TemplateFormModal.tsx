import { useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { AnimatePresence, motion } from 'framer-motion'
import { X, LayoutTemplate } from 'lucide-react'
import { cn } from '@/lib/utils'
import { useCreateTemplate, useUpdateTemplate } from '../../hooks/useTemplates'
import type { NotificationChannel, NotificationTemplate } from '../../types/notification.types'

// PENDING BACKEND — anticipated contract for POST/PUT /api/admin/notifications/templates(/:id).
const schema = z.object({
  name: z.string().min(1, 'Name is required').max(100, 'Max 100 characters'),
  code: z
    .string()
    .min(1, 'Code is required')
    .max(60, 'Max 60 characters')
    .regex(/^[A-Z0-9_]+$/, 'Uppercase letters, numbers and underscores only'),
  channel: z.enum(['SMS', 'EMAIL', 'PUSH', 'IN_APP']),
  title: z.string().max(80, 'Max 80 characters').optional(),
  body: z.string().min(1, 'Body is required').max(1000, 'Max 1000 characters'),
  variablesText: z.string().optional(),
})

type FormValues = z.infer<typeof schema>

const CHANNELS: { value: NotificationChannel; label: string }[] = [
  { value: 'SMS', label: 'SMS' },
  { value: 'EMAIL', label: 'Email' },
  { value: 'PUSH', label: 'Push' },
  { value: 'IN_APP', label: 'In-App' },
]

const INPUT_CLS =
  'block w-full rounded-lg border border-border bg-background px-3 py-2 text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring disabled:opacity-60'
const ERROR_CLS = 'mt-1 text-xs text-destructive'

interface Props {
  open: boolean
  onClose: () => void
  /** Present when editing an existing template; absent when creating a new one. */
  template?: NotificationTemplate
}

export function TemplateFormModal({ open, onClose, template }: Props) {
  const isEdit = !!template
  const { mutate: create, isPending: creating } = useCreateTemplate()
  const { mutate: update, isPending: updating } = useUpdateTemplate()
  const isPending = creating || updating

  const {
    register,
    handleSubmit,
    reset,
    watch,
    formState: { errors },
  } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      name: '',
      code: '',
      channel: 'PUSH',
      title: '',
      body: '',
      variablesText: '',
    },
  })

  useEffect(() => {
    if (!open) return
    reset(
      template
        ? {
            name: template.name,
            code: template.code,
            channel: template.channel,
            title: template.title ?? '',
            body: template.body,
            variablesText: template.variables.join(', '),
          }
        : { name: '', code: '', channel: 'PUSH', title: '', body: '', variablesText: '' },
    )
  }, [open, template, reset])

  useEffect(() => {
    const h = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && !isPending) onClose()
    }
    document.addEventListener('keydown', h)
    return () => document.removeEventListener('keydown', h)
  }, [onClose, isPending])

  const channel = watch('channel')

  function onSubmit(values: FormValues) {
    const variables = (values.variablesText ?? '')
      .split(',')
      .map((v) => v.trim())
      .filter(Boolean)
    const payload = {
      name: values.name,
      code: values.code,
      channel: values.channel,
      title: values.title?.trim() || undefined,
      body: values.body,
      variables,
    }
    if (isEdit && template) {
      update({ id: template.id, data: payload }, { onSuccess: () => { reset(); onClose() } })
    } else {
      create(payload, { onSuccess: () => { reset(); onClose() } })
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
            aria-label={isEdit ? 'Edit Template' : 'New Template'}
          >
            <div className="flex items-center justify-between border-b border-border px-5 py-4">
              <div className="flex items-center gap-2.5">
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10">
                  <LayoutTemplate className="h-4 w-4 text-primary" aria-hidden />
                </div>
                <div>
                  <p className="font-semibold text-foreground">{isEdit ? 'Edit Template' : 'New Template'}</p>
                  <p className="text-xs text-muted-foreground">Reusable message body for a notification channel</p>
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
              <div className="max-h-[65vh] space-y-4 overflow-y-auto p-5">
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="mb-1.5 block text-xs font-medium text-muted-foreground">
                      Name <span className="text-destructive">*</span>
                    </label>
                    <input
                      type="text"
                      className={cn(INPUT_CLS, errors.name && 'border-destructive')}
                      placeholder="e.g. Vendor Approved (Push)"
                      disabled={isPending}
                      {...register('name')}
                    />
                    {errors.name && <p className={ERROR_CLS} role="alert">{errors.name.message}</p>}
                  </div>
                  <div>
                    <label className="mb-1.5 block text-xs font-medium text-muted-foreground">
                      Code <span className="text-destructive">*</span>
                    </label>
                    <input
                      type="text"
                      className={cn(INPUT_CLS, 'font-mono uppercase', errors.code && 'border-destructive')}
                      placeholder="VENDOR_APPROVED_PUSH"
                      disabled={isPending || isEdit}
                      {...register('code')}
                    />
                    {errors.code && <p className={ERROR_CLS} role="alert">{errors.code.message}</p>}
                  </div>
                </div>

                <div>
                  <label className="mb-1.5 block text-xs font-medium text-muted-foreground">Channel</label>
                  <select className={INPUT_CLS} disabled={isPending} {...register('channel')}>
                    {CHANNELS.map((c) => (
                      <option key={c.value} value={c.value}>{c.label}</option>
                    ))}
                  </select>
                </div>

                {(channel === 'PUSH' || channel === 'IN_APP') && (
                  <div>
                    <label className="mb-1.5 block text-xs font-medium text-muted-foreground">Title</label>
                    <input
                      type="text"
                      className={cn(INPUT_CLS, errors.title && 'border-destructive')}
                      placeholder="Headline shown alongside the body"
                      disabled={isPending}
                      {...register('title')}
                    />
                    {errors.title && <p className={ERROR_CLS} role="alert">{errors.title.message}</p>}
                  </div>
                )}

                <div>
                  <label className="mb-1.5 block text-xs font-medium text-muted-foreground">
                    Body <span className="text-destructive">*</span>
                  </label>
                  <textarea
                    rows={4}
                    className={cn(INPUT_CLS, 'resize-none font-mono', errors.body && 'border-destructive')}
                    placeholder="e.g. Hi {{name}}, your vendor account has been approved!"
                    disabled={isPending}
                    {...register('body')}
                  />
                  {errors.body && <p className={ERROR_CLS} role="alert">{errors.body.message}</p>}
                  <p className="mt-1 text-[11px] text-muted-foreground">
                    Use <code className="rounded bg-muted px-1">{'{{variable}}'}</code> placeholders for dynamic values.
                  </p>
                </div>

                <div>
                  <label className="mb-1.5 block text-xs font-medium text-muted-foreground">
                    Variables <span className="text-[10px] font-normal text-muted-foreground">(comma-separated)</span>
                  </label>
                  <input
                    type="text"
                    className={cn(INPUT_CLS, 'font-mono')}
                    placeholder="name, storeName"
                    disabled={isPending}
                    {...register('variablesText')}
                  />
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
                  <LayoutTemplate className="h-3.5 w-3.5" aria-hidden />
                  {isPending ? 'Saving…' : isEdit ? 'Save Changes' : 'Create Template'}
                </button>
              </div>
            </form>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  )
}
