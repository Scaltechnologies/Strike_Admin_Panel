import { useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { X } from 'lucide-react'
import { useCreateStoreCategory, useUpdateStoreCategory } from '../hooks/useStoreCategories'
import type { StoreCategoryRequest, StoreCategoryResponse } from '../types/store-category.types'

interface StoreCategoryFormProps {
  open: boolean
  onClose: () => void
  editing?: StoreCategoryResponse | null
}

const inputCls = 'block w-full rounded-lg border border-border bg-background px-3 py-2 text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring disabled:opacity-60'

export function StoreCategoryForm({ open, onClose, editing }: StoreCategoryFormProps) {
  const isEdit = !!editing
  const [form, setForm] = useState<StoreCategoryRequest>({
    name: editing?.name ?? '',
    displayOrder: editing?.displayOrder ?? 0,
  })

  const { mutate: create, isPending: creating } = useCreateStoreCategory()
  const { mutate: update, isPending: updating } = useUpdateStoreCategory()
  const isPending = creating || updating

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    const payload: StoreCategoryRequest = { name: form.name.trim(), displayOrder: form.displayOrder }
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
            className="fixed right-0 top-0 z-50 flex h-full w-full max-w-sm flex-col border-l border-border bg-card shadow-2xl"
          >
            <div className="flex items-center justify-between border-b border-border px-5 py-4">
              <h2 className="text-base font-semibold text-foreground">{isEdit ? 'Edit Category' : 'New Category'}</h2>
              <button onClick={onClose} className="flex h-8 w-8 items-center justify-center rounded-lg text-muted-foreground hover:bg-muted hover:text-foreground">
                <X className="h-4 w-4" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="flex flex-1 flex-col overflow-y-auto p-5">
              <div className="flex-1 space-y-4">
                <div>
                  <label className="mb-1.5 block text-xs font-medium text-muted-foreground">
                    Name <span className="text-destructive">*</span>
                  </label>
                  <input
                    className={inputCls}
                    value={form.name}
                    onChange={(e) => setForm((p) => ({ ...p, name: e.target.value }))}
                    placeholder="e.g. Restaurant, Cafe, Bakery"
                    required
                    disabled={isPending}
                  />
                </div>
                <div>
                  <label className="mb-1.5 block text-xs font-medium text-muted-foreground">Display Order</label>
                  <input
                    type="number"
                    min={0}
                    className={inputCls}
                    value={form.displayOrder ?? 0}
                    onChange={(e) => setForm((p) => ({ ...p, displayOrder: Number(e.target.value) }))}
                    disabled={isPending}
                  />
                  <p className="mt-1 text-xs text-muted-foreground">Lower numbers appear first in the vendor app&apos;s picker.</p>
                </div>
              </div>

              <div className="mt-4 flex gap-2 border-t border-border pt-4">
                <button type="button" onClick={onClose} disabled={isPending}
                  className="flex-1 rounded-lg border border-border bg-muted px-4 py-2.5 text-sm font-medium text-foreground hover:bg-muted/80 disabled:opacity-60">
                  Cancel
                </button>
                <button type="submit" disabled={isPending}
                  className="flex-1 rounded-lg bg-primary px-4 py-2.5 text-sm font-semibold text-primary-foreground hover:bg-primary/90 disabled:opacity-60">
                  {isPending ? 'Saving…' : isEdit ? 'Save Changes' : 'Create Category'}
                </button>
              </div>
            </form>
          </motion.aside>
        </>
      )}
    </AnimatePresence>
  )
}
