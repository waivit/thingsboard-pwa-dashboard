import { createContext, useContext, useEffect, useRef, useState, type ReactNode } from 'react'
import { login as apiLogin, type AuthCtx } from '../api/tb'
import type { LoginResp } from '../api/types'

// Web SPA: tokens in localStorage. The password is never stored — log in once, keep the
// JWT + refresh token. (Same-origin with ThingsBoard; XSS risk is the standard SPA
// tradeoff, acceptable for this internal tool.)
const TOKEN_KEY = 'tb_token'
const REFRESH_KEY = 'tb_refresh'

type Phase = 'loading' | 'signed_out' | 'signed_in'

interface AuthState {
  phase: Phase
  signIn: (username: string, password: string) => Promise<string | null>
  signOut: () => void
  apiCtx: AuthCtx
  token: string
}

const Ctx = createContext<AuthState | null>(null)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [phase, setPhase] = useState<Phase>('loading')
  const [token, setToken] = useState('')
  const tokenRef = useRef('')
  const refreshRef = useRef('')

  useEffect(() => {
    const t = localStorage.getItem(TOKEN_KEY)
    const r = localStorage.getItem(REFRESH_KEY)
    if (t && r) {
      tokenRef.current = t
      refreshRef.current = r
      setToken(t)
      setPhase('signed_in')
    } else {
      setPhase('signed_out')
    }
  }, [])

  const persist = (resp: LoginResp) => {
    tokenRef.current = resp.token
    refreshRef.current = resp.refreshToken
    setToken(resp.token)
    localStorage.setItem(TOKEN_KEY, resp.token)
    localStorage.setItem(REFRESH_KEY, resp.refreshToken)
  }

  const signIn = async (username: string, password: string): Promise<string | null> => {
    const res = await apiLogin(username, password)
    if (res.kind !== 'ok') return res.message
    persist(res.data)
    setPhase('signed_in')
    return null
  }

  const signOut = () => {
    tokenRef.current = ''
    refreshRef.current = ''
    setToken('')
    localStorage.removeItem(TOKEN_KEY)
    localStorage.removeItem(REFRESH_KEY)
    setPhase('signed_out')
  }

  const apiCtx: AuthCtx = {
    getToken: () => tokenRef.current,
    getRefreshToken: () => refreshRef.current,
    onRefreshed: persist,
  }

  return <Ctx.Provider value={{ phase, signIn, signOut, apiCtx, token }}>{children}</Ctx.Provider>
}

export function useAuth(): AuthState {
  const v = useContext(Ctx)
  if (!v) throw new Error('useAuth must be used within AuthProvider')
  return v
}
