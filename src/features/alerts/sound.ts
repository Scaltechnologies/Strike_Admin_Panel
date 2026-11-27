/**
 * Alert sounds, synthesised with the Web Audio API (no audio files to load or cache).
 *
 * Browsers only let a page make sound after the person has interacted with it, so the context is
 * created lazily and "unlocked" on the first click/key press anywhere (see unlockAudioOnGesture).
 * Everything runs through a compressor so the chimes are loud without clipping.
 */

export type AlertSound = 'urgent' | 'attention' | 'sale' | 'info'

let ctx: AudioContext | null = null
let master: GainNode | null = null

function context(): AudioContext | null {
  if (typeof window === 'undefined') return null
  if (!ctx) {
    const Ctor = window.AudioContext ?? (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext
    if (!Ctor) return null
    ctx = new Ctor()
    const comp = ctx.createDynamicsCompressor()
    comp.threshold.value = -10
    comp.knee.value = 6
    comp.ratio.value = 12
    comp.attack.value = 0.002
    comp.release.value = 0.2
    master = ctx.createGain()
    master.gain.value = 1
    master.connect(comp)
    comp.connect(ctx.destination)
  }
  return ctx
}

/** True when the browser is still blocking sound until the next click or key press. */
export function audioLocked(): boolean {
  const c = context()
  return !c || c.state !== 'running'
}

/** Resume the audio context on the first interaction (call once at app start). */
export function unlockAudioOnGesture(onUnlocked?: () => void): () => void {
  const unlock = () => {
    const c = context()
    if (!c) return
    void c.resume().then(() => {
      if (c.state === 'running') {
        remove()
        onUnlocked?.()
      }
    })
  }
  const events = ['pointerdown', 'keydown', 'touchstart'] as const
  events.forEach((e) => window.addEventListener(e, unlock, { passive: true }))
  const remove = () => events.forEach((e) => window.removeEventListener(e, unlock))
  return remove
}

/** One struck bell: a fundamental plus bright, slightly inharmonic partials with a fast attack. */
function bell(c: AudioContext, out: AudioNode, freq: number, at: number, loudness: number, length = 1.1) {
  const partials: [number, number][] = [[1, 1], [2, 0.5], [3, 0.28], [4.2, 0.18], [5.4, 0.1]]
  for (const [mult, amp] of partials) {
    const osc = c.createOscillator()
    const g = c.createGain()
    osc.type = mult === 1 ? 'triangle' : 'sine'
    osc.frequency.setValueAtTime(freq * mult, at)
    g.gain.setValueAtTime(0.0001, at)
    g.gain.exponentialRampToValueAtTime(loudness * amp, at + 0.006)
    g.gain.exponentialRampToValueAtTime(0.0001, at + length / mult ** 0.35)
    osc.connect(g).connect(out)
    osc.start(at)
    osc.stop(at + length + 0.05)
  }
}

/** A short bright noise burst — the "ching" of a cash register. */
function shimmer(c: AudioContext, out: AudioNode, at: number, loudness: number) {
  const len = Math.floor(c.sampleRate * 0.35)
  const buf = c.createBuffer(1, len, c.sampleRate)
  const data = buf.getChannelData(0)
  for (let i = 0; i < len; i++) data[i] = (Math.random() * 2 - 1) * (1 - i / len) ** 3
  const src = c.createBufferSource()
  src.buffer = buf
  const hp = c.createBiquadFilter()
  hp.type = 'highpass'
  hp.frequency.value = 5000
  const g = c.createGain()
  g.gain.value = loudness * 0.6
  src.connect(hp).connect(g).connect(out)
  src.start(at)
}

const NOTE = { A5: 880, C6: 1046.5, E6: 1318.5, G6: 1568, A6: 1760, C7: 2093, E7: 2637, B6: 1975.5 }

/**
 * Plays an alert. `volume` 0–1. Urgent alerts are a rising triple chime played twice — loud and hard
 * to miss; sales are a cash-register "cha-ching"; attention is a two-tone; info is a single soft ding.
 * Returns false if the browser is still blocking sound.
 */
export function playAlert(kind: AlertSound, volume = 1): boolean {
  const c = context()
  if (!c || !master) return false
  if (c.state !== 'running') {
    // Play as soon as the browser allows it (it usually does once the page has been clicked).
    void c.resume().then(() => { if (c.state === 'running') render(c, kind, volume) })
    return false
  }
  render(c, kind, volume)
  return true
}

function render(c: AudioContext, kind: AlertSound, volume: number) {
  if (!master) return
  const v = Math.max(0, Math.min(1, volume))
  if (v === 0) return
  const out = c.createGain()
  out.gain.value = v
  out.connect(master)
  const t = c.currentTime + 0.03

  switch (kind) {
    case 'urgent':
      for (const round of [0, 0.75]) {
        bell(c, out, NOTE.E6, t + round, 0.9, 0.9)
        bell(c, out, NOTE.G6, t + round + 0.14, 0.9, 0.9)
        bell(c, out, NOTE.C7, t + round + 0.28, 1, 1.3)
      }
      break
    case 'attention':
      bell(c, out, NOTE.A5, t, 0.85)
      bell(c, out, NOTE.E6, t + 0.18, 0.85, 1.2)
      bell(c, out, NOTE.A5, t + 0.55, 0.7)
      bell(c, out, NOTE.E6, t + 0.73, 0.7, 1.2)
      break
    case 'sale':
      bell(c, out, NOTE.B6, t, 0.8, 0.5)
      bell(c, out, NOTE.E7, t + 0.09, 0.95, 1.4)
      shimmer(c, out, t + 0.09, 0.9)
      break
    default:
      bell(c, out, NOTE.C6, t, 0.55, 1)
  }
}
