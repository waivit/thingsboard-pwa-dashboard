import { useEffect, useState } from 'react'
import { useAuth } from '../auth/AuthContext'
import { decodeClaims } from '../api/tb'
import { useSettings, POLL_OPTIONS, THEME_OPTIONS, type Theme } from '../settings/SettingsContext'
import { currentSubscription, disablePush, enablePush, pushSupported } from '../push/webpush'
import './SettingsPage.css'

const THEME_LABEL: Record<Theme, string> = {
  system: 'ตามระบบ',
  light: 'สว่าง',
  dark: 'มืด',
}

export function SettingsPage() {
  const { token, signOut } = useAuth()
  const { pollMs, setPollMs, theme, setTheme } = useSettings()
  const claims = decodeClaims(token)
  const role = claims.scopes?.join(', ') ?? '–'

  const [pushOn, setPushOn] = useState(false)
  const [pushBusy, setPushBusy] = useState(false)
  const [pushError, setPushError] = useState<string | null>(null)

  useEffect(() => {
    void currentSubscription().then((s) => setPushOn(!!s))
  }, [])

  const togglePush = async (on: boolean) => {
    if (pushBusy) return
    setPushError(null)
    setPushBusy(true)
    if (on) {
      const err = await enablePush()
      if (err) setPushError(err)
      else setPushOn(true)
    } else {
      await disablePush()
      setPushOn(false)
    }
    setPushBusy(false)
  }

  return (
    <div className="page">
      <header className="page-head">
        <h1>ตั้งค่า</h1>
      </header>

      <div className="settings-body">
        <div className="s-section">บัญชี</div>
        <div className="s-card">
          <div className="s-row">
            <span className="s-label">Server</span>
            <span className="s-value">nonthaburi.info</span>
          </div>
          <div className="s-row">
            <span className="s-label">สิทธิ์</span>
            <span className="s-value">{role}</span>
          </div>
        </div>

        <div className="s-section">ธีม</div>
        <div className="chip-row">
          {THEME_OPTIONS.map((t) => (
            <button key={t} className={`chip${t === theme ? ' on' : ''}`} onClick={() => setTheme(t)}>
              {THEME_LABEL[t]}
            </button>
          ))}
        </div>

        <div className="s-section">รอบดึงข้อมูล (poll)</div>
        <div className="chip-row">
          {POLL_OPTIONS.map((ms) => (
            <button key={ms} className={`chip${ms === pollMs ? ' on' : ''}`} onClick={() => setPollMs(ms)}>
              {ms / 1000} วิ
            </button>
          ))}
        </div>

        <div className="s-section">การแจ้งเตือน (push)</div>
        <div className="s-card">
          <div className="s-row switch-row">
            <span className="s-label">แจ้งเตือนเมื่อมี alarm</span>
            <label className="switch">
              <input
                type="checkbox"
                checked={pushOn}
                disabled={pushBusy || !pushSupported()}
                onChange={(e) => void togglePush(e.target.checked)}
              />
              <span className="slider" />
            </label>
          </div>
        </div>
        {pushError && <div className="s-push-err">{pushError}</div>}
        {!pushSupported() && <div className="s-push-note">เบราว์เซอร์นี้ไม่รองรับ push</div>}

        <button className="logout" onClick={signOut}>
          ออกจากระบบ
        </button>
        <div className="s-version">เวอร์ชัน {import.meta.env.VITE_COMMIT_SHA ?? 'dev'}</div>
      </div>
    </div>
  )
}