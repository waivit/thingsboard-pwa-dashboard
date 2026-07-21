import { useNavigate } from 'react-router-dom'
import { latestTelemetry, type AuthCtx } from '../api/tb'
import type { Device } from '../api/types'
import { usePoll } from '../hooks/usePoll'
import { useSettings } from '../settings/SettingsContext'

interface Props {
  ctx: AuthCtx
  device: Device
  onAuthError: () => void
}

export function DeviceCard({ ctx, device, onAuthError }: Props) {
  const { pollMs } = useSettings()
  const nav = useNavigate()
  const t = usePoll(() => latestTelemetry(ctx, device.id.id), pollMs, onAuthError)
  const values = t.data ?? []
  const stale = t.status === 'error' && values.length > 0
  const headline = values.slice(0, 3)

  const dotClass = t.status === 'ok' ? 'ok' : t.status === 'loading' ? 'muted' : 'err'

  return (
    <button className="device-card" onClick={() => nav(`/devices/${device.id.id}`)}>
      <div className="dc-head">
        <span className="dc-name">{device.label || device.name}</span>
        <span className={`dot ${dotClass}`} />
      </div>
      <div className="dc-type">{device.type}</div>

      {t.status === 'loading' && values.length === 0 ? (
        <div className="dc-muted">กำลังโหลด...</div>
      ) : headline.length === 0 ? (
        <div className="dc-muted">ไม่มีข้อมูล</div>
      ) : (
        <div className="dc-values">
          {headline.map((v) => (
            <div key={v.key} className="dc-value">
              <div className="dc-vkey">{v.key}</div>
              <div className={`dc-vnum tnum ${stale ? 'dim' : ''}`}>{v.value === '' ? '–' : v.value}</div>
            </div>
          ))}
        </div>
      )}
    </button>
  )
}
