import { useState } from 'react'
import { useUpdatePrompt } from '../pwa/useUpdatePrompt'
import './UpdateToast.css'

// If the new worker has not taken over and reloaded the page by then, reload anyway so
// nobody is left stuck behind this screen.
const RELOAD_FALLBACK_MS = 5000

/**
 * Registers the service worker and, once a new build has fully installed, blocks the
 * app until the user applies it. Deliberately not auto-applied: the user taps, so the
 * screen never reloads under them unannounced. Rendered once at the app root so it also
 * covers the login screen.
 */
export function UpdateToast() {
  const { needRefresh, update } = useUpdatePrompt()
  const [busy, setBusy] = useState(false)
  if (!needRefresh) return null

  const onUpdate = () => {
    setBusy(true)
    update()
    setTimeout(() => window.location.reload(), RELOAD_FALLBACK_MS)
  }

  return (
    <div className="update-gate" role="alertdialog" aria-modal="true" aria-labelledby="ug-title">
      <div className="ug-card">
        <div className="ug-icon">⬆️</div>
        <h2 id="ug-title" className="ug-title">
          มีเวอร์ชันใหม่
        </h2>
        <p className="ug-text">กรุณาอัปเดตเพื่อใช้งานต่อ</p>
        <button className="ug-update" onClick={onUpdate} disabled={busy}>
          {busy ? 'กำลังอัปเดต...' : 'อัปเดตตอนนี้'}
        </button>
      </div>
    </div>
  )
}
