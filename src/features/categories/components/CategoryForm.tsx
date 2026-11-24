import { useEffect, useRef, useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { ImagePlus, X } from 'lucide-react'
import { cn } from '@/lib/utils'
import { FormError } from '@/components/forms/FormError'
import { resolveImageUrl } from '@/utils/helpers/media-url'
import { compressImage } from '@/utils/helpers/compress-image'
import { useCreateCategory, useUpdateCategory, useUploadCategoryImage } from '../hooks/useCategories'
import type { CategoryResponse, CreateCategoryRequest } from '../types/category.types'

// Must match FileStorageServiceImpl.MAX_CATEGORY_IMAGE_SIZE_BYTES / ALLOWED_CONTENT_TYPES on the
// backend — banners keep a separate, smaller 5MB limit there, so this is intentionally not shared.
const MAX_FILE_BYTES = 15 * 1024 * 1024
const ALLOWED_TYPES = new Set(['image/jpeg', 'image/png', 'image/webp'])

interface CategoryFormProps {
  open: boolean
  onClose: () => void
  editing?: CategoryResponse | null
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

type FormState = Omit<CreateCategoryRequest, 'imageUrl'>

export function CategoryForm({ open, onClose, editing }: CategoryFormProps) {
  const isEdit = !!editing
  const [form, setForm] = useState<FormState>({
    name: editing?.name ?? '',
    description: editing?.description ?? '',
    // The backend always auto-assigns displayOrder on create (max + 1) and ignores whatever the
    // request sends — it's only ever respected on update. So this stays unset on create and the
    // field below is hidden until editing, instead of showing a number the admin's choice can't
    // actually control.
    displayOrder: editing?.displayOrder ?? undefined,
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
  const [preparing, setPreparing] = useState(false)
  const isPending = preparing || uploading || creating || updating

  function set(k: keyof FormState, v: string | number) {
    setForm((p) => ({ ...p, [k]: v }))
  }

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const picked = e.target.files?.[0] ?? null
    e.target.value = ''
    if (!picked) return
    if (!ALLOWED_TYPES.has(picked.type)) {
      setFileError('Only JPEG, PNG or WEBP images are allowed.')
      return
    }
    if (picked.size > MAX_FILE_BYTES) {
      setFileError('Image must be under 15MB.')
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
      // Shrink large photos first: the production proxy rejects big request bodies (413)
      // before they reach the backend. See compressImage for details.
      setPreparing(true)
      let toUpload: File
      try {
        toUpload = await compressImage(file)
      } finally {
        setPreparing(false)
      }
      try {
        imageUrl = await uploadImage(toUpload)
      } catch {
        return // useUploadCategoryImage's onError already surfaced a toast; nothing is saved
      }
    }

    const payload: CreateCategoryRequest = {
      name: form.name,
      description: form.description || undefined,
      imageUrl,
      // Omitted on create: the backend ignores it there regardless (see displayOrder comment above).
      ...(isEdit ? { displayOrder: form.displayOrder } : {}),
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
                  <div className="flex items-center gap-3">
                    <label
                      className={cn(
                        'group relative flex h-20 w-20 shrink-0 cursor-pointer items-center justify-center overflow-hidden rounded-lg border border-dashed border-border bg-muted/30 transition-colors hover:border-primary',
                        fileError && 'border-destructive',
                        isPending && 'pointer-events-none opacity-60',
                      )}
                    >
                      {previewUrl ? (
                        <>
                          <img
                            src={previewUrl}
                            alt="Category"
                            className="h-full w-full object-cover"
                            onError={(e) => { (e.target as HTMLImageElement).style.display = 'none' }}
                          />
                          <div className="absolute inset-0 flex items-center justify-center bg-black/0 opacity-0 transition-opacity group-hover:bg-black/50 group-hover:opacity-100">
                            <span className="text-[10px] font-medium text-white">Change</span>
                          </div>
                        </>
                      ) : (
                        <ImagePlus className="h-5 w-5 text-muted-foreground" />
                      )}
                      <input
                        type="file"
                        accept="image/jpeg,image/png,image/webp"
                        className="sr-only"
                        onChange={handleFileChange}
                        disabled={isPending}
                      />
                    </label>
                    <p className="text-xs text-muted-foreground">JPEG, PNG or WEBP, up to 15MB (optional). Large images are resized automatically. Square images look best.</p>
                  </div>
                  <FormError message={fileError ?? undefined} />
                </Field>
                <Field label="Description">
                  <textarea rows={2} className={inputCls + ' resize-none'} value={form.description ?? ''} onChange={(e) => set('description', e.target.value)} placeholder="Short description…" disabled={isPending} />
                </Field>
                {isEdit && (
                  <Field label="Display Order">
                    <input type="number" min={0} className={inputCls} value={form.displayOrder ?? 0} onChange={(e) => set('displayOrder', Number(e.target.value))} disabled={isPending} />
                  </Field>
                )}
              </div>

              <div className="mt-4 flex gap-2 border-t border-border pt-4">
                <button type="button" onClick={onClose} disabled={isPending}
                  className="flex-1 rounded-lg border border-border bg-muted px-4 py-2.5 text-sm font-medium text-foreground hover:bg-muted/80 disabled:opacity-60">
                  Cancel
                </button>
                <button type="submit" disabled={isPending}
                  className="flex-1 rounded-lg bg-primary px-4 py-2.5 text-sm font-semibold text-primary-foreground hover:bg-primary/90 disabled:opacity-60">
                  {preparing ? 'Preparing image…' : uploading ? 'Uploading…' : isPending ? 'Saving…' : isEdit ? 'Save Changes' : 'Create Category'}
                </button>
              </div>
            </form>
          </motion.aside>
        </>
      )}
    </AnimatePresence>
  )
}
