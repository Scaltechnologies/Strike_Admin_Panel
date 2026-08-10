import { forwardRef } from 'react'
import type { InputHTMLAttributes } from 'react'
import { cn } from '@/lib/utils'
import { FormError } from './FormError'

interface DatePickerFieldProps extends Omit<InputHTMLAttributes<HTMLInputElement>, 'type'> {
  label?: string
  error?: string
  helperText?: string
  /** 'date' | 'datetime-local' | 'time' | 'month' — defaults to 'date' */
  dateType?: 'date' | 'datetime-local' | 'time' | 'month'
}

export const DatePickerField = forwardRef<HTMLInputElement, DatePickerFieldProps>(
  ({ label, error, helperText, dateType = 'date', className, id, required, ...props }, ref) => {
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
        <input
          ref={ref}
          type={dateType}
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
        />
        <FormError id={errorId} message={error} />
        {!error && helperText && (
          <p className="text-xs text-muted-foreground">{helperText}</p>
        )}
      </div>
    )
  },
)

DatePickerField.displayName = 'DatePickerField'
