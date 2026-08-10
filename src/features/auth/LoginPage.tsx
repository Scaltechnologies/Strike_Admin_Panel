import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { loginSchema, type LoginFormValues } from '@/validations/auth.schema'
import { useLogin } from './hooks/useLogin'
import { InputField } from '@/components/forms/InputField'
import { CheckboxField } from '@/components/forms/CheckboxField'
import { LoadingSpinner } from '@/components/common/LoadingSpinner'
import { cn } from '@/lib/utils'

export function LoginPage() {
  const [showPassword, setShowPassword] = useState(false)
  const { mutate: login, isPending } = useLogin()

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: { email: '', password: '', rememberMe: false },
  })

  const onSubmit = (values: LoginFormValues) => {
    login(values)
  }

  return (
    <div className="space-y-8">
      <div>
        <div className="mb-6 flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary shadow-lg shadow-primary/25">
            <svg
              className="h-5 w-5 text-primary-foreground"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={2.5}
            >
              <path strokeLinecap="round" strokeLinejoin="round" d="M13 10V3L4 14h7v7l9-11h-7z" />
            </svg>
          </div>
          <span className="text-lg font-semibold text-foreground">Strike Admin</span>
        </div>

        <h1 className="text-2xl font-semibold tracking-tight text-foreground">
          Sign in to your account
        </h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Enter your credentials to access the admin panel
        </p>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} noValidate className="space-y-5">
        <InputField
          label="Email address"
          type="email"
          autoComplete="email"
          placeholder="admin@strike.com"
          disabled={isPending}
          error={errors.email?.message}
          {...register('email')}
        />

        <div className="space-y-1.5">
          <label htmlFor="password" className="block text-sm font-medium text-foreground">
            Password
          </label>
          <div className="relative">
            <input
              id="password"
              type={showPassword ? 'text' : 'password'}
              autoComplete="current-password"
              placeholder="••••••••"
              disabled={isPending}
              aria-invalid={!!errors.password}
              className={cn(
                'block w-full rounded-lg border border-border bg-background px-3 py-2.5 pr-10 text-sm text-foreground',
                'placeholder:text-muted-foreground',
                'transition-colors focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20',
                'disabled:cursor-not-allowed disabled:opacity-50',
                errors.password && 'border-destructive focus:border-destructive focus:ring-destructive/20',
              )}
              {...register('password')}
            />
            <button
              type="button"
              tabIndex={-1}
              onClick={() => setShowPassword((v) => !v)}
              className="absolute inset-y-0 right-0 flex items-center px-3 text-muted-foreground hover:text-foreground"
              aria-label={showPassword ? 'Hide password' : 'Show password'}
            >
              {showPassword ? (
                <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M3.98 8.223A10.477 10.477 0 001.934 12C3.226 16.338 7.244 19.5 12 19.5c.993 0 1.953-.138 2.863-.395M6.228 6.228A10.45 10.45 0 0112 4.5c4.756 0 8.773 3.162 10.065 7.498a10.523 10.523 0 01-4.293 5.774M6.228 6.228L3 3m3.228 3.228l3.65 3.65m7.894 7.894L21 21m-3.228-3.228l-3.65-3.65m0 0a3 3 0 10-4.243-4.243m4.242 4.242L9.88 9.88" />
                </svg>
              ) : (
                <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M2.036 12.322a1.012 1.012 0 010-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178z" />
                  <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
              )}
            </button>
          </div>
          {errors.password && (
            <p role="alert" className="text-xs text-destructive">{errors.password.message}</p>
          )}
        </div>

        <div className="flex items-center justify-between">
          <CheckboxField label="Remember me" {...register('rememberMe')} />
        </div>

        <button
          type="submit"
          disabled={isPending}
          className={cn(
            'inline-flex w-full items-center justify-center gap-2 rounded-lg bg-primary px-4 py-2.5',
            'text-sm font-medium text-primary-foreground shadow-sm',
            'transition-colors hover:bg-primary/90 focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2',
            'disabled:cursor-not-allowed disabled:opacity-60',
          )}
        >
          {isPending && <LoadingSpinner size="sm" />}
          {isPending ? 'Signing in…' : 'Sign in'}
        </button>
      </form>

      <p className="text-center text-xs text-muted-foreground">
        Forgot your password?{' '}
        <span className="font-medium text-primary">
          {/* TODO Phase 2: Implement forgot-password flow */}
          Contact a Super Admin
        </span>
      </p>
    </div>
  )
}

export default LoginPage
