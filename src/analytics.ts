// Usage tracking: app opens and page views go to the push backend (/pwa_push/track),
// which stores them on the ThingsBoard "PWA Usage" device. Best effort — failures are
// ignored so tracking can never break the app.
const TRACK_URL = '/pwa_push/track'
const DEVICE_KEY = 'usage_device_id'

// A random per-install id. Browsers expose no MAC or hardware id, so this is what tells
// devices apart while everyone shares one ThingsBoard account.
function deviceId(): string {
  try {
    let id = localStorage.getItem(DEVICE_KEY)
    if (!id) {
      id = crypto.randomUUID()
      localStorage.setItem(DEVICE_KEY, id)
    }
    return id
  } catch {
    return 'unknown'
  }
}

export function track(token: string, event: string, page: string): void {
  if (!token) return
  // keepalive lets the request finish even if the page is closing; unlike sendBeacon
  // it can carry the auth header.
  void fetch(TRACK_URL, {
    method: 'POST',
    keepalive: true,
    headers: { 'Content-Type': 'application/json', 'X-Authorization': `Bearer ${token}` },
    body: JSON.stringify({ event, page, deviceId: deviceId() }),
  }).catch(() => {})
}
