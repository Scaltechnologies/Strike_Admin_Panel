import { forwardRef } from 'react'
import type { InputHTMLAttributes } from 'react'
import { cn } from '@/lib/utils'

interface CheckboxFieldProps extends Omit<InputHTMLAttributes<HTMLInputElement>, 'type'> {
  label: string
  error?: string
}

export const CheckboxField = forwardRef<HTMLInputElement, CheckboxFieldProps>(
  ({ label, error, className, id, ...props }, ref) => {
    const fieldId = id ?? label.toLowerCase().replace(/\s+/g, '-')

    return (
      <div className="space-y-1">
        <div className="flex items-center gap-2.5">
          <input
            ref={ref}
            type="checkbox"
            id={fieldId}
            className={cn(
              'h-4 w-4 rounded border border-border bg-background text-primary',
              'accent-primary focus:outline-none focus:ring-2 focus:ring-primary/20 focus:ring-offset-1',
              'disabled:cursor-not-allowed disabled:opacity-50',
              className,
            )}
            {...props}
          />
          <label htmlFor={fieldId} className="text-sm text-foreground select-none cursor-pointer">
            {label}
          </label>
        </div>
        {error && <p role="alert" className="text-xs text-destructive">{error}</p>}
      </div>
    )
  },
)

CheckboxField.displayName = 'CheckboxField'
