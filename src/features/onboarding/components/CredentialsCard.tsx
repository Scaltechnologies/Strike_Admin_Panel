import { useState } from 'react'
import { motion } from 'framer-motion'
import { Check, Copy, Eye, EyeOff, KeyRound, MessageCircle, Smartphone } from 'lucide-react'
import { toast } from 'sonner'
import { cn } from '@/lib/utils'
import { normalizeMobile, welcomeMessage, whatsappLink } from '../pin'

/** The sign-in details to hand to a vendor: copy the message, or open it in WhatsApp. */
export function CredentialsCard({ hotelName, mobileNumber, pin, className }: { hotelName: string; mobileNumber: string; pin: string; className?: string }) {
  const [show, setShow] = useState(true)
  const [copied, setCopied] = useState(false)
  const message = welcomeMessage({ hotelName, mobileNumber, pin })
  const copy = async () => {
    await navigator.clipboard.writeText(message)
    setCopied(true)
    toast.success('Message copied — paste it in WhatsApp or SMS')
    setTimeout(() => setCopied(false), 2000)
  }
  return (
    <div className={cn('overflow-hidden rounded-2xl border border-border bg-card', className)}>
      <div className="relative overflow-hidden bg-gradient-to-br from-[#3a0700] via-[#e01a00] to-[#ff8a00] px-5 py-4 text-white">
        <div className="pointer-events-none absolute -right-8 -top-10 h-32 w-32 rounded-full bg-white/15 blur-2xl" aria-hidden />
        <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-white/75">Strike Vendor app sign-in</p>
        <p className="mt-0.5 truncate text-lg font-bold">{hotelName}</p>
        <div className="mt-3 grid grid-cols-2 gap-3">
          <div>
            <p className="flex items-center gap-1 text-[10px] uppercase tracking-wider text-white/70"><Smartphone className="h-3 w-3" />Mobile</p>
            <p className="font-mono text-lg font-bold tracking-wide">{normalizeMobile(mobileNumber)}</p>
          </div>
          <div>
            <p className="flex items-center gap-1 text-[10px] uppercase tracking-wider text-white/70"><KeyRound className="h-3 w-3" />PIN</p>
            <p className="flex items-center gap-2 font-mono text-lg font-bold tracking-[0.3em]">
              {show ? pin : '••••'}
              <button type="button" onClick={() => setShow((s) => !s)} aria-label={show ? 'Hide PIN' : 'Show PIN'} className="rounded p-0.5 text-white/80 hover:bg-white/15">
                {show ? <EyeOff className="h-3.5 w-3.5" /> : <Eye className="h-3.5 w-3.5" />}
              </button>
            </p>
          </div>
        </div>
      </div>
      <div className="flex flex-wrap gap-2 p-3">
        <motion.button type="button" whileTap={{ scale: 0.97 }} onClick={() => void copy()}
          className="flex flex-1 items-center justify-center gap-1.5 rounded-lg border border-border px-3 py-2 text-xs font-semibold hover:bg-muted">
          {copied ? <Check className="h-4 w-4 text-emerald-600" /> : <Copy className="h-4 w-4" />} {copied ? 'Copied' : 'Copy message'}
        </motion.button>
        <a href={whatsappLink(mobileNumber, message)} target="_blank" rel="noreferrer"
          className="flex flex-1 items-center justify-center gap-1.5 rounded-lg bg-[#25D366] px-3 py-2 text-xs font-semibold text-white shadow-sm hover:brightness-95">
          <MessageCircle className="h-4 w-4" /> Send on WhatsApp
        </a>
      </div>
    </div>
  )
}
