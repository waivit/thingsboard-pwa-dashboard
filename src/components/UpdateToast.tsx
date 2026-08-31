import { useUpdatePrompt } from '../pwa/useUpdatePrompt'
import './UpdateToast.css'

/**
 * Registers the service worker and offers the new build when one is waiting.
 * Rendered once at the app root so it shows on the login screen too.
 */
export function UpdateToast() {
  const { needRefresh, update, dismiss } = useUpdatePrompt()
  if (!needRefresh) return null

  return (
    <div className="update-toast" role="status">
      <span className="ut-text">มีเวอร์ชันใหม่</span>
      <button className="ut-update" onClick={update}>
        อัปเดต
      </button>
      <button className="ut-close" onClick={dismiss} aria-label="ปิด">
        ✕
      </button>
    </div>
  )
}
