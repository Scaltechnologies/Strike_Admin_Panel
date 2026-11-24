import { useRef } from 'react'
import { ImagePlus, Pencil, X, Loader2 } from 'lucide-react'
import { cn } from '@/lib/utils'
import { FormError } from '@/components/forms'

interface CategoryImagePickerProps {
  /** Currently persisted image (edit mode), or null if none set yet. */
  imageUrl: string | null
  /** Local object URL for a freshly device-picked file, not yet uploaded. Takes precedence over imageUrl. */
  previewUrl: string | null
  onSelect: (file: File) => void
  onRemove: () => void
  /** True while the picked file is actually being uploaded (on Save), shows a spinner overlay. */
  uploading?: boolean
  error?: string | null
  disabled?: boolean
}

/**
 * Device-picker-only category image control — no URL text input exists anywhere here or in any
 * parent. Tapping the box opens the OS file/photo picker (native <input type="file">, which on
 * mobile browsers surfaces the camera/gallery chooser); the selection previews immediately via a
 * local object URL, and the actual upload only happens when the form is saved.
 */
export function CategoryImagePicker({
  imageUrl,
  previewUrl,
  onSelect,
  onRemove,
  uploading = false,
  error,
  disabled = false,
}: CategoryImagePickerProps) {
  const inputRef = useRef<HTMLInputElement>(null)
  const displayUrl = previewUrl ?? imageUrl
  const hasImage = !!displayUrl

  function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    e.target.value = '' // allow re-picking the same file later (e.g. after removing it)
    if (file) onSelect(file) // validation (type/size) is the parent form's job — it owns `error`
  }

  function openPicker() {
    if (!disabled && !uploading) inputRef.current?.click()
  }

  return (
    <div className="space-y-1.5">
      <label className="block text-sm font-medium text-foreground">Category Image</label>

      <div className="flex items-center gap-4">
        <div
          role="button"
          tabIndex={disabled ? -1 : 0}
          onClick={openPicker}
          onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); openPicker() } }}
          className={cn(
            'group relative flex h-28 w-28 shrink-0 cursor-pointer items-center justify-center overflow-hidden rounded-xl border-2 transition-colors',
            hasImage ? 'border-border' : 'border-dashed border-border hover:border-primary hover:bg-primary/5',
            disabled && 'pointer-events-none opacity-60',
          )}
        >
          {hasImage ? (
            <>
              <img src={displayUrl} alt="Category" className="h-full w-full object-cover" />
              <div className="absolute inset-0 flex items-center justify-center bg-black/0 opacity-0 transition-opacity group-hover:bg-black/40 group-hover:opacity-100">
                <Pencil className="h-5 w-5 text-white" />
              </div>
              {uploading && (
                <div className="absolute inset-0 flex items-center justify-center bg-black/50">
                  <Loader2 className="h-6 w-6 animate-spin text-white" />
                </div>
              )}
            </>
          ) : (
            <div className="flex flex-col items-center gap-1.5 text-muted-foreground">
              <ImagePlus className="h-6 w-6" />
              <span className="text-[11px] font-medium">Add Image</span>
            </div>
          )}
        </div>

        <div className="flex flex-col gap-2">
          <button
            type="button"
            onClick={openPicker}
            disabled={disabled || uploading}
            className="rounded-lg border border-border bg-card px-3 py-1.5 text-xs font-medium text-foreground transition-colors hover:bg-muted disabled:opacity-60"
          >
            {hasImage ? 'Change Image' : 'Choose Image'}
          </button>
          {hasImage && (
            <button
              type="button"
              onClick={onRemove}
              disabled={disabled || uploading}
              className="flex items-center gap-1 rounded-lg border border-destructive/30 px-3 py-1.5 text-xs font-medium text-destructive transition-colors hover:bg-destructive/10 disabled:opacity-60"
            >
              <X className="h-3 w-3" />
              Remove Image
            </button>
          )}
          <p className="text-[11px] text-muted-foreground">JPEG, PNG or WEBP, up to 5MB</p>
        </div>
      </div>

      <input
        ref={inputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp"
        onChange={handleChange}
        className="sr-only"
        aria-label="Choose category image"
      />

      <FormError message={error ?? undefined} />
    </div>
  )
}
