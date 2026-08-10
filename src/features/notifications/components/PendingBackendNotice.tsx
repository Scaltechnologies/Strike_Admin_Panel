import { AlertTriangle } from 'lucide-react'

interface Props {
  /** What's missing on the backend, in plain terms (entity/service names welcome). */
  reason: string
}

/**
 * The UI below this notice is fully built and wired to the API layer, but notification-service has
 * no backend implementation for it yet — requests will fail until those endpoints ship. Keeps the
 * project rule of never presenting a feature as working when it isn't, while still letting the UI be
 * built ahead of the backend.
 */
export function PendingBackendNotice({ reason }: Props) {
  return (
    <div className="flex items-start gap-2.5 rounded-xl border border-dashed border-amber-500/40 bg-amber-50 p-3 text-xs text-amber-800 dark:bg-amber-400/10 dark:text-amber-300">
      <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" aria-hidden />
      <p>
        <span className="font-semibold">Backend pending —</span> {reason} The UI is ready and will
        work as soon as those endpoints ship.
      </p>
    </div>
  )
}
