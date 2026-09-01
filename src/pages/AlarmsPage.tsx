import { useState } from 'react'
import { ackAlarm, type AuthCtx } from '../api/tb'
import type { AlarmInfo, AlarmSeverity } from '../api/types'
import type { PollStatus } from '../hooks/usePoll'
import './AlarmsPage.css'

// Themed in index.css — the light palette darkens the amber/orange ones so they
// stay readable on a white card.
const SEVERITY_COLOR: Record<AlarmSeverity, string> = {
  CRITICAL: 'var(--sev-critical)',
  MAJOR: 'var(--sev-major)',
  MINOR: 'var(--sev-minor)',
  WARNING: 'var(--sev-warning)',
  INDETERMINATE: 'var(--sev-indeterminate)',
}
const SEVERITY_LABEL: Record<AlarmSeverity, string> = {
  CRITICAL: 'วิกฤต',
  MAJOR: 'สูง',
  MINOR: 'กลาง',
  WARNING: 'เตือน',
  INDETERMINATE: 'ไม่ระบุ',
}

function fmtTime(ts: number): string {
  return new Date(ts).toLocaleString('th-TH', {
    day: '2-digit',
    month: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  })
}

interface Props {
  status: PollStatus
  alarms: AlarmInfo[]
  ctx: AuthCtx
  /** Re-run the shell's alarm poll so the card and the tab badge reflect the ack. */
  onAcked: () => void
  onAuthError: () => void
}

// Alarms are polled at the app shell (so the tab badge stays live); this page renders
// them and can acknowledge one.
export function AlarmsPage({ status, alarms, ctx, onAcked, onAuthError }: Props) {
  // Keyed by alarm id — several can be in flight at once.
  const [pending, setPending] = useState<Record<string, boolean>>({})
  const [errors, setErrors] = useState<Record<string, string>>({})

  const onAck = async (id: string) => {
    setPending((p) => ({ ...p, [id]: true }))
    setErrors(({ [id]: _dropped, ...rest }) => rest)
    const res = await ackAlarm(ctx, id)
    setPending(({ [id]: _done, ...rest }) => rest)
    if (res.kind === 'auth_error') {
      onAuthError()
    } else if (res.kind === 'error') {
      setErrors((e) => ({ ...e, [id]: res.message }))
    } else {
      onAcked()
    }
  }

  return (
    <div className="page">
      <header className="page-head">
        <h1>แจ้งเตือน</h1>
        {status === 'ok' && <span className="muted">{alarms.length} รายการ</span>}
      </header>

      {status === 'loading' && alarms.length === 0 ? (
        <div className="center muted">กำลังโหลด...</div>
      ) : alarms.length === 0 ? (
        <div className="center muted">ไม่มีการแจ้งเตือนที่ยังทำงานอยู่</div>
      ) : (
        <div className="alarm-list">
          {alarms.map((a) => {
            const color = SEVERITY_COLOR[a.severity] ?? 'var(--sev-indeterminate)'
            return (
              <div key={a.id.id} className="alarm-card">
                <span className="alarm-stripe" style={{ background: color }} />
                <div className="alarm-body">
                  <div className="alarm-top">
                    <span className="alarm-type">{a.type}</span>
                    <span className="alarm-sev" style={{ color }}>
                      {SEVERITY_LABEL[a.severity] ?? a.severity}
                    </span>
                  </div>
                  <div className="alarm-origin">{a.originatorName}</div>
                  <div className="alarm-bottom">
                    <span className="alarm-time tnum">{fmtTime(a.startTs || a.createdTime)}</span>
                    {a.acknowledged ? (
                      <span className="alarm-ack">รับทราบแล้ว</span>
                    ) : (
                      <button
                        className="alarm-ack-btn"
                        onClick={() => void onAck(a.id.id)}
                        disabled={pending[a.id.id]}
                      >
                        {pending[a.id.id] ? 'กำลังส่ง...' : 'รับทราบ'}
                      </button>
                    )}
                  </div>
                  {errors[a.id.id] && <div className="alarm-err">{errors[a.id.id]}</div>}
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}