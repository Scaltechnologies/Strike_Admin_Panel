import { useState } from 'react'
import { ImageOff, ExternalLink } from 'lucide-react'
import type { StoreRecord } from '../types/store.types'

export function StoreImagesTab({ store }: { store: StoreRecord }) {
  const [imgError, setImgError] = useState(false)

  if (!store.logoUrl) {
    return (
      <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-border bg-muted/10 py-16 text-center">
        <ImageOff className="mb-3 h-10 w-10 text-muted-foreground/30" />
        <p className="text-sm font-medium text-muted-foreground">No images uploaded</p>
        <p className="mt-1 text-xs text-muted-foreground/70">
          The vendor has not uploaded a store logo yet.
        </p>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <div>
        <p className="mb-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground">Store Logo</p>
        <div className="overflow-hidden rounded-xl border border-border bg-muted/30">
          {!imgError ? (
            <img
              src={store.logoUrl}
              alt={`${store.name} logo`}
              loading="lazy"
              onError={() => setImgError(true)}
              className="h-64 w-full object-contain p-4"
            />
          ) : (
            <div className="flex h-64 w-full items-center justify-center">
              <ImageOff className="h-12 w-12 text-muted-foreground/30" />
            </div>
          )}
        </div>
        <div className="mt-3 flex items-center gap-2">
          <a
            href={store.logoUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-1.5 rounded-lg border border-border px-3 py-1.5 text-xs font-medium text-foreground transition-colors hover:bg-muted"
          >
            <ExternalLink className="h-3 w-3" />
            Open original
          </a>
          <p className="text-[11px] text-muted-foreground break-all">{store.logoUrl}</p>
        </div>
      </div>
    </div>
  )
}
