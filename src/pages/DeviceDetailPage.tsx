import { useNavigate, useParams } from 'react-router-dom'
import { latestTelemetry, type AuthCtx } from '../api/tb'
import { usePoll } from '../hooks/usePoll'
import { useSettings } from '../settings/SettingsContext'
import './DeviceDetailPage.css'

interface Props {
  ctx: AuthCtx
  onAuthError: () => void
}

// Device id comes from the route (/devices/:id). The device name isn't in the URL, so
// the header just shows the id-scoped telemetry; the list already labels devices.
export function DeviceDetailPage({ ctx, onAuthError }: Props) {
  const { id = '' } = useParams()
  const nav = useNavigate()
  const { pollMs } = useSettings()
  const t = usePoll(() => latestTelemetry(ctx, id), pollMs, onAuthError)
  const values = t.data ?? []
  const stale = t.status === 'error' && values.length > 0
  const dotClass = t.status === 'ok' ? 'ok' : t.status === 'loading' ? 'muted' : 'err'

  return (
    <div className="page">
      <header className="page-head detail-head">
        <button className="back" onClick={() => nav('/devices')}>
          ‹ กลับ
        </button>
        <span className={`dot ${dotClass}`} />
      </header>

      {t.status === 'loading' && values.length === 0 ? (
        <div className="center muted">กำลังโหลด...</div>
      ) : values.length === 0 ? (
        <div className="center muted">ไม่มีข้อมูล telemetry</div>
      ) : (
        <div className="value-table">
          {values.map((v) => (
            <div key={v.key} className="value-row">
              <span className="vr-key">{v.key}</span>
              <span className={`vr-val tnum ${stale ? 'dim' : ''}`}>{v.value === '' ? '–' : v.value}</span>
            </div>
          ))}
          {stale && <div className="stale-note">⚠ แสดงค่าล่าสุด — เชื่อมต่อไม่ได้ชั่วคราว</div>}
        </div>
      )}
    </div>
  )
}