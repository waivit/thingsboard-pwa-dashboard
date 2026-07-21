import { useAuth } from '../auth/AuthContext'
import { decodeClaims } from '../api/tb'
import { useSettings, POLL_OPTIONS } from '../settings/SettingsContext'
import './SettingsPage.css'

export function SettingsPage() {
  const { token, signOut } = useAuth()
  const { pollMs, setPollMs } = useSettings()
  const claims = decodeClaims(token)
  const role = claims.scopes?.join(', ') ?? '–'

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

        <div className="s-section">รอบดึงข้อมูล (poll)</div>
        <div className="chip-row">
          {POLL_OPTIONS.map((ms) => (
            <button key={ms} className={`chip${ms === pollMs ? ' on' : ''}`} onClick={() => setPollMs(ms)}>
              {ms / 1000} วิ
            </button>
          ))}
        </div>

        <button className="logout" onClick={signOut}>
          ออกจากระบบ
        </button>
        <div className="s-version">เวอร์ชัน 1.0.0 (web)</div>
      </div>
    </div>
  )
}