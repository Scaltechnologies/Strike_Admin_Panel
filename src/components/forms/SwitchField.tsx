import type { ReactNode } from 'react'
import { cn } from '@/lib/utils'

interface SwitchFieldProps {
  checked: boolean
  onChange: (checked: boolean) => void
  label?: string
  description?: string
  disabled?: boolean
  id?: string
  children?: ReactNode
}

export function SwitchField({
  checked,
  onChange,
  label,
  description,
  disabled = false,
  id,
  children,
}: SwitchFieldProps) {
  const fieldId = id ?? (label ? label.toLowerCase().replace(/\s+/g, '-') : undefined)

  return (
    <div className="flex items-start gap-3">
      <button
        type="button"
        role="switch"
        id={fieldId}
        aria-checked={checked}
        disabled={disabled}
        onClick={() => onChange(!checked)}
        className={cn(
          'relative mt-0.5 inline-flex h-5 w-9 shrink-0 cursor-pointer rounded-full border-2 border-transparent',
          'transition-colors focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2',
          'disabled:cursor-not-allowed disabled:opacity-50',
          checked ? 'bg-primary' : 'bg-muted-foreground/30',
        )}
      >
        <span
          aria-hidden
          className={cn(
            'pointer-events-none inline-block h-4 w-4 rounded-full bg-white shadow ring-0 transition-transform',
            checked ? 'translate-x-4' : 'translate-x-0',
          )}
        />
      </button>

      {(label ?? children) && (
        <div className="flex flex-col">
          {label && (
            <label
              htmlFor={fieldId}
              className={cn(
                'text-sm font-medium text-foreground',
                !disabled && 'cursor-pointer',
              )}
            >
              {label}
            </label>
          )}
          {description && (
            <p className="text-xs text-muted-foreground">{description}</p>
          )}
          {children}
        </div>
      )}
    </div>
  )
}
