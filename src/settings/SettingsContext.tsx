import { createContext, useContext, useEffect, useState, type ReactNode } from 'react'

const POLL_KEY = 'pref_poll_ms'
export const POLL_OPTIONS = [5000, 8000, 15000, 30000] as const
const DEFAULT_POLL = 8000

// Must match the key read by the pre-paint script in index.html.
const THEME_KEY = 'pref_theme'
export const THEME_OPTIONS = ['system', 'light', 'dark'] as const
export type Theme = (typeof THEME_OPTIONS)[number]
const DEFAULT_THEME: Theme = 'system'
const DARK_QUERY = '(prefers-color-scheme: dark)'

interface SettingsState {
  pollMs: number
  setPollMs: (ms: number) => void
  theme: Theme
  setTheme: (t: Theme) => void
}

const Ctx = createContext<SettingsState | null>(null)

/** Resolve 'system' against the OS preference and paint the result on <html>. */
function applyTheme(theme: Theme) {
  const resolved =
    theme === 'system' ? (window.matchMedia(DARK_QUERY).matches ? 'dark' : 'light') : theme
  document.documentElement.dataset.theme = resolved
  // Keep the phone's status/URL bar in step. Read the colour back from CSS rather than
  // repeating the hex here, so index.css stays the single source of truth.
  const bg = getComputedStyle(document.documentElement).getPropertyValue('--bg').trim()
  if (bg) document.querySelector('meta[name="theme-color"]')?.setAttribute('content', bg)
}

export function SettingsProvider({ children }: { children: ReactNode }) {
  const [pollMs, setPollMsState] = useState<number>(() => {
    const saved = Number(localStorage.getItem(POLL_KEY))
    return Number.isFinite(saved) && saved >= 3000 ? saved : DEFAULT_POLL
  })

  const [theme, setThemeState] = useState<Theme>(() => {
    const saved = localStorage.getItem(THEME_KEY) as Theme | null
    return saved && THEME_OPTIONS.includes(saved) ? saved : DEFAULT_THEME
  })

  useEffect(() => {
    applyTheme(theme)
    // Only 'system' has to track the OS; the explicit choices are already painted.
    if (theme !== 'system') return
    const mq = window.matchMedia(DARK_QUERY)
    const onChange = () => applyTheme('system')
    mq.addEventListener('change', onChange)
    return () => mq.removeEventListener('change', onChange)
  }, [theme])

  const setPollMs = (ms: number) => {
    setPollMsState(ms)
    localStorage.setItem(POLL_KEY, String(ms))
  }

  const setTheme = (t: Theme) => {
    setThemeState(t)
    localStorage.setItem(THEME_KEY, t)
  }

  return (
    <Ctx.Provider value={{ pollMs, setPollMs, theme, setTheme }}>{children}</Ctx.Provider>
  )
}

export function useSettings(): SettingsState {
  const v = useContext(Ctx)
  if (!v) throw new Error('useSettings must be used within SettingsProvider')
  return v
}
