/** Same rules as the sign-in service: 4 digits, not all the same (1111), not a straight run (1234 / 4321). */
export function pinProblem(pin: string): string | null {
  if (!/^\d{4}$/.test(pin)) return 'PIN must be exactly 4 digits'
  let same = true
  let up = true
  let down = true
  for (let i = 1; i < pin.length; i++) {
    const d = pin.charCodeAt(i) - pin.charCodeAt(i - 1)
    same &&= d === 0
    up &&= d === 1
    down &&= d === -1
  }
  return same || up || down ? 'Too easy to guess — avoid 1111 or 1234' : null
}

/** A random PIN that passes the rules. */
export function generatePin(): string {
  const buf = new Uint32Array(1)
  for (;;) {
    crypto.getRandomValues(buf)
    const pin = String(buf[0] % 10000).padStart(4, '0')
    if (!pinProblem(pin)) return pin
  }
}

/** "+91 98765-43210" / "09876543210" / "919876543210" → "9876543210". */
export function normalizeMobile(raw: string): string {
  let d = (raw ?? '').replace(/\D/g, '')
  if (d.length === 12 && d.startsWith('91')) d = d.slice(2)
  if (d.length === 11 && d.startsWith('0')) d = d.slice(1)
  return d
}

export const mobileProblem = (m: string) => (/^[6-9]\d{9}$/.test(normalizeMobile(m)) ? null : 'Enter a valid 10-digit mobile number')

/** The message an admin sends a new vendor with their sign-in details. */
export function welcomeMessage(v: { hotelName: string; mobileNumber: string; pin: string }): string {
  return [
    `Welcome to Strike, ${v.hotelName}! 🎉`,
    '',
    'Your store is ready. Sign in to the Strike Vendor app with:',
    `📱 Mobile: ${normalizeMobile(v.mobileNumber)}`,
    `🔑 PIN: ${v.pin}`,
    '',
    'You can change your PIN anytime in the app, or tap "Forgot PIN" to set a new one with an OTP.',
  ].join('\n')
}

export const whatsappLink = (mobile: string, text: string) => `https://wa.me/91${normalizeMobile(mobile)}?text=${encodeURIComponent(text)}`
