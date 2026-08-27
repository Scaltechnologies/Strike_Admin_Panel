import { useEffect, useRef, useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { X } from 'lucide-react'
import { FileUploadField } from '@/components/forms/FileUploadField'
import { resolveImageUrl } from '@/utils/helpers/media-url'
import { useCreateCategory, useUpdateCategory, useUploadCategoryImage } from '../hooks/useCategories'
import type { CategoryResponse, CreateCategoryRequest } from '../types/category.types'

const MAX_FILE_BYTES = 5 * 1024 * 1024

interface CategoryFormProps {
  open: boolean
  onClose: () => void
  editing?: CategoryResponse | null
  categories: CategoryResponse[]
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

type FormState = Omit<CreateCategoryRequest, 'imageUrl' | 'displayOrder'>

// The admin no longer types a display order — it's auto-assigned as
// "next available" so the create form can never collide with an existing
// category's order (see the 409 this used to cause). Editing preserves
// whatever order the category already has; reordering isn't done here.
function nextDisplayOrder(categories: CategoryResponse[]): number {
  if (categories.length === 0) return 1
  return Math.max(...categories.map((c) => c.displayOrder ?? 0)) + 1
}

export function CategoryForm({ open, onClose, editing, categories }: CategoryFormProps) {
  const isEdit = !!editing
  const [form, setForm] = useState<FormState>({
    name: editing?.name ?? '',
    description: editing?.description ?? '',
  })

  const [file, setFile] = useState<File | null>(null)
  const [previewUrl, setPreviewUrl] = useState<string | null>(resolveImageUrl(editing?.imageUrl))
  const [fileError, setFileError] = useState<string | null>(null)
  const objectUrlRef = useRef<string | null>(null)

  useEffect(() => () => {
    if (objectUrlRef.current) URL.revokeObjectURL(objectUrlRef.current)
  }, [])

  const { mutateAsync: uploadImage, isPending: uploading } = useUploadCategoryImage()
  const { mutate: create, isPending: creating } = useCreateCategory()
  const { mutate: update, isPending: updating } = useUpdateCategory()
  const isPending = uploading || creating || updating

  function set(k: keyof FormState, v: string) {
    setForm((p) => ({ ...p, [k]: v }))
  }

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const picked = e.target.files?.[0] ?? null
    e.target.value = ''
    if (!picked) return
    if (!picked.type.startsWith('image/')) {
      setFileError('Please choose an image file.')
      return
    }
    if (picked.size > MAX_FILE_BYTES) {
      setFileError('Image must be under 5MB.')
      return
    }
    setFileError(null)
    setFile(picked)
    if (objectUrlRef.current) URL.revokeObjectURL(objectUrlRef.current)
    const url = URL.createObjectURL(picked)
    objectUrlRef.current = url
    setPreviewUrl(url)
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()

    let imageUrl = editing?.imageUrl ?? undefined
    if (file) {
      try {
        imageUrl = await uploadImage(file)
      } catch {
        return // useUploadCategoryImage's onError already surfaced a toast
      }
    }

    const payload: CreateCategoryRequest = {
      ...form,
      imageUrl,
      description: form.description || undefined,
      displayOrder: isEdit ? editing!.displayOrder ?? 0 : nextDisplayOrder(categories),
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
              <h2 className="text-base font-semibold text-foreground">{isEdit ? 'Edit Category' : 'Create Category'}</h2>
              <button onClick={onClose} className="flex h-8 w-8 items-center justify-center rounded-lg text-muted-foreground hover:bg-muted hover:text-foreground">
                <X className="h-4 w-4" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="flex flex-1 flex-col overflow-y-auto p-5">
              <div className="flex-1 space-y-4">
                <Field label="Name" required>
                  <input className={inputCls} value={form.name} onChange={(e) => set('name', e.target.value)} placeholder="e.g. Appetizers" required disabled={isPending} />
                </Field>
                <Field label="Image">
                  <FileUploadField
                    dragAndDrop
                    accept="image/*"
                    helperText="PNG or JPG, up to 5MB (optional)"
                    error={fileError ?? undefined}
                    onChange={handleFileChange}
                    disabled={isPending}
                  />
                </Field>
                {previewUrl && (
                  <div className="overflow-hidden rounded-lg border border-border">
                    <img src={previewUrl} alt="Preview" className="h-32 w-full object-cover" onError={(e) => { (e.target as HTMLImageElement).style.display = 'none' }} />
                  </div>
                )}
                <Field label="Description">
                  <textarea rows={2} className={inputCls + ' resize-none'} value={form.description ?? ''} onChange={(e) => set('description', e.target.value)} placeholder="Short description…" disabled={isPending} />
                </Field>
              </div>

              <div className="mt-4 flex gap-2 border-t border-border pt-4">
                <button type="button" onClick={onClose} disabled={isPending}
                  className="flex-1 rounded-lg border border-border bg-muted px-4 py-2.5 text-sm font-medium text-foreground hover:bg-muted/80 disabled:opacity-60">
                  Cancel
                </button>
                <button type="submit" disabled={isPending}
                  className="flex-1 rounded-lg bg-primary px-4 py-2.5 text-sm font-semibold text-primary-foreground hover:bg-primary/90 disabled:opacity-60">
                  {uploading ? 'Uploading…' : isPending ? 'Saving…' : isEdit ? 'Save Changes' : 'Create Category'}
                </button>
              </div>
            </form>
          </motion.aside>
        </>
      )}
    </AnimatePresence>
  )
}
