import { z } from 'zod'
import { VALIDATION } from '@/constants/validation'

export const loginSchema = z.object({
  email: z
    .string()
    .min(1, 'Email is required')
    .email('Invalid email address')
    .max(VALIDATION.EMAIL.MAX_LENGTH, `Email must be less than ${VALIDATION.EMAIL.MAX_LENGTH} characters`),
  password: z.string().min(1, 'Password is required'),
  rememberMe: z.boolean(),
})

export type LoginFormValues = z.infer<typeof loginSchema>

export const forgotPasswordSchema = z.object({
  email: z
    .string()
    .min(1, 'Email is required')
    .email('Invalid email address'),
})

export type ForgotPasswordFormValues = z.infer<typeof forgotPasswordSchema>

export const resetPasswordSchema = z
  .object({
    password: z
      .string()
      .min(
        VALIDATION.PASSWORD.MIN_LENGTH,
        `Password must be at least ${VALIDATION.PASSWORD.MIN_LENGTH} characters`,
      )
      .max(
        VALIDATION.PASSWORD.MAX_LENGTH,
        `Password must be less than ${VALIDATION.PASSWORD.MAX_LENGTH} characters`,
      ),
    confirmPassword: z.string().min(1, 'Please confirm your password'),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: 'Passwords do not match',
    path: ['confirmPassword'],
  })

export type ResetPasswordFormValues = z.infer<typeof resetPasswordSchema>

export const changePasswordSchema = z
  .object({
    currentPassword: z.string().min(1, 'Current password is required'),
    newPassword: z
      .string()
      .min(
        VALIDATION.PASSWORD.MIN_LENGTH,
        `Password must be at least ${VALIDATION.PASSWORD.MIN_LENGTH} characters`,
      )
      .max(
        VALIDATION.PASSWORD.MAX_LENGTH,
        `Password must be less than ${VALIDATION.PASSWORD.MAX_LENGTH} characters`,
      ),
    confirmPassword: z.string().min(1, 'Please confirm your new password'),
  })
  .refine((data) => data.newPassword === data.confirmPassword, {
    message: 'Passwords do not match',
    path: ['confirmPassword'],
  })

export type ChangePasswordFormValues = z.infer<typeof changePasswordSchema>
