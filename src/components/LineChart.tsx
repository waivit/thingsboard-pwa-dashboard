import type { HistoryPoint } from '../api/types'
import './LineChart.css'

interface Props {
  points: HistoryPoint[]
  width: number
  height?: number
}

const PAD_L = 44
const PAD_R = 12
const PAD_T = 12
const PAD_B = 22

function fmtNum(n: number): string {
  if (Math.abs(n) >= 1000) return n.toFixed(0)
  if (Math.abs(n) >= 10) return n.toFixed(1)
  return n.toFixed(2)
}
function fmtTime(ts: number): string {
  return new Date(ts).toLocaleTimeString('th-TH', { hour: '2-digit', minute: '2-digit' })
}

// Minimal SVG line chart — polyline + min/max y labels + start/end x labels.
export function LineChart({ points, width, height = 220 }: Props) {
  if (points.length < 2) {
    return (
      <div className="muted" style={{ height, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        ข้อมูลไม่พอสำหรับวาดกราฟ
      </div>
    )
  }

  const plotW = width - PAD_L - PAD_R
  const plotH = height - PAD_T - PAD_B
  const values = points.map((p) => p.value)
  let min = Math.min(...values)
  let max = Math.max(...values)
  if (min === max) {
    min -= 1
    max += 1
  }
  const t0 = points[0].ts
  const t1 = points[points.length - 1].ts
  const tSpan = t1 - t0 || 1

  const x = (ts: number) => PAD_L + ((ts - t0) / tSpan) * plotW
  const y = (v: number) => PAD_T + (1 - (v - min) / (max - min)) * plotH
  const poly = points.map((p) => `${x(p.ts)},${y(p.value)}`).join(' ')
  const last = points[points.length - 1]

  return (
    <svg width={width} height={height}>
      <line className="lc-axis" x1={PAD_L} y1={PAD_T} x2={PAD_L} y2={PAD_T + plotH} strokeWidth={1} />
      <line
        className="lc-axis"
        x1={PAD_L}
        y1={PAD_T + plotH}
        x2={PAD_L + plotW}
        y2={PAD_T + plotH}
        strokeWidth={1}
      />
      <text className="lc-label" x={PAD_L - 6} y={PAD_T + 4} fontSize={10} textAnchor="end">
        {fmtNum(max)}
      </text>
      <text className="lc-label" x={PAD_L - 6} y={PAD_T + plotH} fontSize={10} textAnchor="end">
        {fmtNum(min)}
      </text>
      <text className="lc-label" x={PAD_L} y={height - 6} fontSize={10} textAnchor="start">
        {fmtTime(t0)}
      </text>
      <text className="lc-label" x={PAD_L + plotW} y={height - 6} fontSize={10} textAnchor="end">
        {fmtTime(t1)}
      </text>
      <polyline className="lc-line" points={poly} fill="none" strokeWidth={2} />
      <circle className="lc-dot" cx={x(last.ts)} cy={y(last.value)} r={3.5} />
    </svg>
  )
}