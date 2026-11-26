import type { ReactNode } from 'react'
import { BarChart3, ShieldCheck, Store, Wallet } from 'lucide-react'
import { StrikeLogo } from '@/components/brand/StrikeLogo'

interface AuthLayoutProps {
  children: ReactNode
}

const HIGHLIGHTS = [
  { icon: Store, title: 'Vendors & stores', text: 'Approve vendors, manage stores, menus and cards.' },
  { icon: Wallet, title: 'Payments & payouts', text: 'Follow every payment and approve withdrawals.' },
  { icon: BarChart3, title: 'Live insights', text: 'Revenue, redemptions and reports at a glance.' },
]

export function AuthLayout({ children }: AuthLayoutProps) {
  return (
    <div className="flex min-h-screen bg-background">
      {/* ── Brand panel (large screens) ─────────────────────────────────── */}
      <aside className="relative hidden w-[52%] overflow-hidden bg-[#0b0c10] text-white lg:flex lg:flex-col">
        <div className="auth-aurora pointer-events-none absolute inset-0" aria-hidden>
          <span />
          <span />
          <span />
        </div>
        <div className="auth-grid pointer-events-none absolute inset-0" aria-hidden />
        <div className="pointer-events-none absolute inset-0 bg-gradient-to-b from-black/10 via-transparent to-black/50" aria-hidden />

        <div className="relative z-10 flex flex-1 flex-col px-12 py-10 xl:px-16">
          <div className="fade-up flex items-center gap-2.5">
            <StrikeLogo className="h-8 w-8" />
            <span className="text-lg font-bold tracking-tight">Strike</span>
            <span className="ml-1 rounded-full border border-white/15 bg-white/5 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-widest text-white/70">
              Admin
            </span>
          </div>

          <div className="flex flex-1 flex-col justify-center py-12">
            <div className="fade-up relative mb-10 h-28 w-28" style={{ '--d': '80ms' } as React.CSSProperties}>
              <div className="absolute inset-0 rounded-full bg-[radial-gradient(circle,rgb(255_106_0/0.55),transparent_70%)] blur-2xl" aria-hidden />
              <StrikeLogo className="auth-float relative h-28 w-28 drop-shadow-[0_18px_30px_rgba(224,26,0,0.45)]" />
            </div>

            <h2 className="fade-up max-w-md text-4xl font-bold leading-[1.1] tracking-tight xl:text-5xl" style={{ '--d': '160ms' } as React.CSSProperties}>
              Run all of Strike from <span className="text-bolt-gradient">one place.</span>
            </h2>
            <p className="fade-up mt-4 max-w-md text-base leading-relaxed text-white/65" style={{ '--d': '240ms' } as React.CSSProperties}>
              The control room for your vendors, members, cards and payments.
            </p>

            <ul className="mt-10 max-w-md space-y-3">
              {HIGHLIGHTS.map(({ icon: Icon, title, text }, i) => (
                <li
                  key={title}
                  className="fade-up flex items-start gap-3.5 rounded-2xl border border-white/10 bg-white/[0.04] p-3.5 backdrop-blur-sm transition-colors hover:border-white/20 hover:bg-white/[0.07]"
                  style={{ '--d': `${320 + i * 90}ms` } as React.CSSProperties}
                >
                  <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-[#ffc400] via-[#ff6a00] to-[#e01a00] shadow-lg shadow-orange-600/30">
                    <Icon className="h-4 w-4 text-white" aria-hidden />
                  </span>
                  <span>
                    <span className="block text-sm font-semibold">{title}</span>
                    <span className="block text-sm text-white/60">{text}</span>
                  </span>
                </li>
              ))}
            </ul>
          </div>

          <div className="fade-up flex items-center justify-between text-xs text-white/45" style={{ '--d': '600ms' } as React.CSSProperties}>
            <span className="flex items-center gap-1.5">
              <ShieldCheck className="h-3.5 w-3.5" aria-hidden />
              Secure sign-in · every admin has their own login
            </span>
            <span>© {new Date().getFullYear()} Strike</span>
          </div>
        </div>
      </aside>

      {/* ── Sign-in form ────────────────────────────────────────────────── */}
      <main className="relative flex flex-1 items-center justify-center overflow-hidden px-5 py-12 sm:px-8">
        <div
          className="pointer-events-none absolute -right-32 -top-32 h-96 w-96 rounded-full bg-[radial-gradient(circle,rgb(255_106_0/0.16),transparent_65%)]"
          aria-hidden
        />
        <div
          className="pointer-events-none absolute -bottom-40 -left-24 h-96 w-96 rounded-full bg-[radial-gradient(circle,rgb(224_26_0/0.10),transparent_65%)] lg:hidden"
          aria-hidden
        />
        <div className="relative w-full max-w-[400px]">{children}</div>
      </main>
    </div>
  )
}
