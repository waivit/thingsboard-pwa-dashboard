/// <reference lib="webworker" />
import { precacheAndRoute, createHandlerBoundToURL } from 'workbox-precaching'
import { NavigationRoute, registerRoute } from 'workbox-routing'

declare const self: ServiceWorkerGlobalScope

// Precache the app shell (JS/CSS/HTML/icons). __WB_MANIFEST is injected at build time.
precacheAndRoute(self.__WB_MANIFEST)

// SPA offline fallback for navigations under the app scope, but never for the API.
const handler = createHandlerBoundToURL(`${import.meta.env.BASE_URL}index.html`)
registerRoute(new NavigationRoute(handler, { denylist: [/^\/api/] }))

// Apply updates immediately (paired with registerType 'autoUpdate').
self.addEventListener('install', () => {
  void self.skipWaiting()
})
self.addEventListener('activate', (event) => {
  event.waitUntil(self.clients.claim())
})

// --- Web Push ---
// The backend (pushbridge) sends JSON: { title, body, url, tag }.
interface PushPayload {
  title?: string
  body?: string
  url?: string
  tag?: string
}

self.addEventListener('push', (event) => {
  let data: PushPayload = {}
  try {
    data = event.data?.json() ?? {}
  } catch {
    data = { body: event.data?.text() }
  }
  const title = data.title || 'แจ้งเตือน'
  const url = data.url || `${import.meta.env.BASE_URL}alarms`
  event.waitUntil(
    self.registration.showNotification(title, {
      body: data.body || '',
      icon: `${import.meta.env.BASE_URL}pwa-icon.svg`,
      badge: `${import.meta.env.BASE_URL}pwa-icon.svg`,
      tag: data.tag,
      data: url,
    }),
  )
})

self.addEventListener('notificationclick', (event) => {
  event.notification.close()
  const url = (event.notification.data as string) || import.meta.env.BASE_URL
  event.waitUntil(
    self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then((cs) => {
      for (const c of cs) {
        if ('focus' in c) {
          void c.focus()
          return
        }
      }
      return self.clients.openWindow(url).then(() => undefined)
    }),
  )
})