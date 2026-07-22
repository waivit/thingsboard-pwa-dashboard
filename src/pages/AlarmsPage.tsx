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
}

// Alarms are polled at the app shell (so the tab badge stays live); this page just renders.
export function AlarmsPage({ status, alarms }: Props) {
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
                    <span className="alarm-ack">{a.acknowledged ? 'รับทราบแล้ว' : 'ยังไม่รับทราบ'}</span>
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}