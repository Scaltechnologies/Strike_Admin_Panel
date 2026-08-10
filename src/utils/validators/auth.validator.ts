import { VALIDATION } from '@/constants/validation'

export function isValidEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  return emailRegex.test(email) && email.length <= VALIDATION.EMAIL.MAX_LENGTH
}

export function isStrongPassword(password: string): boolean {
  return (
    password.length >= VALIDATION.PASSWORD.MIN_LENGTH &&
    password.length <= VALIDATION.PASSWORD.MAX_LENGTH &&
    VALIDATION.PASSWORD.PATTERN.test(password)
  )
}

export function isValidPhone(phone: string): boolean {
  return VALIDATION.PHONE.PATTERN.test(phone)
}

export function isValidOtp(otp: string): boolean {
  return otp.length === VALIDATION.OTP.LENGTH && /^\d+$/.test(otp)
}
