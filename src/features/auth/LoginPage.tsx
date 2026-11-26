import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { ArrowRight, Eye, EyeOff, Lock, Mail } from 'lucide-react'
import { loginSchema, type LoginFormValues } from '@/validations/auth.schema'
import { useLogin } from './hooks/useLogin'
import { StrikeLogo } from '@/components/brand/StrikeLogo'
import { LoadingSpinner } from '@/components/common/LoadingSpinner'
import { cn } from '@/lib/utils'

const delay = (ms: number) => ({ '--d': `${ms}ms` }) as React.CSSProperties

const inputCls = cn(
  'peer block h-12 w-full rounded-xl border border-border bg-card pl-11 text-sm text-foreground shadow-sm',
  'placeholder:text-muted-foreground/70',
  'transition-[border-color,box-shadow] duration-200',
  'hover:border-foreground/20',
  'focus:border-[#ff6a00] focus:outline-none focus:ring-4 focus:ring-[#ff6a00]/15',
  'disabled:cursor-not-allowed disabled:opacity-60',
)

const errorCls = 'border-destructive hover:border-destructive focus:border-destructive focus:ring-destructive/15'

const iconCls =
  'pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground transition-colors peer-focus:text-[#ff6a00]'

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
    <div>
      {/* Logo (the brand panel shows it on large screens) */}
      <div className="fade-up mb-10 flex items-center gap-2.5 lg:hidden">
        <StrikeLogo className="h-9 w-9" />
        <span className="text-lg font-bold tracking-tight text-foreground">Strike</span>
        <span className="rounded-full border border-border bg-muted px-2 py-0.5 text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">
          Admin
        </span>
      </div>

      <div className="fade-up" style={delay(60)}>
        <p className="mb-2 inline-block text-xs font-semibold uppercase tracking-[0.2em] text-bolt-gradient">Admin panel</p>
        <h1 className="text-3xl font-bold tracking-tight text-foreground">Welcome back</h1>
        <p className="mt-2 text-sm text-muted-foreground">Sign in with the email and password you were given.</p>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} noValidate className="mt-9 space-y-5">
        <div className="fade-up space-y-1.5" style={delay(140)}>
          <label htmlFor="email" className="block text-sm font-medium text-foreground">
            Email
          </label>
          <div className="relative">
            <input
              id="email"
              type="email"
              autoComplete="email"
              autoFocus
              placeholder="you@company.com"
              disabled={isPending}
              aria-invalid={!!errors.email}
              aria-describedby={errors.email ? 'email-error' : undefined}
              className={cn(inputCls, 'pr-4', errors.email && errorCls)}
              {...register('email')}
            />
            <Mail className={iconCls} aria-hidden />
          </div>
          {errors.email && (
            <p id="email-error" role="alert" className="text-xs text-destructive">{errors.email.message}</p>
          )}
        </div>

        <div className="fade-up space-y-1.5" style={delay(200)}>
          <label htmlFor="password" className="block text-sm font-medium text-foreground">
            Password
          </label>
          <div className="relative">
            <input
              id="password"
              type={showPassword ? 'text' : 'password'}
              autoComplete="current-password"
              placeholder="Enter your password"
              disabled={isPending}
              aria-invalid={!!errors.password}
              aria-describedby={errors.password ? 'password-error' : undefined}
              className={cn(inputCls, 'pr-12', errors.password && errorCls)}
              {...register('password')}
            />
            <Lock className={iconCls} aria-hidden />
            <button
              type="button"
              onClick={() => setShowPassword((v) => !v)}
              className="absolute right-1.5 top-1/2 flex h-9 w-9 -translate-y-1/2 items-center justify-center rounded-lg text-muted-foreground transition-colors hover:bg-muted hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#ff6a00]/40"
              aria-label={showPassword ? 'Hide password' : 'Show password'}
            >
              {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
            </button>
          </div>
          {errors.password && (
            <p id="password-error" role="alert" className="text-xs text-destructive">{errors.password.message}</p>
          )}
        </div>

        <div className="fade-up flex items-center justify-between" style={delay(260)}>
          <label htmlFor="rememberMe" className="flex cursor-pointer select-none items-center gap-2.5 text-sm text-foreground">
            <input
              id="rememberMe"
              type="checkbox"
              disabled={isPending}
              className="h-4 w-4 cursor-pointer rounded border-border accent-[#ff6a00]"
              {...register('rememberMe')}
            />
            Remember me
          </label>
          <span className="text-xs text-muted-foreground">Forgot it? Ask a Super Admin</span>
        </div>

        <div className="fade-up pt-1" style={delay(320)}>
          <button
            type="submit"
            disabled={isPending}
            className={cn(
              'btn-shine group inline-flex h-12 w-full items-center justify-center gap-2 rounded-xl px-4',
              'bg-gradient-to-r from-[#ff8a00] via-[#ff5a00] to-[#d91c00] text-sm font-semibold text-white',
              'shadow-lg shadow-[#ff5a00]/30 transition-[transform,box-shadow] duration-200',
              'hover:-translate-y-0.5 hover:shadow-xl hover:shadow-[#ff5a00]/40 active:translate-y-0',
              'focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-[#ff6a00]/30',
              'disabled:cursor-not-allowed disabled:opacity-70 disabled:hover:translate-y-0',
            )}
          >
            {isPending ? (
              <>
                <LoadingSpinner size="sm" className="border-white/30 border-t-white" />
                Signing in…
              </>
            ) : (
              <>
                Sign in
                <ArrowRight className="h-4 w-4 transition-transform duration-200 group-hover:translate-x-1" aria-hidden />
              </>
            )}
          </button>
        </div>
      </form>

      <p className="fade-up mt-10 text-center text-xs text-muted-foreground" style={delay(420)}>
        Only people given an admin login can sign in here.
      </p>
    </div>
  )
}

export default LoginPage
