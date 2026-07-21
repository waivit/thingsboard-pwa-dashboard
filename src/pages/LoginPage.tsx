import { useState, type FormEvent } from 'react'
import { useAuth } from '../auth/AuthContext'
import './LoginPage.css'

export function LoginPage() {
  const { signIn } = useAuth()
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const onSubmit = async (e: FormEvent) => {
    e.preventDefault()
    if (busy) return
    setError(null)
    setBusy(true)
    const err = await signIn(username.trim(), password)
    setBusy(false)
    if (err) setError(err)
    // on success, AuthProvider flips phase → router shows the app
  }

  return (
    <div className="login">
      <form className="login-card" onSubmit={onSubmit}>
        <h1>Nonthaburi IoT</h1>
        <p className="sub">เข้าสู่ระบบ ThingsBoard</p>

        <label>ชื่อผู้ใช้</label>
        <input
          value={username}
          onChange={(e) => setUsername(e.target.value)}
          autoComplete="username"
          autoCapitalize="none"
          type="email"
          placeholder="user@example.com"
        />

        <label>รหัสผ่าน</label>
        <input
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          autoComplete="current-password"
          type="password"
        />

        {error && <div className="error">{error}</div>}

        <button className="submit" type="submit" disabled={busy}>
          {busy ? 'กำลังเข้าสู่ระบบ...' : 'เข้าสู่ระบบ'}
        </button>
      </form>
    </div>
  )
}
