import type { ReactNode } from 'react'
import type { Control, FieldPath, FieldValues } from 'react-hook-form'
import { Controller } from 'react-hook-form'

interface FormFieldProps<
  TFieldValues extends FieldValues,
  TName extends FieldPath<TFieldValues>,
> {
  control: Control<TFieldValues>
  name: TName
  render: (props: {
    value: TFieldValues[TName]
    onChange: (...event: unknown[]) => void
    onBlur: () => void
    error?: string
    name: TName
  }) => ReactNode
}

export function FormField<
  TFieldValues extends FieldValues,
  TName extends FieldPath<TFieldValues>,
>({ control, name, render }: FormFieldProps<TFieldValues, TName>) {
  return (
    <Controller
      control={control}
      name={name}
      render={({ field, fieldState }) =>
        render({
          value: field.value as TFieldValues[TName],
          onChange: field.onChange,
          onBlur: field.onBlur,
          error: fieldState.error?.message,
          name,
        }) as React.ReactElement
      }
    />
  )
}
