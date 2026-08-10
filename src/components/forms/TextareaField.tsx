import { forwardRef } from 'react'
import type { TextareaHTMLAttributes } from 'react'
import { cn } from '@/lib/utils'
import { FormError } from './FormError'

interface TextareaFieldProps extends TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string
  error?: string
  helperText?: string
}

export const TextareaField = forwardRef<HTMLTextAreaElement, TextareaFieldProps>(
  ({ label, error, helperText, className, id, required, rows = 4, ...props }, ref) => {
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
        <textarea
          ref={ref}
          id={fieldId}
          rows={rows}
          required={required}
          aria-invalid={!!error}
          aria-describedby={error ? errorId : undefined}
          className={cn(
            'block w-full resize-y rounded-lg border border-border bg-background px-3 py-2.5 text-sm text-foreground',
            'placeholder:text-muted-foreground',
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

TextareaField.displayName = 'TextareaField'
