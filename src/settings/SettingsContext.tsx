import { createContext, useContext, useState, type ReactNode } from 'react'

const POLL_KEY = 'pref_poll_ms'
export const POLL_OPTIONS = [5000, 8000, 15000, 30000] as const
const DEFAULT_POLL = 8000

interface SettingsState {
  pollMs: number
  setPollMs: (ms: number) => void
}

const Ctx = createContext<SettingsState | null>(null)

export function SettingsProvider({ children }: { children: ReactNode }) {
  const [pollMs, setPollMsState] = useState<number>(() => {
    const saved = Number(localStorage.getItem(POLL_KEY))
    return Number.isFinite(saved) && saved >= 3000 ? saved : DEFAULT_POLL
  })

  const setPollMs = (ms: number) => {
    setPollMsState(ms)
    localStorage.setItem(POLL_KEY, String(ms))
  }

  return <Ctx.Provider value={{ pollMs, setPollMs }}>{children}</Ctx.Provider>
}

export function useSettings(): SettingsState {
  const v = useContext(Ctx)
  if (!v) throw new Error('useSettings must be used within SettingsProvider')
  return v
}
