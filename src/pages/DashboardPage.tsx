import { useParams } from 'react-router-dom'
import { DASHBOARDS, REPORT_DASHBOARD_ID } from '../dashboards'

function TbDashboard({ id, title }: { id: string; title: string }) {
  return (
    <iframe
      key={id}
      title={title}
      // Singular /dashboard/ is ThingsBoard's chrome-less route: no app header or side
      // menu, so users cannot navigate out to the rest of the ThingsBoard UI.
      src={`/dashboard/${id}`}
      style={{ display: 'block', width: '100%', height: '100%', border: 0 }}
    />
  )
}

// One ThingsBoard dashboard, chosen by the /d/:id route.
export function DashboardPage() {
  const { id = '' } = useParams()
  const dash = DASHBOARDS.find((d) => d.id === id)
  if (!dash) return <div className="center muted">ไม่พบหน้านี้</div>
  return <TbDashboard id={dash.id} title={dash.label} />
}

export function ReportPage() {
  return <TbDashboard id={REPORT_DASHBOARD_ID} title="รายงานการใช้งาน" />
}
