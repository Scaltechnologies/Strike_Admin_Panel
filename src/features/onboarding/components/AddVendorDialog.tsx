import { useState, type FormEvent, type ReactNode } from 'react'
import { useNavigate } from '@tanstack/react-router'
import { AnimatePresence, motion } from 'framer-motion'
import { ArrowRight, CreditCard, Dices, Loader2, MapPin, PartyPopper, Store, UtensilsCrossed } from 'lucide-react'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { cn } from '@/lib/utils'
import { hasPermission } from '@/core/auth/auth'
import { apiError, useCreateVendor, type VendorCreateResult } from '../onboarding.api'
import { generatePin, mobileProblem, normalizeMobile, pinProblem } from '../pin'
import { CredentialsCard } from './CredentialsCard'

/** Add one vendor: business details + mobile + starting PIN. Active at once, store created. */
export function AddVendorDialog({ open, onOpenChange }: { open: boolean; onOpenChange: (o: boolean) => void }) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[92vh] overflow-y-auto sm:max-w-xl">
        <AddVendorBody onClose={() => onOpenChange(false)} />
      </DialogContent>
    </Dialog>
  )
}

function AddVendorBody({ onClose }: { onClose: () => void }) {
  const navigate = useNavigate()
  const create = useCreateVendor()
  const [f, setF] = useState({ hotelName: '', mobileNumber: '', pin: generatePin(), address: '', email: '', commission: '', latitude: '', longitude: '' })
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [done, setDone] = useState<(VendorCreateResult & { pin: string; hotelName: string }) | null>(null)
  const set = (k: keyof typeof f, v: string) => { setF((s) => ({ ...s, [k]: v })); setErrors((e) => ({ ...e, [k]: '' })) }

  const submit = (e: FormEvent) => {
    e.preventDefault()
    const errs: Record<string, string> = {}
    if (!f.hotelName.trim()) errs.hotelName = 'Business name is required'
    const m = mobileProblem(f.mobileNumber); if (m) errs.mobileNumber = m
    const p = pinProblem(f.pin); if (p) errs.pin = p
    if (!f.address.trim()) errs.address = 'Address is required'
    if (f.email && !/^[^@\s]+@[^@\s]+\.[^@\s]{2,}$/.test(f.email.trim())) errs.email = 'Enter a valid email or leave it empty'
    const c = f.commission === '' ? null : Number(f.commission)
    if (c != null && (!Number.isFinite(c) || c < 0 || c > 100)) errs.commission = '0 to 100'
    const lat = f.latitude === '' ? null : Number(f.latitude)
    const lng = f.longitude === '' ? null : Number(f.longitude)
    if ((lat == null) !== (lng == null) || (lat != null && (!Number.isFinite(lat) || Math.abs(lat) > 90)) || (lng != null && (!Number.isFinite(lng) || Math.abs(lng) > 180))) {
      errs.latitude = 'Enter both latitude and longitude, or neither'
    }
    setErrors(errs)
    if (Object.values(errs).some(Boolean)) return
    create.mutate({
      hotelName: f.hotelName.trim(), mobileNumber: normalizeMobile(f.mobileNumber), pin: f.pin, address: f.address.trim(),
      email: f.email.trim() || undefined, commissionRate: c, latitude: lat, longitude: lng,
    }, {
      onSuccess: (r) => setDone({ ...r, pin: f.pin, hotelName: f.hotelName.trim() }),
      onError: (err) => setErrors({ form: apiError(err, "Couldn't add the vendor") }),
    })
  }

  // Paste a Google Maps link and pick out the coordinates.
  const fromMapsLink = (text: string) => {
    const m = text.match(/(-?\d{1,2}\.\d+)\s*,\s*(-?\d{1,3}\.\d+)/) ?? text.match(/@(-?\d{1,2}\.\d+),(-?\d{1,3}\.\d+)/)
    if (m) { set('latitude', m[1]); set('longitude', m[2]) }
  }

  const input = (err?: string) => cn('h-10 w-full rounded-lg border bg-background px-3 text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring',
    err ? 'border-destructive' : 'border-border')

  return (
    <AnimatePresence mode="wait">
      {!done ? (
        <motion.div key="form" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, x: -30 }}>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2"><Store className="h-5 w-5 text-primary" /> Add a vendor</DialogTitle>
            <DialogDescription>They’re approved straight away. Share the mobile number and PIN with them — they can change the PIN in the app.</DialogDescription>
          </DialogHeader>
          <form onSubmit={submit} className="mt-4 flex flex-col gap-3.5">
            <Field label="Business / store name" error={errors.hotelName}>
              <input className={input(errors.hotelName)} value={f.hotelName} onChange={(e) => set('hotelName', e.target.value)} placeholder="e.g. Annapurna Mess" autoFocus />
            </Field>
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <Field label="Mobile number (sign-in)" error={errors.mobileNumber}>
                <div className="flex">
                  <span className="flex items-center rounded-l-lg border border-r-0 border-border bg-muted px-2.5 text-sm text-muted-foreground">+91</span>
                  <input className={cn(input(errors.mobileNumber), 'rounded-l-none')} value={f.mobileNumber} onChange={(e) => set('mobileNumber', e.target.value)} inputMode="tel" placeholder="98765 43210" />
                </div>
              </Field>
              <Field label="Starting PIN" error={errors.pin}>
                <div className="flex gap-1.5">
                  <input className={cn(input(errors.pin), 'font-mono tracking-[0.4em]')} value={f.pin} maxLength={4} inputMode="numeric"
                    onChange={(e) => set('pin', e.target.value.replace(/\D/g, '').slice(0, 4))} />
                  <button type="button" onClick={() => set('pin', generatePin())} title="New random PIN"
                    className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg border border-border text-muted-foreground hover:bg-muted hover:text-foreground">
                    <Dices className="h-4 w-4" />
                  </button>
                </div>
              </Field>
            </div>
            <Field label="Address" error={errors.address}>
              <input className={input(errors.address)} value={f.address} onChange={(e) => set('address', e.target.value)} placeholder="Street, area, city" />
            </Field>
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-[1fr_140px]">
              <Field label="Email (optional)" error={errors.email}>
                <input className={input(errors.email)} value={f.email} onChange={(e) => set('email', e.target.value)} type="email" placeholder="owner@example.com" />
              </Field>
              <Field label="Commission % (optional)" error={errors.commission}>
                <input className={input(errors.commission)} value={f.commission} onChange={(e) => set('commission', e.target.value)} inputMode="decimal" placeholder="0" />
              </Field>
            </div>
            <Field label="Store location (optional — needed to show in “nearby”)" error={errors.latitude}>
              <div className="grid grid-cols-[1fr_1fr] gap-2">
                <input className={input(errors.latitude)} value={f.latitude} onChange={(e) => set('latitude', e.target.value)} onPaste={(e) => fromMapsLink(e.clipboardData.getData('text'))} placeholder="Latitude, or paste a Maps link" />
                <input className={input(errors.latitude)} value={f.longitude} onChange={(e) => set('longitude', e.target.value)} placeholder="Longitude" />
              </div>
              <p className="mt-1 flex items-center gap-1 text-[11px] text-muted-foreground"><MapPin className="h-3 w-3" /> Tip: paste a Google Maps link into the first box to fill both.</p>
            </Field>
            {errors.form && <p className="rounded-lg bg-destructive/10 px-3 py-2 text-sm text-destructive">{errors.form}</p>}
            <div className="flex justify-end gap-2 pt-1">
              <button type="button" onClick={onClose} className="h-10 rounded-lg border border-border px-4 text-sm font-medium hover:bg-muted">Cancel</button>
              <button type="submit" disabled={create.isPending}
                className="btn-shine flex h-10 items-center gap-2 rounded-lg bg-gradient-to-r from-[#e01a00] to-orange-500 px-5 text-sm font-semibold text-white shadow-md shadow-orange-500/25 disabled:opacity-60">
                {create.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <ArrowRight className="h-4 w-4" />} Create vendor
              </button>
            </div>
          </form>
        </motion.div>
      ) : (
        <motion.div key="done" initial={{ opacity: 0, x: 30 }} animate={{ opacity: 1, x: 0 }} className="flex flex-col gap-4">
          <div className="flex flex-col items-center text-center">
            <motion.span initial={{ scale: 0, rotate: -30 }} animate={{ scale: 1, rotate: 0 }} transition={{ type: 'spring', stiffness: 260, damping: 12 }}
              className="flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-emerald-400 to-teal-600 text-white shadow-lg shadow-emerald-500/30">
              <PartyPopper className="h-7 w-7" />
            </motion.span>
            <h2 className="mt-3 text-lg font-bold text-foreground">{done.hotelName} is live!</h2>
            <p className="text-sm text-muted-foreground">Their store is created and approved. Send them these sign-in details.</p>
          </div>
          <CredentialsCard hotelName={done.hotelName} mobileNumber={done.mobileNumber ?? f.mobileNumber} pin={done.pin} />
          <div>
            <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">Next, set up their store</p>
            <div className="grid grid-cols-1 gap-2 sm:grid-cols-3">
              {done.storeId != null && hasPermission('SEC_MENUS') && (
                <NextStep icon={UtensilsCrossed} label="Upload menu" onClick={() => { onClose(); void navigate({ to: '/menus/$storeId', params: { storeId: String(done.storeId) }, search: { upload: true } }) }} />
              )}
              {done.storeId != null && hasPermission('SEC_MENUS') && (
                <NextStep icon={CreditCard} label="Create a card" onClick={() => { onClose(); void navigate({ to: '/menus/$storeId', params: { storeId: String(done.storeId) }, search: { card: true } }) }} />
              )}
              {done.vendorId != null && (
                <NextStep icon={Store} label="Open vendor" onClick={() => { onClose(); void navigate({ to: '/vendors/$vendorId', params: { vendorId: String(done.vendorId) }, search: { tab: undefined } }) }} />
              )}
            </div>
          </div>
          <button type="button" onClick={() => { setDone(null); setF({ hotelName: '', mobileNumber: '', pin: generatePin(), address: '', email: '', commission: '', latitude: '', longitude: '' }) }}
            className="text-sm font-medium text-primary hover:underline">Add another vendor</button>
        </motion.div>
      )}
    </AnimatePresence>
  )
}

function Field({ label, error, children }: { label: string; error?: string; children: ReactNode }) {
  return (
    <label className="flex flex-col gap-1.5">
      <span className="text-xs font-medium text-muted-foreground">{label}</span>
      {children}
      {error && <span className="text-[11px] font-medium text-destructive">{error}</span>}
    </label>
  )
}

function NextStep({ icon: Icon, label, onClick }: { icon: typeof Store; label: string; onClick: () => void }) {
  return (
    <motion.button type="button" whileHover={{ y: -2 }} onClick={onClick}
      className="flex items-center gap-2 rounded-xl border border-border bg-card px-3 py-2.5 text-left text-sm font-medium hover:border-primary/40 hover:bg-primary/5">
      <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10 text-primary"><Icon className="h-4 w-4" /></span>{label}
    </motion.button>
  )
}
