import { useEffect, useRef, useState } from 'react'
import { registerSW } from 'virtual:pwa-register'

// How often to ask the browser to re-fetch sw.js while the app stays open.
const UPDATE_INTERVAL_MS = 30 * 60 * 1000

interface UpdatePrompt {
  /** A new version has installed and is waiting to take over. */
  needRefresh: boolean
  /** Activate the waiting worker; the page reloads once it takes control. */
  update: () => void
  /** Stay on the current version until the next check. */
  dismiss: () => void
}

/**
 * Registers the service worker and reports when a new build is waiting.
 *
 * The periodic + visibility-driven `update()` calls are the point of this hook: an
 * installed PWA is resumed rather than reloaded, so registration alone would only ever
 * check for a new worker on the rare cold start, and a phone left with the app open
 * would sit on a stale build indefinitely.
 */
export function useUpdatePrompt(): UpdatePrompt {
  const [needRefresh, setNeedRefresh] = useState(false)
  const updateRef = useRef<(reload?: boolean) => Promise<void>>(async () => {})

  useEffect(() => {
    let cancelled = false
    let timer: ReturnType<typeof setInterval> | undefined
    let removeVisibilityListener = () => {}

    const check = (reg: ServiceWorkerRegistration) => {
      // Offline, or the CDN is unreachable — nothing to do until the next tick.
      void reg.update().catch(() => {})
    }

    updateRef.current = registerSW({
      immediate: true,
      onNeedRefresh() {
        if (!cancelled) setNeedRefresh(true)
      },
      onRegisteredSW(_url, reg) {
        if (!reg || cancelled) return
        timer = setInterval(() => check(reg), UPDATE_INTERVAL_MS)
        const onVisible = () => {
          if (document.visibilityState === 'visible') check(reg)
        }
        document.addEventListener('visibilitychange', onVisible)
        removeVisibilityListener = () => document.removeEventListener('visibilitychange', onVisible)
      },
    })

    return () => {
      cancelled = true
      if (timer) clearInterval(timer)
      removeVisibilityListener()
    }
  }, [])

  return {
    needRefresh,
    update: () => void updateRef.current(true),
    dismiss: () => setNeedRefresh(false),
  }
}
