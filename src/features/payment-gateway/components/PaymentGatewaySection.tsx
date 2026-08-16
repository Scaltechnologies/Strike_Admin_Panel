import { useState } from 'react'
import { CreditCard, ShieldAlert, RefreshCw, Eye, EyeOff } from 'lucide-react'
import { cn } from '@/lib/utils'
import { formatDateTime } from '@/utils/helpers/date'
import { useAuthStore } from '@/store/auth-store'
import { ROLES } from '@/constants/roles'
import { AccessDenied } from '@/components/common/AccessDenied'
import { SwitchField } from '@/components/forms/SwitchField'
import { usePaymentGatewayConfig, useUpdatePaymentGatewayConfig } from '../hooks/usePaymentGateway'
import type { PaymentGatewayConfigResponse, PaymentGatewayMode } from '../types/payment-gateway.types'

const PROVIDER = 'razorpay'

const INPUT_CLS =
  'block w-full rounded-lg border border-border bg-background px-3 py-2 text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring disabled:opacity-60'

interface FormState {
  keyId: string
  keySecret: string
  webhookSecret: string
  mode: PaymentGatewayMode
  isActive: boolean
}

export function PaymentGatewaySection() {
  const { user } = useAuthStore()
  const isSuperAdmin = user?.role === ROLES.SUPER_ADMIN

  const { data: config, isLoading, refetch } = usePaymentGatewayConfig(PROVIDER)

  return (
    <div className="overflow-hidden rounded-xl border border-border bg-card shadow-sm">
      <div className="flex items-center justify-between border-b border-border px-5 py-4">
        <div className="flex items-center gap-3">
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-muted">
            <CreditCard className="h-4 w-4 text-muted-foreground" />
          </div>
          <div>
            <p className="text-sm font-semibold text-foreground">Payment Gateway</p>
            <p className="text-xs text-muted-foreground">Razorpay credentials used by the backend to process card payments</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {config && (
            <>
              <span className={cn('inline-flex rounded-full px-2 py-0.5 text-xs font-medium',
                config.mode === 'LIVE' ? 'bg-purple-100 text-purple-700 dark:bg-purple-400/10 dark:text-purple-400'
                  : 'bg-amber-100 text-amber-700 dark:bg-amber-400/10 dark:text-amber-400')}>
                {config.mode}
              </span>
              <span className={cn('inline-flex rounded-full px-2 py-0.5 text-xs font-medium',
                config.active ? 'bg-green-100 text-green-700 dark:bg-green-400/10 dark:text-green-400'
                  : 'bg-muted text-muted-foreground')}>
                {config.active ? 'Active' : 'Inactive'}
              </span>
            </>
          )}
          <button onClick={() => void refetch()}
            className="flex h-7 w-7 items-center justify-center rounded-lg text-muted-foreground hover:bg-muted hover:text-foreground">
            <RefreshCw className="h-3.5 w-3.5" />
          </button>
        </div>
      </div>

      {!isSuperAdmin ? (
        <AccessDenied message="Only Super Admins can view or edit payment gateway credentials." />
      ) : isLoading ? (
        <div className="space-y-3 p-5">
          <div className="h-9 w-full animate-pulse rounded-lg bg-muted" />
          <div className="h-9 w-full animate-pulse rounded-lg bg-muted" />
          <div className="h-9 w-full animate-pulse rounded-lg bg-muted" />
        </div>
      ) : (
        // Keyed by updatedAt (or a fixed key while unconfigured) so the form remounts — and its
        // useState re-initializes from the fresh config — whenever the saved data actually
        // changes (initial load, or after a save triggers a refetch). This is the React-recommended
        // way to reset state from external data without a setState-in-effect anti-pattern.
        <PaymentGatewayForm key={config?.updatedAt ?? 'unconfigured'} config={config ?? null} />
      )}
    </div>
  )
}

function PaymentGatewayForm({ config }: { config: PaymentGatewayConfigResponse | null }) {
  const { mutate: save, isPending } = useUpdatePaymentGatewayConfig(PROVIDER)
  const [showKeySecret, setShowKeySecret] = useState(false)
  const [showWebhookSecret, setShowWebhookSecret] = useState(false)

  const [form, setForm] = useState<FormState>({
    keyId: config?.keyId ?? '',
    keySecret: '',
    webhookSecret: '',
    mode: config?.mode ?? 'TEST',
    isActive: config?.active ?? true,
  })

  function setField<K extends keyof FormState>(field: K, value: FormState[K]) {
    setForm((prev) => ({ ...prev, [field]: value }))
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    save({
      keyId: form.keyId.trim(),
      ...(form.keySecret.trim() && { keySecret: form.keySecret.trim() }),
      ...(form.webhookSecret.trim() && { webhookSecret: form.webhookSecret.trim() }),
      mode: form.mode,
      isActive: form.isActive,
    })
  }

  const isConfigured = !!config
  const canSubmit = form.keyId.trim().length > 0 && (isConfigured || form.keySecret.trim().length > 0)

  return (
    <form onSubmit={handleSubmit} className="space-y-4 p-5">
      {!isConfigured && (
        <div className="flex items-start gap-3 rounded-lg border border-amber-200 bg-amber-50 p-3 dark:border-amber-400/20 dark:bg-amber-400/10">
          <ShieldAlert className="mt-0.5 h-4 w-4 shrink-0 text-amber-600 dark:text-amber-400" />
          <p className="text-xs text-amber-700 dark:text-amber-400">
            Not configured yet. Payments will fail until a Key ID and Key Secret are saved here.
          </p>
        </div>
      )}

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        <div>
          <label className="mb-1.5 block text-xs font-medium text-muted-foreground">
            Key ID <span className="text-destructive">*</span>
          </label>
          <input
            className={cn(INPUT_CLS, 'font-mono')}
            value={form.keyId}
            onChange={(e) => setField('keyId', e.target.value)}
            placeholder="rzp_live_xxxxxxxxxxxxxx"
            disabled={isPending}
            required
          />
        </div>
        <div>
          <label className="mb-1.5 block text-xs font-medium text-muted-foreground">Mode</label>
          <select
            value={form.mode}
            onChange={(e) => setField('mode', e.target.value as PaymentGatewayMode)}
            disabled={isPending}
            className={INPUT_CLS}
          >
            <option value="TEST">Test</option>
            <option value="LIVE">Live</option>
          </select>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        <div>
          <label className="mb-1.5 block text-xs font-medium text-muted-foreground">
            Key Secret {!isConfigured && <span className="text-destructive">*</span>}
          </label>
          <div className="relative">
            <input
              type={showKeySecret ? 'text' : 'password'}
              className={cn(INPUT_CLS, 'pr-9 font-mono')}
              value={form.keySecret}
              onChange={(e) => setField('keySecret', e.target.value)}
              placeholder={isConfigured ? `Currently ${config?.keySecretMasked ?? '••••'} — leave blank to keep` : 'Paste the key secret'}
              disabled={isPending}
              autoComplete="new-password"
            />
            {form.keySecret && (
              <button
                type="button"
                onClick={() => setShowKeySecret((v) => !v)}
                tabIndex={-1}
                className="absolute inset-y-0 right-0 flex w-9 items-center justify-center text-muted-foreground hover:text-foreground"
                aria-label={showKeySecret ? 'Hide key secret' : 'Show key secret'}
              >
                {showKeySecret ? <EyeOff className="h-3.5 w-3.5" /> : <Eye className="h-3.5 w-3.5" />}
              </button>
            )}
          </div>
        </div>
        <div>
          <label className="mb-1.5 block text-xs font-medium text-muted-foreground">Webhook Secret</label>
          <div className="relative">
            <input
              type={showWebhookSecret ? 'text' : 'password'}
              className={cn(INPUT_CLS, 'pr-9 font-mono')}
              value={form.webhookSecret}
              onChange={(e) => setField('webhookSecret', e.target.value)}
              placeholder={config?.webhookSecretConfigured
                ? `Currently ${config.webhookSecretMasked ?? '••••'} — leave blank to keep`
                : 'Paste the webhook signing secret'}
              disabled={isPending}
              autoComplete="new-password"
            />
            {form.webhookSecret && (
              <button
                type="button"
                onClick={() => setShowWebhookSecret((v) => !v)}
                tabIndex={-1}
                className="absolute inset-y-0 right-0 flex w-9 items-center justify-center text-muted-foreground hover:text-foreground"
                aria-label={showWebhookSecret ? 'Hide webhook secret' : 'Show webhook secret'}
              >
                {showWebhookSecret ? <EyeOff className="h-3.5 w-3.5" /> : <Eye className="h-3.5 w-3.5" />}
              </button>
            )}
          </div>
        </div>
      </div>

      <SwitchField
        checked={form.isActive}
        onChange={(checked) => setField('isActive', checked)}
        label="Active"
        description="When off, card-service treats this provider as unconfigured and payment creation fails fast."
        disabled={isPending}
      />

      <div className="flex flex-col-reverse items-start gap-3 pt-2 sm:flex-row sm:items-center sm:justify-between">
        <p className="text-xs text-muted-foreground">
          {config?.updatedAt
            ? `Last updated ${formatDateTime(config.updatedAt)}`
            : 'Changes take effect for the backend within about a minute — no redeploy needed.'}
        </p>
        <button type="submit" disabled={isPending || !canSubmit}
          className="w-full shrink-0 rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground hover:bg-primary/90 disabled:opacity-60 sm:w-auto">
          {isPending ? 'Saving…' : 'Save Changes'}
        </button>
      </div>
    </form>
  )
}
