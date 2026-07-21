import { useCallback, useEffect, useRef, useState } from 'react'
import {
  historyTelemetry,
  listDevices,
  timeseriesKeys,
  type AuthCtx,
  type HistoryPoint,
} from '../api/tb'
import type { Device } from '../api/types'
import { LineChart } from '../components/LineChart'
import './HistoryPage.css'

const RANGES: { label: string; ms: number }[] = [
  { label: '1 ชม.', ms: 3_600_000 },
  { label: '6 ชม.', ms: 21_600_000 },
  { label: '24 ชม.', ms: 86_400_000 },
  { label: '7 วัน', ms: 604_800_000 },
]

type Status = 'loading' | 'ok' | 'empty' | 'error'

interface Props {
  ctx: AuthCtx
  onAuthError: () => void
}

export function HistoryPage({ ctx, onAuthError }: Props) {
  const [devices, setDevices] = useState<Device[]>([])
  const [deviceId, setDeviceId] = useState<string | null>(null)
  const [keys, setKeys] = useState<string[]>([])
  const [key, setKey] = useState<string | null>(null)
  const [rangeMs, setRangeMs] = useState(RANGES[0].ms)
  const [points, setPoints] = useState<HistoryPoint[]>([])
  const [status, setStatus] = useState<Status>('loading')
  const [chartW, setChartW] = useState(320)
  const boxRef = useRef<HTMLDivElement>(null)
  const fetchGen = useRef(0)

  useEffect(() => {
    void (async () => {
      const res = await listDevices(ctx)
      if (res.kind === 'auth_error') return onAuthError()
      if (res.kind !== 'ok') return setStatus('error')
      const sorted = [...res.data].sort((a, b) => a.name.localeCompare(b.name))
      setDevices(sorted)
      setDeviceId(sorted[0]?.id.id ?? null)
    })()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  useEffect(() => {
    if (!deviceId) return
    setKeys([])
    setKey(null)
    void (async () => {
      const res = await timeseriesKeys(ctx, deviceId)
      if (res.kind === 'auth_error') return onAuthError()
      if (res.kind !== 'ok') return
      const sorted = [...res.data].sort()
      setKeys(sorted)
      setKey(sorted[0] ?? null)
    })()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [deviceId])

  const load = useCallback(async () => {
    if (!deviceId || !key) return
    const gen = ++fetchGen.current
    setStatus('loading')
    const end = Date.now()
    const res = await historyTelemetry(ctx, deviceId, key, end - rangeMs, end)
    if (gen !== fetchGen.current) return
    if (res.kind === 'auth_error') return onAuthError()
    if (res.kind !== 'ok') return setStatus('error')
    setPoints(res.data)
    setStatus(res.data.length ? 'ok' : 'empty')
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ctx, deviceId, key, rangeMs])

  useEffect(() => {
    void load()
  }, [load])

  // Measure chart width responsively.
  useEffect(() => {
    const measure = () => {
      if (boxRef.current) setChartW(boxRef.current.clientWidth - 24)
    }
    measure()
    window.addEventListener('resize', measure)
    return () => window.removeEventListener('resize', measure)
  }, [])

  const last = points[points.length - 1]

  return (
    <div className="page">
      <header className="page-head">
        <h1>กราฟย้อนหลัง</h1>
        <button className="link-btn" onClick={() => void load()}>
          รีเฟรช
        </button>
      </header>

      <div className="hist-body">
        <div className="hist-label">อุปกรณ์</div>
        <ChipRow items={devices.map((d) => ({ id: d.id.id, label: d.label || d.name }))} selected={deviceId} onSelect={setDeviceId} />

        <div className="hist-label">ค่า</div>
        {keys.length === 0 ? (
          <div className="muted">—</div>
        ) : (
          <ChipRow items={keys.map((k) => ({ id: k, label: k }))} selected={key} onSelect={setKey} />
        )}

        <div className="hist-label">ช่วงเวลา</div>
        <div className="chip-row">
          {RANGES.map((r) => (
            <button key={r.ms} className={`chip${r.ms === rangeMs ? ' on' : ''}`} onClick={() => setRangeMs(r.ms)}>
              {r.label}
            </button>
          ))}
        </div>

        <div className="chart-box" ref={boxRef}>
          {status === 'loading' ? (
            <div className="center muted" style={{ padding: '48px 0' }}>กำลังโหลด...</div>
          ) : status === 'error' ? (
            <div className="muted">โหลดข้อมูลไม่ได้</div>
          ) : status === 'empty' ? (
            <div className="muted">ไม่มีข้อมูลตัวเลขในช่วงนี้</div>
          ) : (
            <>
              {last && (
                <div className="hist-latest">
                  ล่าสุด {last.value} <span className="muted">({points.length} จุด)</span>
                </div>
              )}
              <LineChart points={points} width={chartW} />
            </>
          )}
        </div>
      </div>
    </div>
  )
}

function ChipRow({
  items,
  selected,
  onSelect,
}: {
  items: { id: string; label: string }[]
  selected: string | null
  onSelect: (id: string) => void
}) {
  return (
    <div className="chip-row scroll">
      {items.map((it) => (
        <button key={it.id} className={`chip${it.id === selected ? ' on' : ''}`} onClick={() => onSelect(it.id)}>
          {it.label}
        </button>
      ))}
    </div>
  )
}