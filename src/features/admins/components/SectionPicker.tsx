import { Check } from 'lucide-react'
import { cn } from '@/lib/utils'
import { SECTIONS, SECTION_NOTES, type SectionCode } from '@/constants/sections'

interface SectionPickerProps {
  value: string[]
  onChange: (next: string[]) => void
  disabled?: boolean
}

const GROUPS = Array.from(new Set(SECTIONS.map((s) => s.group)))

/** Checkbox list of panel sections, grouped like the sidebar. */
export function SectionPicker({ value, onChange, disabled }: SectionPickerProps) {
  const selected = new Set(value)
  const allSelected = selected.size === SECTIONS.length

  function toggle(code: SectionCode) {
    const next = new Set(selected)
    if (next.has(code)) next.delete(code)
    else next.add(code)
    // keep the same order as the list
    onChange(SECTIONS.map((s) => s.code).filter((c) => next.has(c)))
  }

  return (
    <fieldset disabled={disabled}>
      <div className="mb-2 flex items-center justify-between">
        <legend className="text-xs font-medium text-muted-foreground">
          What can they access? <span className="text-destructive">*</span>
        </legend>
        <div className="flex gap-2 text-xs">
          <button type="button" onClick={() => onChange(SECTIONS.map((s) => s.code))} disabled={allSelected}
            className="font-medium text-primary hover:underline disabled:text-muted-foreground disabled:no-underline">
            Select all
          </button>
          <span className="text-border">|</span>
          <button type="button" onClick={() => onChange([])} disabled={selected.size === 0}
            className="font-medium text-primary hover:underline disabled:text-muted-foreground disabled:no-underline">
            Clear
          </button>
        </div>
      </div>

      <div className="space-y-3 rounded-lg border border-border p-3">
        {GROUPS.map((group) => (
          <div key={group}>
            <p className="mb-1 text-[10px] font-semibold uppercase tracking-widest text-muted-foreground/70">{group}</p>
            <div className="space-y-0.5">
              {SECTIONS.filter((s) => s.group === group).map((s) => {
                const checked = selected.has(s.code)
                const note = SECTION_NOTES[s.code]
                return (
                  <label key={s.code}
                    className="flex cursor-pointer items-start gap-2.5 rounded-md px-1.5 py-1.5 hover:bg-muted/50">
                    <input type="checkbox" className="sr-only" checked={checked} onChange={() => toggle(s.code)} />
                    <span aria-hidden className={cn(
                      'mt-0.5 flex h-4 w-4 shrink-0 items-center justify-center rounded border transition-colors',
                      checked ? 'border-primary bg-primary text-primary-foreground' : 'border-border bg-background',
                    )}>
                      {checked && <Check className="h-3 w-3" strokeWidth={3} />}
                    </span>
                    <span className="min-w-0">
                      <span className="block text-sm text-foreground">{s.label}</span>
                      {note && <span className="block text-xs text-muted-foreground">{note}</span>}
                    </span>
                  </label>
                )
              })}
            </div>
          </div>
        ))}
      </div>
      <p className="mt-1.5 text-xs text-muted-foreground">
        {selected.size} of {SECTIONS.length} sections. Each section lets them view and make changes in it.
      </p>
    </fieldset>
  )
}
