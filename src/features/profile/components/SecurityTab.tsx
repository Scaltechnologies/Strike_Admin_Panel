import { useMemo, useState } from 'react'
import { motion } from 'framer-motion'
import {
  AlertTriangle, Check, Copy, Eye, EyeOff, Globe, KeyRound, Laptop, LogOut, MonitorSmartphone, ShieldAlert, ShieldCheck,
  Smartphone, Wand2, XCircle,
} from 'lucide-react'
import { toast } from 'sonner'
import { cn } from '@/lib/utils'
import { ConfirmationDialog } from '@/components/common/ConfirmationDialog'
import { Panel } from '@/features/dashboard/components/dashboard-ui'
import { apiErrorMessage } from '@/features/admins/hooks/useAdmins'
import { describeDevice } from '@/features/audit-logs/utils/audit-display'
import { formatDateTime, formatRelative } from '@/utils/helpers/date'
import { useChangePassword, useMySignIns, useSignOutOthers, type MyOverview, type SignInRow } from '../api/profile.api'
import { PASSWORD_RULES, passwordStrength, shortIp, type HealthCheck, type ProfileTab } from '../utils/profile-meta'
import { HealthList, ScoreRing } from './ProfileOverview'

const INPUT =
  'block w-full rounded-xl border border-border bg-background px-3.5 py-2.5 pr-10 text-sm placeholder:text-muted-foreground transition-shadow focus:border-primary focus:outline-none focus:ring-4 focus:ring-primary/15 disabled:opacity-60'

/** 16 characters from an unambiguous alphabet, always with each kind of character. */
function suggestPassword(): string {
  const sets = ['ABCDEFGHJKLMNPQRSTUVWXYZ', 'abcdefghijkmnopqrstuvwxyz', '23456789', '!@#$%&*?']
  const all = sets.join('')
  const pick = (s: string) => s[crypto.getRandomValues(new Uint32Array(1))[0] % s.length]
  const chars = [...sets.map(pick), ...Array.from({ length: 12 }, () => pick(all))]
  for (let i = chars.length - 1; i > 0; i--) {
    const j = crypto.getRandomValues(new Uint32Array(1))[0] % (i + 1)
    ;[chars[i], chars[j]] = [chars[j], chars[i]]
  }
  return chars.join('')
}

function PasswordInput({ id, value, onChange, placeholder, autoComplete, disabled, invalid }: {
  id: string; value: string; onChange: (v: string) => void; placeholder: string; autoComplete: string; disabled?: boolean; invalid?: boolean
}) {
  const [show, setShow] = useState(false)
  return (
    <div className="relative">
      <input id={id} type={show ? 'text' : 'password'} value={value} onChange={(e) => onChange(e.target.value)} placeholder={placeholder}
        autoComplete={autoComplete} disabled={disabled} className={cn(INPUT, invalid && 'border-destructive focus:ring-destructive/15')} />
      <button type="button" onClick={() => setShow((v) => !v)} aria-label={show ? 'Hide password' : 'Show password'}
        className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground">{show ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}</button>
    </div>
  )
}

function ChangePassword() {
  const [f, setF] = useState({ current: '', next: '', confirm: '' })
  const [suggested, setSuggested] = useState<string | null>(null)
  const change = useChangePassword()
  const strength = passwordStrength(f.next)
  const mismatch = !!f.confirm && f.confirm !== f.next
  const same = !!f.next && f.next === f.current
  const ready = !!f.current && f.next.length >= 8 && f.next === f.confirm && !same

  const useSuggestion = () => {
    const p = suggestPassword()
    setSuggested(p)
    setF((s) => ({ ...s, next: p, confirm: p }))
  }

  return (
    <Panel title="Change password" subtitle="Changing it signs you out on every other device" icon={<KeyRound className="h-4 w-4" />}>
      <form className="space-y-4" onSubmit={(e) => {
        e.preventDefault()
        if (!ready) return
        change.mutate({ currentPassword: f.current, newPassword: f.next }, {
          onSuccess: () => { setF({ current: '', next: '', confirm: '' }); setSuggested(null); toast.success('Password changed. Other devices were signed out.') },
          onError: (err) => toast.error(apiErrorMessage(err, 'Couldn’t change it. Check your current password.')),
        })
      }}>
        <div>
          <label htmlFor="pw-current" className="mb-1.5 block text-xs font-semibold text-foreground">Current password</label>
          <PasswordInput id="pw-current" value={f.current} onChange={(v) => setF((s) => ({ ...s, current: v }))} placeholder="The one you use now" autoComplete="current-password" disabled={change.isPending} />
        </div>
        <div>
          <div className="mb-1.5 flex items-center justify-between">
            <label htmlFor="pw-new" className="text-xs font-semibold text-foreground">New password</label>
            <button type="button" onClick={useSuggestion} className="inline-flex items-center gap-1 text-xs font-semibold text-primary hover:underline"><Wand2 className="h-3.5 w-3.5" />Suggest a strong one</button>
          </div>
          <PasswordInput id="pw-new" value={f.next} onChange={(v) => { setSuggested(null); setF((s) => ({ ...s, next: v })) }} placeholder="At least 8 characters" autoComplete="new-password" disabled={change.isPending} invalid={same} />
          {suggested && (
            <div className="mt-2 flex items-center justify-between gap-2 rounded-lg bg-muted/60 px-3 py-2 text-xs">
              <span className="text-muted-foreground">Save it in your password manager before you continue.</span>
              <button type="button" onClick={() => { void navigator.clipboard?.writeText(suggested).then(() => toast.success('Copied')) }}
                className="inline-flex shrink-0 items-center gap-1 font-semibold text-primary hover:underline"><Copy className="h-3.5 w-3.5" />Copy</button>
            </div>
          )}
          <div className="mt-2.5">
            <div className="flex gap-1">
              {[1, 2, 3, 4].map((n) => (
                <div key={n} className="h-1.5 flex-1 overflow-hidden rounded-full bg-muted">
                  <motion.div className={cn('h-full', strength.bar)} initial={false} animate={{ width: f.next && strength.score >= n ? '100%' : '0%' }} transition={{ duration: 0.3 }} />
                </div>
              ))}
            </div>
            <p className={cn('mt-1 text-xs font-semibold', strength.tone)}>{same ? 'Must be different from your current password' : strength.label}</p>
          </div>
          <ul className="mt-2 grid gap-1 sm:grid-cols-2">
            {PASSWORD_RULES.map((r) => {
              const ok = r.test(f.next)
              return (
                <li key={r.id} className={cn('flex items-center gap-1.5 text-xs transition-colors', ok ? 'text-emerald-600 dark:text-emerald-400' : 'text-muted-foreground')}>
                  <span className={cn('flex h-4 w-4 items-center justify-center rounded-full', ok ? 'bg-emerald-500 text-white' : 'bg-muted')}>{ok && <Check className="h-2.5 w-2.5" strokeWidth={3} />}</span>{r.label}
                </li>
              )
            })}
          </ul>
        </div>
        <div>
          <label htmlFor="pw-confirm" className="mb-1.5 block text-xs font-semibold text-foreground">Type the new password again</label>
          <PasswordInput id="pw-confirm" value={f.confirm} onChange={(v) => setF((s) => ({ ...s, confirm: v }))} placeholder="Repeat it" autoComplete="new-password" disabled={change.isPending} invalid={mismatch} />
          {mismatch && <p className="mt-1 text-xs text-destructive">These don’t match yet</p>}
        </div>
        <div className="flex justify-end border-t border-border pt-4">
          <motion.button type="submit" whileTap={{ scale: 0.97 }} disabled={!ready || change.isPending}
            className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-[#e01a00] to-[#ff6a00] px-5 py-2 text-sm font-semibold text-white shadow-md shadow-red-500/20 disabled:opacity-50 disabled:shadow-none">
            <KeyRound className="h-4 w-4" />{change.isPending ? 'Changing…' : 'Change password'}
          </motion.button>
        </div>
      </form>
    </Panel>
  )
}

function deviceIcon(ua: string | null) {
  const d = describeDevice(ua).toLowerCase()
  return /android|ios|mobile/.test(d) ? Smartphone : /windows|mac|linux/.test(d) ? Laptop : MonitorSmartphone
}

function SignInHistory({ rows, loading }: { rows: SignInRow[]; loading: boolean }) {
  const [filter, setFilter] = useState<'all' | 'failed'>('all')
  const devices = useMemo(() => {
    const map = new Map<string, { ua: string | null; ip: string | null; count: number; last: string }>()
    for (const r of rows) {
      if (r.action !== 'ADMIN_LOGIN') continue
      const key = describeDevice(r.userAgent)
      const hit = map.get(key)
      if (hit) hit.count++
      else map.set(key, { ua: r.userAgent, ip: r.ipAddress, count: 1, last: r.createdAt })
    }
    return [...map.entries()]
  }, [rows])
  const shown = rows.filter((r) => filter === 'all' || r.action === 'ADMIN_LOGIN_FAILED')
  const failedCount = rows.filter((r) => r.action === 'ADMIN_LOGIN_FAILED').length
  const latestOk = rows.find((r) => r.action === 'ADMIN_LOGIN')

  return (
    <Panel title="Sign-in history" subtitle="Every time someone signed in, or tried to, with your email" icon={<Globe className="h-4 w-4" />}
      action={
        <div className="flex rounded-lg border border-border p-0.5 text-xs font-medium">
          {(['all', 'failed'] as const).map((k) => (
            <button key={k} type="button" onClick={() => setFilter(k)}
              className={cn('rounded-md px-2.5 py-1', filter === k ? 'bg-primary text-primary-foreground' : 'text-muted-foreground hover:text-foreground')}>
              {k === 'all' ? 'All' : `Failed (${failedCount})`}
            </button>
          ))}
        </div>
      }>
      {devices.length > 0 && (
        <div className="mb-4 flex flex-wrap gap-2">
          {devices.map(([name, d]) => {
            const Icon = deviceIcon(d.ua)
            return (
              <span key={name} className="inline-flex items-center gap-2 rounded-xl border border-border bg-muted/30 px-3 py-1.5 text-xs">
                <Icon className="h-3.5 w-3.5 text-muted-foreground" /><span className="font-medium text-foreground">{name}</span>
                <span className="text-muted-foreground">{d.count}× · {formatRelative(d.last)}</span>
              </span>
            )
          })}
        </div>
      )}
      {loading ? <div className="h-48 animate-pulse rounded-xl bg-muted" /> : shown.length === 0 ? (
        <p className="py-8 text-center text-sm text-muted-foreground">{filter === 'failed' ? 'No failed attempts.' : 'No sign-ins recorded yet.'}</p>
      ) : (
        <ol className="relative max-h-[420px] space-y-1 overflow-y-auto pr-1">
          {shown.map((r, i) => {
            const failed = r.action === 'ADMIN_LOGIN_FAILED'
            const Icon = deviceIcon(r.userAgent)
            return (
              <motion.li key={r.id ?? i} initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: Math.min(i, 12) * 0.025 }}
                className={cn('flex items-center gap-3 rounded-xl px-2.5 py-2.5', failed ? 'bg-rose-50 dark:bg-rose-400/5' : 'hover:bg-muted/40')}>
                <span className={cn('flex h-9 w-9 shrink-0 items-center justify-center rounded-xl', failed ? 'bg-rose-100 text-rose-600 dark:bg-rose-400/10 dark:text-rose-300' : 'bg-emerald-100 text-emerald-700 dark:bg-emerald-400/10 dark:text-emerald-300')}>
                  {failed ? <XCircle className="h-4 w-4" /> : <Icon className="h-4 w-4" />}
                </span>
                <div className="min-w-0 flex-1">
                  <p className="flex items-center gap-2 truncate text-sm font-medium text-foreground">
                    {failed ? 'Wrong password' : 'Signed in'} · {describeDevice(r.userAgent)}
                    {r === latestOk && <span className="rounded-full bg-emerald-100 px-1.5 py-px text-[10px] font-bold text-emerald-700 dark:bg-emerald-400/10 dark:text-emerald-300">Latest</span>}
                  </p>
                  <p className="truncate text-xs text-muted-foreground">{shortIp(r.ipAddress)}{failed && r.details ? ` · ${r.details}` : ''}</p>
                </div>
                <span className="shrink-0 text-right text-xs text-muted-foreground" title={formatDateTime(r.createdAt)}>{formatRelative(r.createdAt)}</span>
              </motion.li>
            )
          })}
        </ol>
      )}
    </Panel>
  )
}

export function SecurityTab({ data, health, go }: { data?: MyOverview; health: { score: number; checks: HealthCheck[] }; go: (t: ProfileTab) => void }) {
  const signIns = useMySignIns()
  const signOut = useSignOutOthers()
  const [confirm, setConfirm] = useState(false)
  const acc = data?.account
  const lastFailed = acc?.lastFailedSignIn
  const failedWeek = Number(data?.signIns.failedWeek ?? 0)

  return (
    <div className="flex flex-col gap-4">
      {failedWeek > 0 && lastFailed && (
        <motion.div initial={{ opacity: 0, y: -6 }} animate={{ opacity: 1, y: 0 }}
          className="flex flex-wrap items-center gap-3 rounded-2xl border border-rose-300/60 bg-rose-50 p-4 dark:border-rose-400/20 dark:bg-rose-400/5">
          <ShieldAlert className="h-5 w-5 shrink-0 text-rose-600 dark:text-rose-400" />
          <div className="min-w-0 flex-1 text-sm">
            <p className="font-semibold text-rose-800 dark:text-rose-200">{failedWeek} wrong-password attempt{failedWeek === 1 ? '' : 's'} on your account this week</p>
            <p className="text-rose-700/80 dark:text-rose-300/80">Last one {formatRelative(lastFailed.createdAt)} from {describeDevice(lastFailed.userAgent)} ({shortIp(lastFailed.ipAddress)}). If that wasn’t you, change your password now.</p>
          </div>
        </motion.div>
      )}

      <div className="grid gap-4 xl:grid-cols-5">
        <div className="flex flex-col gap-4 xl:col-span-2">
          <Panel title="Account safety" subtitle="Fix the amber items to reach 100%" icon={<ShieldCheck className="h-4 w-4" />}>
            <div className="flex flex-col items-center gap-4">
              <ScoreRing score={health.score} size={128} />
              <div className="w-full"><HealthList checks={health.checks} go={go} /></div>
            </div>
          </Panel>

          <Panel title="Other devices" subtitle="Lost a laptop or used a shared computer?" icon={<LogOut className="h-4 w-4" />}>
            <p className="text-sm text-muted-foreground">Signs you out everywhere except this browser, straight away. You’ll stay signed in here.</p>
            {acc?.sessionsEndedAt && <p className="mt-2 text-xs text-muted-foreground">Last done {formatRelative(acc.sessionsEndedAt)}.</p>}
            {acc?.passwordResetByOtherAt && (
              <p className="mt-2 flex items-start gap-1.5 text-xs text-amber-700 dark:text-amber-300"><AlertTriangle className="mt-0.5 h-3.5 w-3.5 shrink-0" />A Super Admin set a new password for you {formatRelative(acc.passwordResetByOtherAt)}. Change it to one only you know.</p>
            )}
            <motion.button type="button" whileTap={{ scale: 0.97 }} onClick={() => setConfirm(true)} disabled={signOut.isPending}
              className="mt-4 inline-flex w-full items-center justify-center gap-2 rounded-xl border border-rose-300 bg-rose-50 px-4 py-2.5 text-sm font-semibold text-rose-700 transition-colors hover:bg-rose-100 disabled:opacity-60 dark:border-rose-400/30 dark:bg-rose-400/10 dark:text-rose-300">
              <LogOut className="h-4 w-4" />{signOut.isPending ? 'Signing out…' : 'Sign out of all other devices'}
            </motion.button>
          </Panel>
        </div>

        <div className="flex flex-col gap-4 xl:col-span-3">
          <ChangePassword />
          <SignInHistory rows={signIns.data ?? []} loading={signIns.isLoading} />
        </div>
      </div>

      <ConfirmationDialog open={confirm} title="Sign out of all other devices?" variant="destructive" confirmLabel="Sign them out" isLoading={signOut.isPending}
        description="Every other browser or computer signed in as you will be signed out right away. This browser stays signed in."
        onCancel={() => setConfirm(false)}
        onConfirm={() => signOut.mutate(undefined, {
          onSuccess: () => { setConfirm(false); toast.success('Signed out of all other devices.') },
          onError: (err) => { setConfirm(false); toast.error(apiErrorMessage(err, 'Couldn’t sign out other devices.')) },
        })} />
    </div>
  )
}
