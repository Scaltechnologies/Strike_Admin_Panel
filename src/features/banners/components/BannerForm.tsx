import { useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { X } from 'lucide-react'
import { useCreateBanner, useUpdateBanner } from '../hooks/useBanners'
import type { BannerResponse, CreateBannerRequest } from '../types/banner.types'

interface BannerFormProps {
  open: boolean
  onClose: () => void
  editing?: BannerResponse | null
}

function Field({ label, required, children }: { label: string; required?: boolean; children: React.ReactNode }) {
  return (
    <div>
      <label className="mb-1.5 block text-xs font-medium text-muted-foreground">
        {label}{required && <span className="ml-0.5 text-destructive">*</span>}
      </label>
      {children}
    </div>
  )
}

const inputCls = 'block w-full rounded-lg border border-border bg-background px-3 py-2 text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring disabled:opacity-60'

export function BannerForm({ open, onClose, editing }: BannerFormProps) {
  const isEdit = !!editing
  const [form, setForm] = useState<CreateBannerRequest>({
    title: editing?.title ?? '',
    imageUrl: editing?.imageUrl ?? '',
    linkUrl: editing?.linkUrl ?? '',
    description: editing?.description ?? '',
    startDate: editing?.startDate ?? '',
    endDate: editing?.endDate ?? '',
    displayOrder: editing?.displayOrder ?? 0,
  })

  const { mutate: create, isPending: creating } = useCreateBanner()
  const { mutate: update, isPending: updating } = useUpdateBanner()
  const isPending = creating || updating

  function set(k: keyof CreateBannerRequest, v: string | number) {
    setForm((p) => ({ ...p, [k]: v }))
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    const payload = {
      ...form,
      linkUrl: form.linkUrl || undefined,
      description: form.description || undefined,
      startDate: form.startDate || undefined,
      endDate: form.endDate || undefined,
    }
    if (isEdit) {
      update({ id: editing!.id, payload }, { onSuccess: onClose })
    } else {
      create(payload, { onSuccess: onClose })
    }
  }

  return (
    <AnimatePresence>
      {open && (
        <>
          <motion.div key="bd" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.2 }}
            className="fixed inset-0 z-40 bg-black/40 backdrop-blur-sm" onClick={onClose} aria-hidden />
          <motion.aside initial={{ x: '100%' }} animate={{ x: 0 }} exit={{ x: '100%' }}
            transition={{ type: 'spring', damping: 30, stiffness: 280 }}
            className="fixed right-0 top-0 z-50 flex h-full w-full max-w-md flex-col border-l border-border bg-card shadow-2xl"
          >
            <div className="flex items-center justify-between border-b border-border px-5 py-4">
              <h2 className="text-base font-semibold text-foreground">{isEdit ? 'Edit Banner' : 'Create Banner'}</h2>
              <button onClick={onClose} className="flex h-8 w-8 items-center justify-center rounded-lg text-muted-foreground hover:bg-muted hover:text-foreground">
                <X className="h-4 w-4" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="flex flex-1 flex-col overflow-y-auto p-5">
              <div className="flex-1 space-y-4">
                <Field label="Title" required>
                  <input className={inputCls} value={form.title} onChange={(e) => set('title', e.target.value)} placeholder="Summer Sale 2025" required disabled={isPending} />
                </Field>
                <Field label="Image URL" required>
                  <input className={inputCls} value={form.imageUrl} onChange={(e) => set('imageUrl', e.target.value)} placeholder="https://…/banner.jpg" required disabled={isPending} />
                </Field>
                {form.imageUrl && (
                  <div className="overflow-hidden rounded-lg border border-border">
                    <img src={form.imageUrl} alt="Preview" className="h-32 w-full object-cover" onError={(e) => { (e.target as HTMLImageElement).style.display = 'none' }} />
                  </div>
                )}
                <Field label="Link URL">
                  <input className={inputCls} value={form.linkUrl ?? ''} onChange={(e) => set('linkUrl', e.target.value)} placeholder="https://…" disabled={isPending} />
                </Field>
                <Field label="Description">
                  <textarea rows={2} className={inputCls + ' resize-none'} value={form.description ?? ''} onChange={(e) => set('description', e.target.value)} placeholder="Short description…" disabled={isPending} />
                </Field>
                <div className="grid grid-cols-2 gap-3">
                  <Field label="Start Date">
                    <input type="date" className={inputCls} value={form.startDate ?? ''} onChange={(e) => set('startDate', e.target.value)} disabled={isPending} />
                  </Field>
                  <Field label="End Date">
                    <input type="date" className={inputCls} value={form.endDate ?? ''} onChange={(e) => set('endDate', e.target.value)} disabled={isPending} />
                  </Field>
                </div>
                <Field label="Display Order">
                  <input type="number" min={0} className={inputCls} value={form.displayOrder ?? 0} onChange={(e) => set('displayOrder', Number(e.target.value))} disabled={isPending} />
                </Field>
              </div>

              <div className="mt-4 flex gap-2 border-t border-border pt-4">
                <button type="button" onClick={onClose} disabled={isPending}
                  className="flex-1 rounded-lg border border-border bg-muted px-4 py-2.5 text-sm font-medium text-foreground hover:bg-muted/80 disabled:opacity-60">
                  Cancel
                </button>
                <button type="submit" disabled={isPending}
                  className="flex-1 rounded-lg bg-primary px-4 py-2.5 text-sm font-semibold text-primary-foreground hover:bg-primary/90 disabled:opacity-60">
                  {isPending ? 'Saving…' : isEdit ? 'Save Changes' : 'Create Banner'}
                </button>
              </div>
            </form>
          </motion.aside>
        </>
      )}
    </AnimatePresence>
  )
}
