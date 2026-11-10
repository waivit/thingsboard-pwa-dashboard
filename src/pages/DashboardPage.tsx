// Placeholder dashboard with static sample data — no API calls yet.
const STATS = [
  { label: 'อุปกรณ์ออนไลน์', value: '12' },
  { label: 'แจ้งเตือนวันนี้', value: '3' },
  { label: 'อุณหภูมิเฉลี่ย', value: '29.4°' },
]

const BARS = [40, 65, 30, 80, 55, 90, 70]
const DAYS = ['จ', 'อ', 'พ', 'พฤ', 'ศ', 'ส', 'อา']

export function DashboardPage() {
  return (
    <div style={{ padding: 16 }}>
      <h2 style={{ margin: '0 0 12px' }}>แดชบอร์ด</h2>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 8 }}>
        {STATS.map((s) => (
          <div key={s.label} style={{ border: '1px solid var(--border)', borderRadius: 10, padding: 10 }}>
            <div style={{ fontSize: 22, fontWeight: 800 }}>{s.value}</div>
            <div className="muted" style={{ fontSize: 11 }}>{s.label}</div>
          </div>
        ))}
      </div>
      <div style={{ border: '1px solid var(--border)', borderRadius: 10, padding: 12, marginTop: 12 }}>
        <div className="muted" style={{ fontSize: 12, marginBottom: 8 }}>ข้อมูลตัวอย่าง 7 วัน</div>
        <svg viewBox="0 0 140 110" width="100%" role="img" aria-label="กราฟแท่งตัวอย่าง">
          {BARS.map((h, i) => (
            <g key={i}>
              <rect x={i * 20 + 4} y={95 - h} width={12} height={h} rx={2} fill="var(--accent)" />
              <text x={i * 20 + 10} y={106} fontSize={7} textAnchor="middle" fill="var(--muted)">
                {DAYS[i]}
              </text>
            </g>
          ))}
        </svg>
      </div>
    </div>
  )
}
