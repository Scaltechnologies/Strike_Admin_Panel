import { Info } from 'lucide-react'
import { AlertsSection, AppearanceSection } from '@/features/settings/components/DeviceSections'

/** Personal, per-browser choices. Same controls as Settings, but open to every admin. */
export function PreferencesTab() {
  return (
    <div className="flex flex-col gap-8">
      <p className="flex items-start gap-2 rounded-xl bg-muted/50 px-3.5 py-2.5 text-xs text-muted-foreground">
        <Info className="mt-0.5 h-3.5 w-3.5 shrink-0" />
        These choices are saved in this browser only and don’t affect other admins.
      </p>
      <AppearanceSection />
      <AlertsSection />
    </div>
  )
}
