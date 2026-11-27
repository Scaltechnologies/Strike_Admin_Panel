import { useState, type PointerEvent } from 'react'
import { motion, useMotionTemplate, useMotionValue, useSpring, useTransform } from 'framer-motion'
import { Wifi } from 'lucide-react'
import { cn } from '@/lib/utils'
import { formatInrFull } from '@/features/vendors/utils/vendor-meta'
import { cardTheme, validityLabel } from '../utils/card-meta'

export interface CardFace {
  id: number
  name: string
  vendorName?: string | null
  storeName?: string | null
  walletAmount: number
  cardPrice: number
  validityInDays: number | null
  isActive: boolean
  imageUrl?: string | null
  categories?: string[]
}

/**
 * A membership card drawn like a real plastic card. It tilts towards the pointer with a moving glare;
 * with `flippable` a tap turns it over to show the back.
 */
export function StrikeCardVisual({ card, className, flippable = false, tilt = true, size = 'md', sheenDelay = 0 }: {
  card: CardFace
  className?: string
  flippable?: boolean
  tilt?: boolean
  size?: 'md' | 'lg'
  sheenDelay?: number
}) {
  const theme = cardTheme(card)
  const [flipped, setFlipped] = useState(false)
  const [imageOk, setImageOk] = useState(true)
  const px = useMotionValue(0.5)
  const py = useMotionValue(0.5)
  const rx = useSpring(useTransform(py, [0, 1], [12, -12]), { stiffness: 220, damping: 20 })
  const ry = useSpring(useTransform(px, [0, 1], [-14, 14]), { stiffness: 220, damping: 20 })
  const gx = useTransform(px, [0, 1], ['0%', '100%'])
  const gy = useTransform(py, [0, 1], ['0%', '100%'])
  const glare = useMotionTemplate`radial-gradient(circle at ${gx} ${gy}, rgba(255,255,255,0.38), transparent 55%)`

  const move = (e: PointerEvent<HTMLDivElement>) => {
    if (!tilt || e.pointerType === 'touch') return
    const r = e.currentTarget.getBoundingClientRect()
    px.set((e.clientX - r.left) / r.width)
    py.set((e.clientY - r.top) / r.height)
  }
  const leave = () => { px.set(0.5); py.set(0.5) }
  const lg = size === 'lg'
  const brand = card.vendorName || card.storeName || 'Strike partner'

  return (
    <div className={cn('[perspective:1200px]', className)} onPointerMove={move} onPointerLeave={leave}>
      <motion.div
        style={tilt ? { rotateX: rx, rotateY: ry } : undefined}
        className="strike-card relative aspect-[1.586/1] w-full"
      >
        <motion.div
          className={cn('strike-card relative h-full w-full', flippable && 'cursor-pointer')}
          animate={{ rotateY: flipped ? 180 : 0 }}
          transition={{ type: 'spring', stiffness: 160, damping: 20 }}
          onClick={flippable ? () => setFlipped((f) => !f) : undefined}
          role={flippable ? 'button' : undefined}
          aria-label={flippable ? (flipped ? 'Show the front of the card' : 'Turn the card over') : undefined}
          tabIndex={flippable ? 0 : undefined}
          onKeyDown={flippable ? (e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); setFlipped((f) => !f) } } : undefined}
        >
          {/* Front */}
          <div
            className={cn('strike-card-face strike-card-sheen absolute inset-0 overflow-hidden rounded-[1.1rem] shadow-2xl ring-1 ring-white/15', theme.shadow, !card.isActive && 'grayscale-[0.7]')}
            style={{ background: theme.background, ['--sheen-delay' as string]: `${sheenDelay}s` }}
          >
            {card.imageUrl && imageOk && (
              <img src={card.imageUrl} alt="" onError={() => setImageOk(false)} draggable={false}
                className="absolute inset-0 h-full w-full object-cover opacity-25 mix-blend-overlay" />
            )}
            <div className="pointer-events-none absolute -right-16 -top-20 h-56 w-56 rounded-full bg-white/10 blur-2xl" aria-hidden />
            <div className="pointer-events-none absolute -bottom-24 -left-10 h-56 w-56 rounded-full bg-black/20 blur-2xl" aria-hidden />
            <svg className="pointer-events-none absolute inset-0 h-full w-full opacity-[0.12]" viewBox="0 0 400 252" preserveAspectRatio="none" aria-hidden>
              {Array.from({ length: 7 }).map((_, i) => (
                <path key={i} d={`M-20 ${200 - i * 18} C 120 ${120 - i * 22}, 260 ${300 - i * 26}, 420 ${150 - i * 18}`} fill="none" stroke="white" strokeWidth="1" />
              ))}
            </svg>
            {tilt && <motion.div className="pointer-events-none absolute inset-0" style={{ background: glare }} aria-hidden />}

            <div className={cn('relative flex h-full flex-col justify-between', lg ? 'p-6' : 'p-4', theme.text)}>
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <p className={cn('truncate font-semibold uppercase tracking-[0.18em] opacity-75', lg ? 'text-[11px]' : 'text-[9px]')}>{brand}</p>
                  <p className={cn('mt-0.5 truncate font-bold leading-tight drop-shadow-sm', lg ? 'text-2xl' : 'text-base')}>{card.name}</p>
                </div>
                <span className="flex shrink-0 items-center gap-1">
                  <img src="/strike-bolt.png" alt="" aria-hidden draggable={false} className={cn('drop-shadow', lg ? 'h-8 w-8' : 'h-6 w-6')} />
                </span>
              </div>

              <div className="flex items-center gap-3">
                <span className={cn('relative overflow-hidden rounded-md bg-gradient-to-br from-yellow-200 via-amber-300 to-yellow-600 shadow-inner', lg ? 'h-9 w-12' : 'h-7 w-9')} aria-hidden>
                  <span className="absolute inset-x-0 top-1/3 h-px bg-amber-700/40" />
                  <span className="absolute inset-x-0 top-2/3 h-px bg-amber-700/40" />
                  <span className="absolute inset-y-0 left-1/2 w-px bg-amber-700/40" />
                </span>
                <Wifi className={cn('rotate-90 opacity-70', lg ? 'h-6 w-6' : 'h-4 w-4')} aria-hidden />
                {!card.isActive && (
                  <span className="ml-auto rounded-full bg-black/40 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-white">Paused</span>
                )}
              </div>

              <div className="flex items-end justify-between gap-3">
                <div>
                  <p className={cn('uppercase tracking-widest opacity-70', lg ? 'text-[10px]' : 'text-[8px]')}>Wallet value</p>
                  <p className={cn('font-mono font-bold tabular-nums tracking-wide drop-shadow-sm', lg ? 'text-3xl' : 'text-xl')}>{formatInrFull(card.walletAmount)}</p>
                </div>
                <div className="text-right">
                  <p className={cn('uppercase tracking-widest opacity-70', lg ? 'text-[10px]' : 'text-[8px]')}>{validityLabel(card.validityInDays)}</p>
                  <p className={cn('font-semibold tabular-nums', lg ? 'text-base' : 'text-xs')}>for {formatInrFull(card.cardPrice)}</p>
                </div>
              </div>
            </div>
          </div>

          {/* Back */}
          {flippable && (
            <div className={cn('strike-card-face strike-card-back absolute inset-0 overflow-hidden rounded-[1.1rem] shadow-2xl ring-1 ring-white/15', theme.shadow)}
              style={{ background: theme.background }}>
              <div className="absolute inset-0 bg-black/35" aria-hidden />
              <div className="relative mt-[9%] h-[18%] w-full bg-black/80" aria-hidden />
              <div className={cn('relative flex h-[73%] flex-col justify-between', lg ? 'p-6 pt-4' : 'p-4 pt-3', theme.text)}>
                <div className="flex items-center gap-3">
                  <div className="flex h-9 flex-1 items-center justify-end rounded bg-white/85 px-3 font-mono text-sm italic text-neutral-700">
                    STRIKE-{String(card.id).padStart(4, '0')}
                  </div>
                  <span className="strike-card-holo h-10 w-10 shrink-0 rounded-full opacity-90 ring-2 ring-white/40" aria-hidden />
                </div>
                <div className="space-y-1 text-[11px] leading-snug opacity-90">
                  <p>Pay {formatInrFull(card.cardPrice)}, get {formatInrFull(card.walletAmount)} to spend at {brand}.</p>
                  <p>{card.validityInDays ? `Valid ${card.validityInDays} days from purchase.` : 'Does not expire.'}</p>
                  {card.categories && card.categories.length > 0 && <p className="truncate">Works on: {card.categories.join(', ')}</p>}
                </div>
                <p className="text-[9px] uppercase tracking-[0.2em] opacity-60">Strike membership · tap to turn back</p>
              </div>
            </div>
          )}
        </motion.div>
      </motion.div>
    </div>
  )
}
