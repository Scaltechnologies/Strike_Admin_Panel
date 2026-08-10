import { forwardRef } from 'react'
import type { InputHTMLAttributes } from 'react'
import { cn } from '@/lib/utils'
import { FormError } from './FormError'

interface FileUploadFieldProps extends Omit<InputHTMLAttributes<HTMLInputElement>, 'type'> {
  label?: string
  error?: string
  helperText?: string
  dragAndDrop?: boolean
}

export const FileUploadField = forwardRef<HTMLInputElement, FileUploadFieldProps>(
  ({ label, error, helperText, dragAndDrop = false, className, id, required, ...props }, ref) => {
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
        {dragAndDrop ? (
          <label
            htmlFor={fieldId}
            className={cn(
              'flex cursor-pointer flex-col items-center justify-center gap-2 rounded-lg border-2 border-dashed border-border bg-muted/30 px-6 py-8',
              'transition-colors hover:border-primary hover:bg-primary/5',
              error && 'border-destructive',
              className,
            )}
          >
            <svg
              className="h-8 w-8 text-muted-foreground"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={1.5}
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5m-13.5-9L12 3m0 0l4.5 4.5M12 3v13.5"
              />
            </svg>
            <span className="text-sm text-muted-foreground">
              <span className="font-medium text-primary">Click to upload</span> or drag and drop
            </span>
            {helperText && <span className="text-xs text-muted-foreground">{helperText}</span>}
            <input
              ref={ref}
              type="file"
              id={fieldId}
              required={required}
              aria-invalid={!!error}
              aria-describedby={error ? errorId : undefined}
              className="sr-only"
              {...props}
            />
          </label>
        ) : (
          <input
            ref={ref}
            type="file"
            id={fieldId}
            required={required}
            aria-invalid={!!error}
            aria-describedby={error ? errorId : undefined}
            className={cn(
              'block w-full rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground',
              'file:mr-3 file:rounded file:border-0 file:bg-primary file:px-3 file:py-1 file:text-xs file:font-medium file:text-primary-foreground',
              'focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20',
              'disabled:cursor-not-allowed disabled:opacity-50',
              error && 'border-destructive focus:border-destructive focus:ring-destructive/20',
              className,
            )}
            {...props}
          />
        )}
        <FormError id={errorId} message={error} />
        {!error && !dragAndDrop && helperText && (
          <p className="text-xs text-muted-foreground">{helperText}</p>
        )}
      </div>
    )
  },
)

FileUploadField.displayName = 'FileUploadField'
