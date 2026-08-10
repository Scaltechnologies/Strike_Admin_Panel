import { forwardRef } from 'react'
import type { SelectHTMLAttributes } from 'react'
import { cn } from '@/lib/utils'
import { FormError } from './FormError'

export interface SelectOption {
  value: string
  label: string
  disabled?: boolean
}

interface SelectFieldProps extends SelectHTMLAttributes<HTMLSelectElement> {
  label?: string
  error?: string
  helperText?: string
  options: SelectOption[]
  placeholder?: string
}

export const SelectField = forwardRef<HTMLSelectElement, SelectFieldProps>(
  ({ label, error, helperText, options, placeholder, className, id, required, ...props }, ref) => {
    const fieldId = id ?? (label ? label.toLowerCase().replace(/\s+/g, '-') : undefined)
    const errorId = fieldId ? `${fieldId}-error` : undefined

    return (
      <div className="space-y-1.5">
        {label && (
          <label htmlFor={fieldId} className="block text-sm font-medium text-foreground">
            {label}
            {required && <span className="ml-0.5 text-destructive" aria-hidden>*</span>}
          </label>
        )}
        <select
          ref={ref}
          id={fieldId}
          required={required}
          aria-invalid={!!error}
          aria-describedby={error ? errorId : undefined}
          className={cn(
            'block w-full rounded-lg border border-border bg-background px-3 py-2.5 text-sm text-foreground',
            'transition-colors focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20',
            'disabled:cursor-not-allowed disabled:opacity-50',
            error && 'border-destructive focus:border-destructive focus:ring-destructive/20',
            className,
          )}
          {...props}
        >
          {placeholder && (
            <option value="" disabled>
              {placeholder}
            </option>
          )}
          {options.map((opt) => (
            <option key={opt.value} value={opt.value} disabled={opt.disabled}>
              {opt.label}
            </option>
          ))}
        </select>
        <FormError id={errorId} message={error} />
        {!error && helperText && (
          <p className="text-xs text-muted-foreground">{helperText}</p>
        )}
      </div>
    )
  },
)

SelectField.displayName = 'SelectField'
