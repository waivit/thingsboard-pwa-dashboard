import { useEffect, useRef } from 'react'
import { BrowserRouter, Navigate, Route, Routes, useLocation, useNavigate } from 'react-router-dom'
import { AuthProvider, useAuth } from './auth/AuthContext'
import { SettingsProvider, useSettings } from './settings/SettingsContext'
import { decodeClaims, listAlarms } from './api/tb'
import { track } from './analytics'
import { usePoll } from './hooks/usePoll'
import { LoginPage } from './pages/LoginPage'
import { DevicesPage } from './pages/DevicesPage'
import { DeviceDetailPage } from './pages/DeviceDetailPage'
import { AlarmsPage } from './pages/AlarmsPage'
import { HistoryPage } from './pages/HistoryPage'
import { SettingsPage } from './pages/SettingsPage'
import { DashboardPage, ReportPage } from './pages/DashboardPage'
import { DASHBOARDS, REPORT_DASHBOARD_ID } from './dashboards'
import { BottomNav } from './components/BottomNav'
import { UpdateToast } from './components/UpdateToast'
import './styles.css'

// The signed-in shell: routed tab content + a persistent bottom nav. Alarms are polled
// here (not inside the Alarms tab) so the tab badge stays live on every screen.
function AppShell() {
  const { apiCtx, signOut, token } = useAuth()
  const { pollMs } = useSettings()
  const nav = useNavigate()
  const { pathname } = useLocation()
  // Visibility only; ThingsBoard keeps the report dashboard unassigned to customers.
  const showReport = !!REPORT_DASHBOARD_ID && (decodeClaims(token).scopes ?? []).includes('TENANT_ADMIN')

  // First page of this session counts as an app open; every later one as a page view.
  const opened = useRef(false)
  useEffect(() => {
    track(apiCtx.getToken(), opened.current ? 'view' : 'open_app', pathname)
    opened.current = true
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pathname])
  const onAuthError = () => {
    signOut()
    nav('/login')
  }

  const alarms = usePoll(() => listAlarms(apiCtx), pollMs, onAuthError)
  const alarmList = alarms.data ?? []
  // Only the unacknowledged ones are outstanding work, so the badge drops as they are
  // acknowledged. The list keeps showing both — searchStatus=ACTIVE spans ACK and UNACK.
  const alarmCount = alarms.status === 'ok' ? alarmList.filter((a) => !a.acknowledged).length : 0

  return (
    <div className="app-shell">
      <div className="app-body">
        <Routes>
          <Route path="/devices" element={<DevicesPage ctx={apiCtx} onAuthError={onAuthError} />} />
          <Route path="/devices/:id" element={<DeviceDetailPage ctx={apiCtx} onAuthError={onAuthError} />} />
          <Route
            path="/alarms"
            element={
              <AlarmsPage
                status={alarms.status}
                alarms={alarmList}
                ctx={apiCtx}
                onAcked={alarms.refetch}
                onAuthError={onAuthError}
              />
            }
          />
          <Route path="/history" element={<HistoryPage ctx={apiCtx} onAuthError={onAuthError} />} />
          <Route path="/settings" element={<SettingsPage />} />
          <Route path="/d/:id" element={<DashboardPage />} />
          {showReport && <Route path="/report" element={<ReportPage />} />}
          <Route path="*" element={<Navigate to={`/d/${DASHBOARDS[0].id}`} replace />} />
        </Routes>
      </div>
      <BottomNav alarmCount={alarmCount} showReport={showReport} />
    </div>
  )
}

function Root() {
  const { phase } = useAuth()
  if (phase === 'loading') return <div className="center muted">กำลังโหลด...</div>
  if (phase === 'signed_out') {
    return (
      <Routes>
        <Route path="/login" element={<LoginPage />} />
        <Route path="*" element={<Navigate to="/login" replace />} />
      </Routes>
    )
  }
  return <AppShell />
}

export default function App() {
  return (
    // Must match Vite `base` — the app is served under nonthaburi.info/pwa_app.
    // import.meta.env.BASE_URL is '/pwa_app/'; strip the trailing slash for basename.
    <BrowserRouter basename={import.meta.env.BASE_URL.replace(/\/$/, '')}>
      <AuthProvider>
        <SettingsProvider>
          <Root />
          {/* Outside Root so the update offer survives sign-in/sign-out. */}
          <UpdateToast />
        </SettingsProvider>
      </AuthProvider>
    </BrowserRouter>
  )
}