import { useParams } from 'react-router-dom'
import { DASHBOARDS } from '../dashboards'

// One ThingsBoard dashboard, chosen by the /d/:id route.
export function DashboardPage() {
  const { id = '' } = useParams()
  const dash = DASHBOARDS.find((d) => d.id === id)
  if (!dash) return <div className="center muted">ไม่พบหน้านี้</div>

  return (
    <iframe
      key={dash.id}
      title={dash.label}
      // Singular /dashboard/ is ThingsBoard's chrome-less route: no app header or side
      // menu, so users cannot navigate out to the rest of the ThingsBoard UI.
      src={`/dashboard/${dash.id}`}
      style={{ display: 'block', width: '100%', height: '100%', border: 0 }}
    />
  )
}
