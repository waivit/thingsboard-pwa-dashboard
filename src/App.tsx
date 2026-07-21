import { BrowserRouter, Navigate, Route, Routes, useNavigate } from 'react-router-dom'
import { AuthProvider, useAuth } from './auth/AuthContext'
import { SettingsProvider, useSettings } from './settings/SettingsContext'
import { listAlarms } from './api/tb'
import { usePoll } from './hooks/usePoll'
import { LoginPage } from './pages/LoginPage'
import { DevicesPage } from './pages/DevicesPage'
import { DeviceDetailPage } from './pages/DeviceDetailPage'
import { AlarmsPage } from './pages/AlarmsPage'
import { HistoryPage } from './pages/HistoryPage'
import { SettingsPage } from './pages/SettingsPage'
import { BottomNav } from './components/BottomNav'
import './styles.css'

// The signed-in shell: routed tab content + a persistent bottom nav. Alarms are polled
// here (not inside the Alarms tab) so the tab badge stays live on every screen.
function AppShell() {
  const { apiCtx, signOut } = useAuth()
  const { pollMs } = useSettings()
  const nav = useNavigate()
  const onAuthError = () => {
    signOut()
    nav('/login')
  }

  const alarms = usePoll(() => listAlarms(apiCtx), pollMs, onAuthError)
  const alarmList = alarms.data ?? []
  const alarmCount = alarms.status === 'ok' ? alarmList.length : 0

  return (
    <div className="app-shell">
      <div className="app-body">
        <Routes>
          <Route path="/devices" element={<DevicesPage ctx={apiCtx} onAuthError={onAuthError} />} />
          <Route path="/devices/:id" element={<DeviceDetailPage ctx={apiCtx} onAuthError={onAuthError} />} />
          <Route path="/alarms" element={<AlarmsPage status={alarms.status} alarms={alarmList} />} />
          <Route path="/history" element={<HistoryPage ctx={apiCtx} onAuthError={onAuthError} />} />
          <Route path="/settings" element={<SettingsPage />} />
          <Route path="*" element={<Navigate to="/devices" replace />} />
        </Routes>
      </div>
      <BottomNav alarmCount={alarmCount} />
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
        </SettingsProvider>
      </AuthProvider>
    </BrowserRouter>
  )
}