import { useCallback, useEffect, useRef, useState } from 'react'
import type { ApiResult } from '../api/types'

export type PollStatus = 'loading' | 'ok' | 'error' | 'auth_error'

export interface PollState<T> {
  status: PollStatus
  data: T | null
  errorMessage: string | null
  refetch: () => void
}

// Generic polling: runs `fetcher` on a chained setTimeout (never overlapping), pauses
// while the tab is hidden, and keeps the last good data on error. Mirrors the Expo app's
// useTelemetry/useAlarms pattern. auth_error stops polling and calls onAuthError.
export function usePoll<T>(
  fetcher: () => Promise<ApiResult<T>>,
  pollMs: number,
  onAuthError?: () => void,
): PollState<T> {
  const [status, setStatus] = useState<PollStatus>('loading')
  const [data, setData] = useState<T | null>(null)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)

  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const runningRef = useRef(false)
  const mountedRef = useRef(true)
  const pausedRef = useRef(false)
  const fetcherRef = useRef(fetcher)
  fetcherRef.current = fetcher

  const clearTimer = () => {
    if (timerRef.current != null) {
      clearTimeout(timerRef.current)
      timerRef.current = null
    }
  }

  const tick = useCallback(async () => {
    if (runningRef.current) return
    runningRef.current = true
    clearTimer()
    const res = await fetcherRef.current()
    runningRef.current = false
    if (!mountedRef.current) return

    if (res.kind === 'ok') {
      setData(res.data)
      setStatus('ok')
      setErrorMessage(null)
    } else if (res.kind === 'auth_error') {
      setStatus('auth_error')
      setErrorMessage(res.message)
      onAuthError?.()
      return
    } else {
      setStatus('error')
      setErrorMessage(res.message)
    }
    if (!pausedRef.current) timerRef.current = setTimeout(tick, pollMs)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pollMs])

  const refetch = useCallback(() => {
    clearTimer()
    void tick()
  }, [tick])

  useEffect(() => {
    mountedRef.current = true
    void tick()

    const onVisibility = () => {
      if (document.hidden) {
        pausedRef.current = true
        clearTimer()
      } else if (pausedRef.current) {
        pausedRef.current = false
        void tick()
      }
    }
    document.addEventListener('visibilitychange', onVisibility)

    return () => {
      mountedRef.current = false
      clearTimer()
      document.removeEventListener('visibilitychange', onVisibility)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pollMs])

  return { status, data, errorMessage, refetch }
}
