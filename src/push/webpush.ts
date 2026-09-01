// Web Push subscription client. Talks to the pushbridge backend, which is routed
// same-origin under /pwa_push (Kong → the Python service). The backend owns the VAPID
// keypair; we fetch its public key at runtime so no rebuild is needed when keys change.
//
// The path is /pwa_push even though the service is named pushbridge — the two were
// renamed apart. Kong's route is paths=['/pwa_push'] with strip_path=true, so it removes
// exactly that prefix and the backend sees its root endpoints (/vapid-public-key,
// /register, /unregister, /health). Renaming this constant alone silently breaks push:
// a longer prefix starting with /pwa_push still matches Kong's route, so the request is
// forwarded with only /pwa_push stripped and the backend 404s on the leftover. Change
// the Kong route in the same breath, or not at all.
const PUSH_API = '/pwa_push'

export function pushSupported(): boolean {
  return 'serviceWorker' in navigator && 'PushManager' in window && 'Notification' in window
}

export async function currentSubscription(): Promise<PushSubscription | null> {
  if (!pushSupported()) return null
  const reg = await navigator.serviceWorker.ready
  return reg.pushManager.getSubscription()
}

function urlBase64ToUint8Array(base64: string): Uint8Array {
  const padding = '='.repeat((4 - (base64.length % 4)) % 4)
  const b64 = (base64 + padding).replace(/-/g, '+').replace(/_/g, '/')
  const raw = atob(b64)
  const out = new Uint8Array(raw.length)
  for (let i = 0; i < raw.length; i++) out[i] = raw.charCodeAt(i)
  return out
}

// Returns null on success, or a Thai error message.
export async function enablePush(): Promise<string | null> {
  if (!pushSupported()) return 'อุปกรณ์/เบราว์เซอร์นี้ไม่รองรับการแจ้งเตือน'
  if (!window.isSecureContext) return 'ต้องเปิดผ่าน HTTPS (ติดตั้ง PWA) ก่อน'

  const perm = await Notification.requestPermission()
  if (perm !== 'granted') return 'ไม่ได้รับอนุญาตให้แจ้งเตือน'

  let key: string
  try {
    const res = await fetch(`${PUSH_API}/vapid-public-key`)
    if (!res.ok) return 'ติดต่อ push server ไม่ได้'
    key = (await res.text()).trim()
  } catch {
    return 'ติดต่อ push server ไม่ได้'
  }

  const reg = await navigator.serviceWorker.ready
  let sub: PushSubscription
  try {
    sub = await reg.pushManager.subscribe({
      userVisibleOnly: true,
      applicationServerKey: urlBase64ToUint8Array(key) as BufferSource,
    })
  } catch (e) {
    return `สมัครรับแจ้งเตือนไม่สำเร็จ: ${String(e)}`
  }

  try {
    const res = await fetch(`${PUSH_API}/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(sub.toJSON()),
    })
    if (!res.ok) return 'ลงทะเบียนกับ server ไม่สำเร็จ'
  } catch {
    return 'ลงทะเบียนกับ server ไม่สำเร็จ'
  }
  return null
}

export async function disablePush(): Promise<void> {
  const sub = await currentSubscription()
  if (!sub) return
  try {
    await fetch(`${PUSH_API}/unregister`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ endpoint: sub.endpoint }),
    })
  } catch {
    // best-effort; unsubscribe locally regardless
  }
  await sub.unsubscribe()
}