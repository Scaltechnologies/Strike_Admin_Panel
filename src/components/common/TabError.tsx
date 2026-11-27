import { AlertTriangle, RotateCw } from 'lucide-react'

/** Shown in place of a single tab or card that failed to render; the rest of the page keeps working. */
export function TabError() {
  return (
    <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-border bg-card py-14 text-center">
      <span className="mb-3 flex h-11 w-11 items-center justify-center rounded-2xl bg-amber-100 text-amber-600 dark:bg-amber-400/10 dark:text-amber-300">
        <AlertTriangle className="h-5 w-5" />
      </span>
      <p className="text-sm font-medium text-foreground">This section couldn&apos;t be shown</p>
      <p className="mt-1 max-w-sm text-sm text-muted-foreground">The rest of the page still works. Try reloading, or open another tab.</p>
      <button type="button" onClick={() => window.location.reload()}
        className="mt-4 inline-flex items-center gap-1.5 rounded-lg border border-border px-3 py-1.5 text-xs font-medium text-muted-foreground hover:bg-muted hover:text-foreground">
        <RotateCw className="h-3.5 w-3.5" />Reload
      </button>
    </div>
  )
}
