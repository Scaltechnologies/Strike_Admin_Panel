import { useState } from 'react'
import { Dices, KeyRound, Loader2 } from 'lucide-react'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { cn } from '@/lib/utils'
import { useSetVendorPin } from '../onboarding.api'
import { generatePin, pinProblem } from '../pin'
import { CredentialsCard } from './CredentialsCard'

/** Give a vendor a new sign-in PIN (e.g. they can't get the "Forgot PIN" OTP). */
export function SetPinDialog({ open, onOpenChange, vendorId, hotelName, mobileNumber }: {
  open: boolean; onOpenChange: (o: boolean) => void; vendorId: number; hotelName: string; mobileNumber: string
}) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <Body vendorId={vendorId} hotelName={hotelName} mobileNumber={mobileNumber} onClose={() => onOpenChange(false)} />
      </DialogContent>
    </Dialog>
  )
}

function Body({ vendorId, hotelName, mobileNumber, onClose }: { vendorId: number; hotelName: string; mobileNumber: string; onClose: () => void }) {
  const [pin, setPin] = useState(generatePin())
  const [saved, setSaved] = useState(false)
  const save = useSetVendorPin()
  const problem = pinProblem(pin)
  return (
    <>
      <DialogHeader>
        <DialogTitle className="flex items-center gap-2"><KeyRound className="h-5 w-5 text-primary" /> {saved ? 'New PIN saved' : 'Set a new PIN'}</DialogTitle>
        <DialogDescription>{saved ? 'The old PIN no longer works. Send them the new one.' : `${hotelName} will sign in with this PIN from now on. It also unlocks them if they were locked out.`}</DialogDescription>
      </DialogHeader>
      {saved ? (
        <div className="mt-3 flex flex-col gap-3">
          <CredentialsCard hotelName={hotelName} mobileNumber={mobileNumber} pin={pin} />
          <button type="button" onClick={onClose} className="h-10 rounded-lg border border-border text-sm font-medium hover:bg-muted">Done</button>
        </div>
      ) : (
        <div className="mt-3 flex flex-col gap-3">
          <div className="flex gap-2">
            <input value={pin} maxLength={4} inputMode="numeric" aria-label="New PIN" onChange={(e) => setPin(e.target.value.replace(/\D/g, '').slice(0, 4))}
              className={cn('h-14 flex-1 rounded-xl border bg-background text-center font-mono text-2xl font-bold tracking-[0.6em] focus:outline-none focus:ring-2 focus:ring-ring', problem ? 'border-destructive' : 'border-border')} />
            <button type="button" onClick={() => setPin(generatePin())} title="New random PIN" className="flex h-14 w-14 items-center justify-center rounded-xl border border-border text-muted-foreground hover:bg-muted">
              <Dices className="h-5 w-5" />
            </button>
          </div>
          {problem && <p className="text-xs font-medium text-destructive">{problem}</p>}
          <div className="flex justify-end gap-2">
            <button type="button" onClick={onClose} className="h-10 rounded-lg border border-border px-4 text-sm font-medium hover:bg-muted">Cancel</button>
            <button type="button" disabled={!!problem || save.isPending} onClick={() => save.mutate({ vendorId, pin }, { onSuccess: () => setSaved(true) })}
              className="flex h-10 items-center gap-2 rounded-lg bg-gradient-to-r from-[#e01a00] to-orange-500 px-5 text-sm font-semibold text-white shadow-md disabled:opacity-60">
              {save.isPending && <Loader2 className="h-4 w-4 animate-spin" />} Save PIN
            </button>
          </div>
        </div>
      )}
    </>
  )
}
