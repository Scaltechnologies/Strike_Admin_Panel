import { useEffect, useRef, useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { X } from 'lucide-react'
import { FileUploadField } from '@/components/forms/FileUploadField'
import { useCreateBanner, useUpdateBanner, useUploadBannerImage } from '../hooks/useBanners'
import type { BannerResponse, CreateBannerRequest } from '../types/banner.types'

const MAX_FILE_BYTES = 5 * 1024 * 1024

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

type FormState = Omit<CreateBannerRequest, 'imageUrl' | 'linkUrl'>

export function BannerForm({ open, onClose, editing }: BannerFormProps) {
  const isEdit = !!editing
  const [form, setForm] = useState<FormState>({
    title: editing?.title ?? '',
    description: editing?.description ?? '',
    validFrom: editing?.validFrom ?? '',
    validUntil: editing?.validUntil ?? '',
    displayOrder: editing?.displayOrder ?? 0,
  })

  const [file, setFile] = useState<File | null>(null)
  const [previewUrl, setPreviewUrl] = useState<string | null>(editing?.imageUrl ?? null)
  const [fileError, setFileError] = useState<string | null>(null)
  const objectUrlRef = useRef<string | null>(null)

  // Revoke whatever object URL is live when the form unmounts.
  useEffect(() => () => {
    if (objectUrlRef.current) URL.revokeObjectURL(objectUrlRef.current)
  }, [])

  const { mutateAsync: uploadImage, isPending: uploading } = useUploadBannerImage()
  const { mutate: create, isPending: creating } = useCreateBanner()
  const { mutate: update, isPending: updating } = useUpdateBanner()
  const isPending = uploading || creating || updating

  function set(k: keyof FormState, v: string | number) {
    setForm((p) => ({ ...p, [k]: v }))
  }

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const picked = e.target.files?.[0] ?? null
    e.target.value = '' // allow re-picking the same file after an error
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
    if (!isEdit && !file) {
      setFileError('Please choose an image to upload.')
      return
    }

    let imageUrl = editing?.imageUrl
    if (file) {
      try {
        imageUrl = await uploadImage(file)
      } catch {
        return // useUploadBannerImage's onError already surfaced a toast
      }
    }
    if (!imageUrl) return

    const payload: CreateBannerRequest = {
      ...form,
      imageUrl,
      description: form.description || undefined,
      validFrom: form.validFrom || undefined,
      validUntil: form.validUntil || undefined,
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
                <Field label="Banner Image" required={!isEdit}>
                  <FileUploadField
                    dragAndDrop
                    accept="image/*"
                    helperText="PNG or JPG, up to 5MB"
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
                <div className="grid grid-cols-2 gap-3">
                  <Field label="Start Date">
                    <input type="date" className={inputCls} value={form.validFrom ?? ''} onChange={(e) => set('validFrom', e.target.value)} disabled={isPending} />
                  </Field>
                  <Field label="End Date">
                    <input type="date" className={inputCls} value={form.validUntil ?? ''} onChange={(e) => set('validUntil', e.target.value)} disabled={isPending} />
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
                  {uploading ? 'Uploading…' : isPending ? 'Saving…' : isEdit ? 'Save Changes' : 'Create Banner'}
                </button>
              </div>
            </form>
          </motion.aside>
        </>
      )}
    </AnimatePresence>
  )
}
