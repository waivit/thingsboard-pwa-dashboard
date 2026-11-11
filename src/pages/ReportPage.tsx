import { useEffect, useMemo, useState } from 'react'
import { usageEvents, type AuthCtx, type UsageEvent } from '../api/tb'
import { DASHBOARDS, USAGE_DEVICE_ID } from '../dashboards'
import './ReportPage.css'

const DAY = 24 * 60 * 60 * 1000
const RANGES = [
  { key: 'today', label: 'วันนี้', days: 1 },
  { key: '7d', label: '7 วัน', days: 7 },
  { key: '30d', label: '30 วัน', days: 30 },
] as const
type RangeKey = (typeof RANGES)[number]['key']

const STATIC_PAGES: Record<string, string> = {
  '/alarms': 'แจ้งเตือน',
  '/settings': 'ตั้งค่า',
  '/devices': 'อุปกรณ์',
  '/history': 'กราฟ',
  '/report': 'รายงาน',
}

function pageLabel(path: string): string {
  const dash = DASHBOARDS.find((d) => path === `/d/${d.id}`)
  if (dash) return dash.label
  if (path.startsWith('/devices/')) return 'รายละเอียดอุปกรณ์'
  return STATIC_PAGES[path] ?? path
}

// Coarse, dependency-free User-Agent summary: enough to tell phones apart in a list.
function uaLabel(ua: string): string {
  const os = /iPhone|iPad/.test(ua)
    ? 'iOS'
    : /Android/.test(ua)
      ? 'Android'
      : /Windows/.test(ua)
        ? 'Windows'
        : /Mac OS/.test(ua)
          ? 'macOS'
          : 'อื่น ๆ'
  const browser = /Edg\//.test(ua)
    ? 'Edge'
    : /SamsungBrowser/.test(ua)
      ? 'Samsung'
      : /CriOS|Chrome\//.test(ua)
        ? 'Chrome'
        : /Safari\//.test(ua)
          ? 'Safari'
          : /Firefox\//.test(ua)
            ? 'Firefox'
            : ''
  return browser ? `${os} · ${browser}` : os
}

const fmtTime = (ts: number) =>
  new Date(ts).toLocaleString('th-TH', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })

function startOfDay(ts: number): number {
  const d = new Date(ts)
  d.setHours(0, 0, 0, 0)
  return d.getTime()
}

interface Props {
  ctx: AuthCtx
  onAuthError: () => void
}

export function ReportPage({ ctx, onAuthError }: Props) {
  const [range, setRange] = useState<RangeKey>('7d')
  const [events, setEvents] = useState<UsageEvent[] | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [userFilter, setUserFilter] = useState<string>('') // '' = all users
  const days = RANGES.find((r) => r.key === range)!.days

  useEffect(() => {
    let cancelled = false
    setEvents(null)
    setError(null)
    const end = Date.now()
    const start = startOfDay(end) - (days - 1) * DAY
    void usageEvents(ctx, USAGE_DEVICE_ID, start, end).then((r) => {
      if (cancelled) return
      if (r.kind === 'auth_error') return onAuthError()
      if (r.kind === 'error') return setError(r.message)
      setEvents(r.data)
    })
    return () => {
      cancelled = true
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [days])

  // Every user seen in the range, independent of the filter, so the chips stay put.
  const users = useMemo(() => {
    const m = new Map<string, { user: string; last: number; opens: number; count: number; devices: Set<string> }>()
    for (const e of events ?? []) {
      let u = m.get(e.user)
      if (!u) {
        u = { user: e.user, last: e.ts, opens: 0, count: 0, devices: new Set() }
        m.set(e.user, u)
      }
      u.count++
      if (e.event === 'open_app') u.opens++
      u.devices.add(e.deviceId)
    }
    return [...m.values()].sort((a, b) => b.count - a.count)
  }, [events])

  const filtered = useMemo(
    () => (events && userFilter ? events.filter((e) => e.user === userFilter) : events),
    [events, userFilter],
  )

  const stats = useMemo(() => {
    const events = filtered
    if (!events) return null
    const opens = events.filter((e) => e.event === 'open_app').length

    // Daily buckets for the chart, oldest first.
    const today = startOfDay(Date.now())
    const buckets = Array.from({ length: days }, (_, i) => ({ day: today - (days - 1 - i) * DAY, count: 0 }))
    for (const e of events) {
      const b = buckets.find((x) => x.day === startOfDay(e.ts))
      if (b) b.count++
    }

    const pageCounts = new Map<string, number>()
    for (const e of events) {
      const label = pageLabel(e.page)
      pageCounts.set(label, (pageCounts.get(label) ?? 0) + 1)
    }
    const pages = [...pageCounts.entries()].sort((a, b) => b[1] - a[1])

    // Events are newest first, so the first one seen per device is its latest.
    const devices = new Map<string, { id: string; last: UsageEvent; count: number }>()
    for (const e of events) {
      const d = devices.get(e.deviceId)
      if (d) d.count++
      else devices.set(e.deviceId, { id: e.deviceId, last: e, count: 1 })
    }

    const userCount = new Set(events.map((e) => e.user)).size
    return { opens, buckets, pages, devices: [...devices.values()], userCount, total: events.length }
  }, [filtered, days])

  return (
    <div className="page">
      <header className="page-head">
        <h1>รายงานการใช้งาน</h1>
      </header>

      <div className="report-body">
        <div className="chip-row">
          {RANGES.map((r) => (
            <button key={r.key} className={`chip${r.key === range ? ' on' : ''}`} onClick={() => setRange(r.key)}>
              {r.label}
            </button>
          ))}
        </div>

        {error ? (
          <div className="center muted">โหลดข้อมูลไม่ได้ ({error})</div>
        ) : !events || !filtered || !stats ? (
          <div className="center muted">กำลังโหลด...</div>
        ) : events.length === 0 ? (
          <div className="center muted">ยังไม่มีข้อมูลในช่วงนี้</div>
        ) : (
          <>
            {users.length > 1 && (
              <div className="chip-row">
                <button className={`chip${userFilter === '' ? ' on' : ''}`} onClick={() => setUserFilter('')}>
                  ทั้งหมด
                </button>
                {users.map((u) => (
                  <button
                    key={u.user}
                    className={`chip${userFilter === u.user ? ' on' : ''}`}
                    onClick={() => setUserFilter(u.user)}
                  >
                    {u.user}
                  </button>
                ))}
              </div>
            )}

            <div className="r-stats">
              <Stat value={stats.userCount} label="ผู้ใช้" />
              <Stat value={stats.opens} label="เปิดแอป" />
              <Stat value={stats.devices.length} label="เครื่อง" />
              <Stat value={stats.total} label="ครั้งทั้งหมด" />
            </div>

            {days > 1 && (
              <>
                <div className="s-section">การใช้งานรายวัน</div>
                <DailyChart buckets={stats.buckets} />
              </>
            )}

            <div className="s-section">หน้าที่เปิดบ่อย</div>
            <div className="s-card">
              {stats.pages.map(([label, n]) => (
                <div key={label} className="r-bar-row">
                  <span className="r-bar-label">{label}</span>
                  <span className="r-bar-track">
                    <span className="r-bar-fill" style={{ width: `${(n / stats.pages[0][1]) * 100}%` }} />
                  </span>
                  <span className="r-bar-n">{n}</span>
                </div>
              ))}
            </div>

            {!userFilter && (
              <>
                <div className="s-section">ผู้ใช้</div>
                <div className="s-card">
                  {users.map((u) => (
                    <button key={u.user} className="r-row r-row-btn" onClick={() => setUserFilter(u.user)}>
                      <div className="r-grow">
                        <div className="r-main r-ellipsis">{u.user || '–'}</div>
                        <div className="r-sub muted">
                          เปิดแอป {u.opens} · {u.devices.size} เครื่อง · ล่าสุด {fmtTime(u.last)}
                        </div>
                      </div>
                      <span className="r-n">{u.count}</span>
                    </button>
                  ))}
                </div>
              </>
            )}

            <div className="s-section">เครื่องที่ใช้งาน</div>
            <div className="s-card">
              {stats.devices.map((d) => (
                <div key={d.id} className="r-row">
                  <div>
                    <div className="r-main">
                      {uaLabel(d.last.ua)} <span className="muted">#{d.id.slice(0, 6)}</span>
                    </div>
                    <div className="r-sub muted r-ellipsis">
                      {d.last.user} · {d.last.ip} · ล่าสุด {fmtTime(d.last.ts)}
                    </div>
                  </div>
                  <span className="r-n">{d.count}</span>
                </div>
              ))}
            </div>

            <div className="s-section">ล่าสุด</div>
            <div className="s-card">
              {filtered.slice(0, 50).map((e) => (
                <div key={e.ts} className="r-row">
                  <div>
                    <div className="r-main">
                      {e.event === 'open_app' ? 'เปิดแอป · ' : ''}
                      {pageLabel(e.page)}
                    </div>
                    <div className="r-sub muted r-ellipsis">
                      {e.user} · #{e.deviceId.slice(0, 6)} · {e.ip}
                    </div>
                  </div>
                  <span className="r-sub muted">{fmtTime(e.ts)}</span>
                </div>
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  )
}

function Stat({ value, label }: { value: number; label: string }) {
  return (
    <div className="r-stat">
      <div className="r-stat-v">{value.toLocaleString('th-TH')}</div>
      <div className="r-stat-l muted">{label}</div>
    </div>
  )
}

function DailyChart({ buckets }: { buckets: { day: number; count: number }[] }) {
  const max = Math.max(1, ...buckets.map((b) => b.count))
  const w = 300
  const h = 110
  const gap = 2
  const bw = (w - gap * (buckets.length - 1)) / buckets.length
  // Label roughly 7 days evenly so 30 bars stay readable.
  const every = Math.ceil(buckets.length / 7)
  return (
    <div className="s-card r-chart">
      <svg viewBox={`0 0 ${w} ${h + 14}`} width="100%" role="img" aria-label="กราฟการใช้งานรายวัน">
        {buckets.map((b, i) => {
          const bh = (b.count / max) * h
          const x = i * (bw + gap)
          return (
            <g key={b.day}>
              <rect x={x} y={h - bh} width={bw} height={Math.max(bh, 0.5)} rx={1.5} fill="var(--accent)">
                <title>
                  {new Date(b.day).toLocaleDateString('th-TH', { day: 'numeric', month: 'short' })}: {b.count}
                </title>
              </rect>
              {i % every === 0 && (
                <text x={x + bw / 2} y={h + 11} fontSize={8} textAnchor="middle" fill="var(--muted)">
                  {new Date(b.day).getDate()}
                </text>
              )}
            </g>
          )
        })}
      </svg>
    </div>
  )
}
