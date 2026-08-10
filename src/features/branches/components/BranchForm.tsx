import { useState, useEffect } from 'react'
import { X, MapPin, Phone, Mail, Ruler } from 'lucide-react'
import { cn } from '@/lib/utils'
import { useCreateBranch, useUpdateBranch } from '../hooks/useBranches'
import type { Branch, BranchRequest } from '../types/branch.types'

const INPUT_CLS =
  'block w-full rounded-lg border border-border bg-background px-3 py-2 text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring disabled:opacity-60'

interface BranchFormProps {
  branch?: Branch
  onClose: () => void
}

export function BranchForm({ branch, onClose }: BranchFormProps) {
  const isEdit = !!branch

  const [form, setForm] = useState({
    name: branch?.name ?? '',
    city: branch?.city ?? '',
    state: branch?.state ?? '',
    country: branch?.country ?? '',
    address: branch?.address ?? '',
    radiusKm: branch?.radiusKm != null ? String(branch.radiusKm) : '',
    latitude: branch?.latitude != null ? String(branch.latitude) : '',
    longitude: branch?.longitude != null ? String(branch.longitude) : '',
    contactEmail: branch?.contactEmail ?? '',
    contactPhone: branch?.contactPhone ?? '',
  })

  const { mutate: create, isPending: isCreating } = useCreateBranch()
  const { mutate: update, isPending: isUpdating } = useUpdateBranch()
  const isPending = isCreating || isUpdating

  function setField(field: keyof typeof form, value: string) {
    setForm((prev) => ({ ...prev, [field]: value }))
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!form.name.trim()) return

    const payload: BranchRequest = {
      name: form.name.trim(),
      ...(form.city.trim() && { city: form.city.trim() }),
      ...(form.state.trim() && { state: form.state.trim() }),
      ...(form.country.trim() && { country: form.country.trim() }),
      ...(form.address.trim() && { address: form.address.trim() }),
      ...(form.radiusKm && { radiusKm: Number(form.radiusKm) }),
      ...(form.latitude && { latitude: Number(form.latitude) }),
      ...(form.longitude && { longitude: Number(form.longitude) }),
      ...(form.contactEmail.trim() && { contactEmail: form.contactEmail.trim() }),
      ...(form.contactPhone.trim() && { contactPhone: form.contactPhone.trim() }),
    }

    if (isEdit) {
      update({ id: branch.id, req: payload }, { onSuccess: onClose })
    } else {
      create(payload, { onSuccess: onClose })
    }
  }

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    document.addEventListener('keydown', handler)
    return () => document.removeEventListener('keydown', handler)
  }, [onClose])

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
      <div
        className="fixed inset-0 bg-black/40 backdrop-blur-sm"
        onClick={onClose}
        aria-hidden
      />
      <form
        onSubmit={handleSubmit}
        className="relative z-10 flex w-full max-w-lg flex-col rounded-2xl border border-border bg-card shadow-2xl"
      >
        {/* Header */}
        <div className="flex items-center justify-between border-b border-border px-5 py-4">
          <div>
            <p className="font-semibold text-foreground">
              {isEdit ? 'Edit Branch' : 'New Branch'}
            </p>
            <p className="text-xs text-muted-foreground">
              {isEdit
                ? `Editing branch #${branch.id}`
                : 'Create a new operational branch'}
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="flex h-7 w-7 items-center justify-center rounded-lg text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Body */}
        <div className="max-h-[60vh] overflow-y-auto p-5">
          <div className="space-y-4">
            {/* Name */}
            <div>
              <label className="mb-1.5 block text-xs font-medium text-muted-foreground">
                Branch Name <span className="text-destructive">*</span>
              </label>
              <input
                type="text"
                required
                value={form.name}
                onChange={(e) => setField('name', e.target.value)}
                placeholder="e.g. Mumbai Central"
                disabled={isPending}
                className={INPUT_CLS}
              />
            </div>

            {/* Location */}
            <div className="grid grid-cols-3 gap-3">
              <div>
                <label className="mb-1.5 block text-xs font-medium text-muted-foreground">
                  City
                </label>
                <input
                  type="text"
                  value={form.city}
                  onChange={(e) => setField('city', e.target.value)}
                  placeholder="Mumbai"
                  disabled={isPending}
                  className={INPUT_CLS}
                />
              </div>
              <div>
                <label className="mb-1.5 block text-xs font-medium text-muted-foreground">
                  State
                </label>
                <input
                  type="text"
                  value={form.state}
                  onChange={(e) => setField('state', e.target.value)}
                  placeholder="Maharashtra"
                  disabled={isPending}
                  className={INPUT_CLS}
                />
              </div>
              <div>
                <label className="mb-1.5 block text-xs font-medium text-muted-foreground">
                  Country
                </label>
                <input
                  type="text"
                  value={form.country}
                  onChange={(e) => setField('country', e.target.value)}
                  placeholder="India"
                  disabled={isPending}
                  className={INPUT_CLS}
                />
              </div>
            </div>

            {/* Address */}
            <div>
              <label className="mb-1.5 flex items-center gap-1 text-xs font-medium text-muted-foreground">
                <MapPin className="h-3 w-3" aria-hidden />
                Address
              </label>
              <input
                type="text"
                value={form.address}
                onChange={(e) => setField('address', e.target.value)}
                placeholder="Full street address"
                disabled={isPending}
                className={INPUT_CLS}
              />
            </div>

            {/* Radius */}
            <div>
              <label className="mb-1.5 flex items-center gap-1 text-xs font-medium text-muted-foreground">
                <Ruler className="h-3 w-3" aria-hidden />
                Operational Radius (km)
              </label>
              <input
                type="number"
                min={0.1}
                step={0.5}
                value={form.radiusKm}
                onChange={(e) => setField('radiusKm', e.target.value)}
                placeholder="10"
                disabled={isPending}
                className={INPUT_CLS}
              />
            </div>

            {/* Lat/Lng */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="mb-1.5 block text-xs font-medium text-muted-foreground">
                  Latitude
                </label>
                <input
                  type="number"
                  step="any"
                  value={form.latitude}
                  onChange={(e) => setField('latitude', e.target.value)}
                  placeholder="18.9388"
                  disabled={isPending}
                  className={cn(INPUT_CLS, 'font-mono')}
                />
              </div>
              <div>
                <label className="mb-1.5 block text-xs font-medium text-muted-foreground">
                  Longitude
                </label>
                <input
                  type="number"
                  step="any"
                  value={form.longitude}
                  onChange={(e) => setField('longitude', e.target.value)}
                  placeholder="72.8354"
                  disabled={isPending}
                  className={cn(INPUT_CLS, 'font-mono')}
                />
              </div>
            </div>

            {/* Contact */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="mb-1.5 flex items-center gap-1 text-xs font-medium text-muted-foreground">
                  <Mail className="h-3 w-3" aria-hidden />
                  Contact Email
                </label>
                <input
                  type="email"
                  value={form.contactEmail}
                  onChange={(e) => setField('contactEmail', e.target.value)}
                  placeholder="branch@example.com"
                  disabled={isPending}
                  className={INPUT_CLS}
                />
              </div>
              <div>
                <label className="mb-1.5 flex items-center gap-1 text-xs font-medium text-muted-foreground">
                  <Phone className="h-3 w-3" aria-hidden />
                  Contact Phone
                </label>
                <input
                  type="tel"
                  value={form.contactPhone}
                  onChange={(e) => setField('contactPhone', e.target.value)}
                  placeholder="+91 98765 43210"
                  disabled={isPending}
                  className={cn(INPUT_CLS, 'font-mono')}
                />
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-3 border-t border-border px-5 py-4">
          <button
            type="button"
            onClick={onClose}
            disabled={isPending}
            className="rounded-lg border border-border px-4 py-2 text-sm font-medium text-foreground transition-colors hover:bg-muted disabled:opacity-60"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={isPending || !form.name.trim()}
            className="rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90 disabled:opacity-60"
          >
            {isPending
              ? isEdit
                ? 'Saving…'
                : 'Creating…'
              : isEdit
                ? 'Save Changes'
                : 'Create Branch'}
          </button>
        </div>
      </form>
    </div>
  )
}
