interface FormErrorProps {
  message?: string
  id?: string
}

export function FormError({ message, id }: FormErrorProps) {
  if (!message) return null
  return (
    <p id={id} role="alert" className="text-xs text-destructive">
      {message}
    </p>
  )
}
