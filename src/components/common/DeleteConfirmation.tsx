import { ConfirmationDialog } from './ConfirmationDialog'

interface DeleteConfirmationProps {
  open: boolean
  title?: string
  description?: string
  itemName?: string
  onConfirm: () => void
  onCancel: () => void
  isLoading?: boolean
}

export function DeleteConfirmation({
  open,
  title,
  description,
  itemName,
  onConfirm,
  onCancel,
  isLoading = false,
}: DeleteConfirmationProps) {
  const resolvedTitle = title ?? `Delete ${itemName ?? 'item'}?`
  const resolvedDescription =
    description ??
    (itemName
      ? `Are you sure you want to delete "${itemName}"? This action cannot be undone.`
      : 'Are you sure you want to delete this item? This action cannot be undone.')

  return (
    <ConfirmationDialog
      open={open}
      title={resolvedTitle}
      description={resolvedDescription}
      onConfirm={onConfirm}
      onCancel={onCancel}
      confirmLabel="Delete"
      cancelLabel="Cancel"
      variant="destructive"
      isLoading={isLoading}
    />
  )
}
