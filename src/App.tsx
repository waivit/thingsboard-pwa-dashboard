import { BrowserRouter, Navigate, Route, Routes, useNavigate } from 'react-router-dom'
import { AuthProvider, useAuth } from './auth/AuthContext'
import { SettingsProvider } from './settings/SettingsContext'
import { LoginPage } from './pages/LoginPage'
import { DevicesPage } from './pages/DevicesPage'
import { BottomNav } from './components/BottomNav'
import './styles.css'

function Placeholder({ title }: { title: string }) {
  return (
    <div className="page">
      <header className="page-head">
        <h1>{title}</h1>
      </header>
      <div className="center muted">กำลังจะมา (W2)</div>
    </div>
  )
}

// The signed-in shell: routed tab content + a persistent bottom nav.
function AppShell() {
  const { apiCtx, signOut } = useAuth()
  const nav = useNavigate()
  const onAuthError = () => {
    signOut()
    nav('/login')
  }

  return (
    <div className="app-shell">
      <div className="app-body">
        <Routes>
          <Route path="/devices" element={<DevicesPage ctx={apiCtx} onAuthError={onAuthError} />} />
          <Route path="/alarms" element={<Placeholder title="แจ้งเตือน" />} />
          <Route path="/history" element={<Placeholder title="กราฟย้อนหลัง" />} />
          <Route path="/settings" element={<Placeholder title="ตั้งค่า" />} />
          <Route path="*" element={<Navigate to="/devices" replace />} />
        </Routes>
      </div>
      <BottomNav />
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
    <BrowserRouter>
      <AuthProvider>
        <SettingsProvider>
          <Root />
        </SettingsProvider>
      </AuthProvider>
    </BrowserRouter>
  )
}