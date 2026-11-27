import { useEffect, useState, type ReactNode } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { format, formatDistanceToNowStrict } from 'date-fns'
import {
  AlertTriangle, Check, CheckCircle2, Clock, Copy, Globe, History, Link2, Monitor, Smartphone, User, X,
} from 'lucide-react'
import { toast } from 'sonner'
import { cn } from '@/lib/utils'
import type { AuditLogResponse } from '../types/audit-log.types'
import {
  METHOD_TONE, actorDisplayName, actorMeta, describeDevice, happenedAt, humanize, initials, prettyJson, roleLabel, sourceLabel, summaryOf,
} from '../utils/audit-display'

interface AuditDetailDrawerProps {
  log: AuditLogResponse | null
  onClose: () => void
  onFilterActor: (email: string) => void
  onFilterEntity: (entityType: string, entityId: number | null) => void
}

function Section({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section className="space-y-2">
      <h3 className="text-[11px] font-semibold uppercase tracking-widest text-muted-foreground">{title}</h3>
      {children}
    </section>
  )
}

function Row({ label, children, mono }: { label: string; children: ReactNode; mono?: boolean }) {
  return (
    <div className="grid grid-cols-[110px_1fr] gap-3 py-1.5 text-sm">
      <dt className="text-muted-foreground">{label}</dt>
      <dd className={cn('min-w-0 break-words text-foreground', mono && 'font-mono text-xs leading-5')}>{children}</dd>
    </div>
  )
}

function CodeBlock({ title, text, tone }: { title: string; text: string; tone?: 'old' | 'new' }) {
  const [copied, setCopied] = useState(false)
  return (
    <div className={cn(
      'overflow-hidden rounded-xl border',
      tone === 'old' ? 'border-red-200 dark:border-red-400/20' : tone === 'new' ? 'border-emerald-200 dark:border-emerald-400/20' : 'border-border',
    )}>
      <div className={cn(
        'flex items-center justify-between px-3 py-1.5 text-[11px] font-semibold',
        tone === 'old' ? 'bg-red-50 text-red-700 dark:bg-red-400/10 dark:text-red-300'
          : tone === 'new' ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-400/10 dark:text-emerald-300'
          : 'bg-muted text-muted-foreground',
      )}>
        {title}
        <button type="button" aria-label={`Copy ${title}`}
          onClick={() => {
            void navigator.clipboard.writeText(text).then(() => {
              setCopied(true)
              setTimeout(() => setCopied(false), 1500)
            })
          }}
          className="flex items-center gap-1 rounded px-1.5 py-0.5 hover:bg-black/5 dark:hover:bg-white/10">
          {copied ? <Check className="h-3 w-3" /> : <Copy className="h-3 w-3" />}
          {copied ? 'Copied' : 'Copy'}
        </button>
      </div>
      <pre className="max-h-72 overflow-auto bg-background p-3 font-mono text-[11px] leading-5 text-foreground">{text}</pre>
    </div>
  )
}

export function AuditDetailDrawer({ log, onClose, onFilterActor, onFilterEntity }: AuditDetailDrawerProps) {
  useEffect(() => {
    if (!log) return
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && onClose()
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [log, onClose])

  return (
    <AnimatePresence>
      {log && (
        <>
          <motion.div key="bd" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-40 bg-black/40 backdrop-blur-sm" onClick={onClose} aria-hidden />
          <motion.aside
            key="panel"
            initial={{ x: '100%' }} animate={{ x: 0 }} exit={{ x: '100%' }}
            transition={{ type: 'spring', damping: 32, stiffness: 300 }}
            role="dialog" aria-modal="true" aria-labelledby="audit-detail-title"
            className="fixed right-0 top-0 z-50 flex h-full w-full max-w-xl flex-col border-l border-border bg-card shadow-2xl"
          >
            <DrawerBody log={log} onClose={onClose} onFilterActor={onFilterActor} onFilterEntity={onFilterEntity} />
          </motion.aside>
        </>
      )}
    </AnimatePresence>
  )
}

function DrawerBody({ log, onClose, onFilterActor, onFilterEntity }: Required<Omit<AuditDetailDrawerProps, 'log'>> & { log: AuditLogResponse }) {
  const meta = actorMeta(log)
  const name = actorDisplayName(log)
  const when = happenedAt(log)
  const failed = log.outcome === 'FAILED'
  const Icon = meta.icon
  const oldValue = prettyJson(log.oldValue)
  const newValue = prettyJson(log.newValue)
  const body = prettyJson(log.requestBody)

  const copyEntry = () => {
    void navigator.clipboard.writeText(JSON.stringify(log, null, 2)).then(() => toast.success('Entry copied as JSON.'))
  }

  return (
    <>
      {/* Header */}
      <div className={cn('relative overflow-hidden border-b border-border px-6 pb-5 pt-5',
        failed ? 'bg-gradient-to-br from-red-500/10 to-transparent' : 'bg-gradient-to-br from-[#ff6a00]/10 to-transparent')}>
        <div className="flex items-start justify-between gap-3">
          <span className={cn('inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-semibold',
            failed ? 'bg-red-100 text-red-700 dark:bg-red-400/10 dark:text-red-300'
              : 'bg-emerald-100 text-emerald-700 dark:bg-emerald-400/10 dark:text-emerald-300')}>
            {failed ? <AlertTriangle className="h-3.5 w-3.5" /> : <CheckCircle2 className="h-3.5 w-3.5" />}
            {failed ? 'Failed' : 'Succeeded'}
            {log.statusCode ? <span className="font-mono opacity-70">· {log.statusCode}</span> : null}
          </span>
          <div className="flex items-center gap-1">
            <button type="button" onClick={copyEntry} aria-label="Copy entry as JSON"
              className="flex h-8 w-8 items-center justify-center rounded-lg text-muted-foreground hover:bg-muted hover:text-foreground">
              <Copy className="h-4 w-4" />
            </button>
            <button type="button" onClick={onClose} aria-label="Close"
              className="flex h-8 w-8 items-center justify-center rounded-lg text-muted-foreground hover:bg-muted hover:text-foreground">
              <X className="h-4 w-4" />
            </button>
          </div>
        </div>
        <h2 id="audit-detail-title" className="mt-3 text-lg font-semibold leading-snug text-foreground">{summaryOf(log)}</h2>
        {failed && log.details && <p className="mt-1 text-sm text-red-700 dark:text-red-300">{log.details}</p>}
        <p className="mt-2 flex items-center gap-1.5 text-xs text-muted-foreground">
          <Clock className="h-3.5 w-3.5" aria-hidden />
          {format(when, "EEEE, MMM d, yyyy 'at' HH:mm:ss")} · {formatDistanceToNowStrict(when, { addSuffix: true })}
        </p>
      </div>

      <div className="flex-1 space-y-6 overflow-y-auto px-6 py-5">
        <Section title="Who">
          <div className="flex items-center gap-3 rounded-xl border border-border p-3">
            <span className={cn('flex h-11 w-11 shrink-0 items-center justify-center rounded-full text-sm font-bold ring-1', meta.tone)}>
              {initials(name)}
            </span>
            <div className="min-w-0 flex-1">
              <p className="truncate font-semibold text-foreground">{name}</p>
              <p className="truncate text-xs text-muted-foreground">
                {log.actorEmail}{log.actorId != null ? ` · ID ${log.actorId}` : ''}
              </p>
            </div>
            <span className={cn('inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-semibold ring-1', meta.tone)}>
              <Icon className="h-3 w-3" aria-hidden />
              {log.actorRole && log.actorRole !== 'UNKNOWN' ? roleLabel(log.actorRole) : meta.label}
            </span>
          </div>
          {log.actorEmail && log.actorEmail !== 'unknown' && (
            <button type="button" onClick={() => onFilterActor(log.actorEmail!)}
              className="inline-flex items-center gap-1.5 text-xs font-medium text-primary hover:underline">
              <User className="h-3.5 w-3.5" /> See everything this person did
            </button>
          )}
        </Section>

        <Section title="What">
          <dl className="divide-y divide-border rounded-xl border border-border px-3">
            <Row label="Action"><span className="font-medium">{humanize(log.action)}</span> <span className="font-mono text-[11px] text-muted-foreground">{log.action}</span></Row>
            {log.entityType && (
              <Row label="Item">
                {log.entityType}{log.entityId != null ? ` #${log.entityId}` : ''}
                <button type="button" onClick={() => onFilterEntity(log.entityType!, log.entityId)}
                  className="ml-2 inline-flex items-center gap-1 text-xs font-medium text-primary hover:underline">
                  <History className="h-3 w-3" /> History
                </button>
              </Row>
            )}
            {log.storeId != null && <Row label="Store">#{log.storeId}</Row>}
            {!failed && log.details && <Row label="Details">{log.details}</Row>}
          </dl>
        </Section>

        {(oldValue || newValue) && (
          <Section title="Changes">
            <div className="grid gap-3">
              {oldValue && <CodeBlock title="Before" text={oldValue} tone="old" />}
              {newValue && <CodeBlock title="After" text={newValue} tone="new" />}
            </div>
          </Section>
        )}

        <Section title="Where & how">
          <dl className="divide-y divide-border rounded-xl border border-border px-3">
            <Row label="From">
              <span className="inline-flex items-center gap-1.5">
                {log.source === 'VENDOR_APP' || log.source === 'CUSTOMER_APP' ? <Smartphone className="h-3.5 w-3.5" /> : log.source === 'SYSTEM' ? <Monitor className="h-3.5 w-3.5" /> : <Globe className="h-3.5 w-3.5" />}
                {log.source === 'SYSTEM' ? 'System (automatic)' : sourceLabel(log.source)}
              </span>
            </Row>
            {log.ipAddress && <Row label="IP address" mono>{log.ipAddress}</Row>}
            {log.userAgent && (
              <Row label="Device">
                {describeDevice(log.userAgent)}
                <span className="mt-0.5 block break-all font-mono text-[10px] leading-4 text-muted-foreground">{log.userAgent}</span>
              </Row>
            )}
            {log.httpMethod && log.path && (
              <Row label="Request">
                <span className="inline-flex flex-wrap items-center gap-1.5">
                  <span className={cn('rounded px-1.5 py-0.5 font-mono text-[10px] font-bold', METHOD_TONE[log.httpMethod] ?? 'bg-muted')}>{log.httpMethod}</span>
                  <span className="break-all font-mono text-xs">{log.path}</span>
                </span>
              </Row>
            )}
            {log.durationMs != null && <Row label="Took">{log.durationMs} ms</Row>}
            <Row label="Entry ID" mono>
              <span className="inline-flex items-center gap-1"><Link2 className="h-3 w-3" />{log.id}</span>
            </Row>
          </dl>
        </Section>

        {body && (
          <Section title="What was sent">
            <CodeBlock title="Request body (passwords, PINs and keys hidden)" text={body} />
          </Section>
        )}
      </div>
    </>
  )
}
