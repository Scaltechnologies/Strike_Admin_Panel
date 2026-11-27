import { useEffect, useRef } from 'react'
import { useRouter } from '@tanstack/react-router'
import { toast } from 'sonner'
import { useAlertsStore, fetchAlerts, isUnread, type AdminAlert } from './alerts-store'
import { PRIORITY_RANK } from './alert-meta'
import { AlertToast } from './AlertToast'
import { audioLocked, playAlert, unlockAudioOnGesture } from './sound'

const POLL_VISIBLE_MS = 8_000
const POLL_HIDDEN_MS = 15_000
const REPEAT_MS = 30_000
/** Look back a little on every poll (rows can land just before the server clock reading); ids de-duplicate. */
const OVERLAP_MS = 60_000
const MAX_TOASTS = 3

/**
 * Lives in the dashboard layout: polls the alerts feed, and for anything new rings, pops a card,
 * shows a desktop notification and flashes the tab title. Renders nothing.
 */
export function AlertsWatcher() {
  const router = useRouter()
  const cursor = useRef<string | null>(null)
  const titleTimer = useRef<number | null>(null)
  const baseTitle = useRef(document.title)

  const open = (a: AdminAlert) => {
    useAlertsStore.getState().markRead(a)
    router.history.push(a.link)
  }

  // Sound needs one click/key press on the page first (browser rule).
  useEffect(() => {
    const set = useAlertsStore.getState().setAudioLocked
    set(audioLocked())
    return unlockAudioOnGesture(() => set(false))
  }, [])

  // Polling.
  useEffect(() => {
    let stopped = false
    let timer: number | undefined

    const announce = (fresh: AdminAlert[]) => {
      const { settings } = useAlertsStore.getState()
      const loud = fresh.filter((a) => !settings.silent.includes(a.type))
      if (loud.length === 0) return

      const top = loud.reduce((b, a) => (PRIORITY_RANK[a.priority] > PRIORITY_RANK[b.priority] ? a : b))
      if (settings.sound) {
        const played = playAlert(top.priority, settings.volume)
        if (!played) useAlertsStore.getState().setAudioLocked(true)
      }

      loud.slice(0, MAX_TOASTS).forEach((a) => {
        toast.custom((id) => (
          <AlertToast alert={a} onOpen={() => { toast.dismiss(id); open(a) }} onClose={() => toast.dismiss(id)} />
        ), { id: `alert-${a.id}`, duration: a.priority === 'urgent' ? 15_000 : 8_000 })
      })
      if (loud.length > MAX_TOASTS) {
        toast.info(`${loud.length - MAX_TOASTS} more new alerts — open the bell to see them`)
      }

      if (settings.desktop && 'Notification' in window && Notification.permission === 'granted' && document.hidden) {
        for (const a of loud.slice(0, MAX_TOASTS)) {
          try {
            const n = new Notification(a.title, { body: a.message, tag: a.id, icon: '/strike-bolt.png', requireInteraction: a.priority === 'urgent' })
            n.onclick = () => { window.focus(); open(a); n.close() }
          } catch {
            // Some browsers only allow notifications from a service worker; the in-page alert still shows.
          }
        }
      }

      if (document.hidden) flashTitle(top.title)
    }

    const flashTitle = (text: string) => {
      if (titleTimer.current) window.clearInterval(titleTimer.current)
      let on = false
      titleTimer.current = window.setInterval(() => {
        on = !on
        document.title = on ? `🔔 ${text}` : baseTitle.current
      }, 1000)
    }

    const tick = async () => {
      try {
        const res = await fetchAlerts(cursor.current ?? undefined)
        const first = cursor.current == null
        const fresh = useAlertsStore.getState().merge(res.alerts, res.waiting, !first)
        cursor.current = new Date(new Date(res.serverTime).getTime() - OVERLAP_MS).toISOString()
        if (fresh.length) announce(fresh)
      } catch {
        // Offline or signed out — try again next round.
      } finally {
        if (!stopped) timer = window.setTimeout(tick, document.hidden ? POLL_HIDDEN_MS : POLL_VISIBLE_MS)
      }
    }
    void tick()
    return () => { stopped = true; window.clearTimeout(timer) }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // Keep ringing while an urgent request is waiting and unread.
  useEffect(() => {
    const id = window.setInterval(() => {
      const { alerts, settings, lastReadAt, readIds } = useAlertsStore.getState()
      if (!settings.sound || !settings.repeatUrgent) return
      const waiting = alerts.some((a) => a.priority === 'urgent' && a.actionNeeded && isUnread(a, lastReadAt, readIds) && !settings.silent.includes(a.type)
        && Date.now() - new Date(a.createdAt).getTime() < 6 * 60 * 60_000)
      if (waiting) playAlert('urgent', settings.volume)
    }, REPEAT_MS)
    return () => window.clearInterval(id)
  }, [])

  // Stop flashing the title once the admin is back on the tab.
  useEffect(() => {
    const onVisible = () => {
      if (!document.hidden && titleTimer.current) {
        window.clearInterval(titleTimer.current)
        titleTimer.current = null
        document.title = baseTitle.current
      }
    }
    document.addEventListener('visibilitychange', onVisible)
    return () => document.removeEventListener('visibilitychange', onVisible)
  }, [])

  return null
}
