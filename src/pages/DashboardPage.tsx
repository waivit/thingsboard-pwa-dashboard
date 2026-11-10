import { useEffect, useState } from 'react'
import { getDashboardInfo, type AuthCtx } from '../api/tb'

// ThingsBoard dashboards offered in this tab. Each is shown only if the signed-in user
// can open it in ThingsBoard; access itself is still governed by ThingsBoard assignment.
const DASHBOARD_IDS = ['44de3680-a501-11f1-8033-a3328dc62c1a', '0aefc640-3a40-11f1-b8ba-0b85bde787de']

interface Dash {
  id: string
  title: string
}

interface Props {
  ctx: AuthCtx
  onAuthError: () => void
}

export function DashboardPage({ ctx, onAuthError }: Props) {
  const [dashes, setDashes] = useState<Dash[] | null>(null)
  const [selected, setSelected] = useState<string>('')

  useEffect(() => {
    let cancelled = false
    void Promise.all(DASHBOARD_IDS.map((id) => getDashboardInfo(ctx, id).then((r) => ({ id, r })))).then(
      (results) => {
        if (cancelled) return
        if (results.some((x) => x.r.kind === 'auth_error')) return onAuthError()
        const ok = results.flatMap((x) => (x.r.kind === 'ok' ? [{ id: x.id, title: x.r.data.title }] : []))
        setDashes(ok)
        setSelected((s) => s || ok[0]?.id || '')
      },
    )
    return () => {
      cancelled = true
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  if (dashes === null) return <div className="center muted">กำลังโหลด...</div>
  if (dashes.length === 0) return <div className="center muted">ไม่มีแดชบอร์ดที่เข้าถึงได้</div>

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      {dashes.length > 1 && (
        <div style={{ display: 'flex', gap: 6, padding: 8, overflowX: 'auto' }}>
          {dashes.map((d) => (
            <button
              key={d.id}
              onClick={() => setSelected(d.id)}
              style={{
                padding: '6px 12px',
                borderRadius: 16,
                border: '1px solid var(--border)',
                background: d.id === selected ? 'var(--accent)' : 'transparent',
                color: d.id === selected ? '#fff' : 'inherit',
                whiteSpace: 'nowrap',
              }}
            >
              {d.title}
            </button>
          ))}
        </div>
      )}
      <iframe
        key={selected}
        title={dashes.find((d) => d.id === selected)?.title}
        // Singular /dashboard/ is ThingsBoard's chrome-less route: no app header or side
        // menu, so users cannot navigate out to the rest of the ThingsBoard UI.
        src={`/dashboard/${selected}`}
        style={{ flex: 1, width: '100%', minHeight: 0, border: 0 }}
      />
    </div>
  )
}
