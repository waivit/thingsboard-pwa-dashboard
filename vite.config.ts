import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'

// The app calls the ThingsBoard REST API with relative paths (/api/...). In production
// the PWA is served same-origin as nonthaburi.info, so those resolve directly with no
// CORS. In dev, the proxy forwards /api to nonthaburi.info so dev stays same-origin.
// Served behind the Kong gateway at nonthaburi.info/pwa_app (its own service on :7081).
// Everything (assets, router, SW scope) lives under this base. The API stays a root-
// relative /api/... so it hits the existing ThingsBoard route on the same origin.
const BASE = '/pwa_app/'

export default defineConfig({
  base: BASE,
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['pwa-icon.svg', 'maskable-icon.svg'],
      manifest: {
        name: 'Nonthaburi IoT',
        short_name: 'Nonthaburi',
        description: 'แดชบอร์ด IoT / ThingsBoard',
        lang: 'th',
        theme_color: '#0b0f14',
        background_color: '#0b0f14',
        display: 'standalone',
        orientation: 'portrait',
        id: BASE,
        scope: BASE,
        start_url: BASE,
        icons: [
          { src: 'pwa-icon.svg', sizes: 'any', type: 'image/svg+xml', purpose: 'any' },
          { src: 'maskable-icon.svg', sizes: 'any', type: 'image/svg+xml', purpose: 'maskable' },
        ],
      },
      workbox: {
        // Precache the app shell (built JS/CSS/HTML). Never cache the API — telemetry and
        // alarms must always hit the network.
        navigateFallback: `${BASE}index.html`,
        navigateFallbackDenylist: [/^\/api/],
        runtimeCaching: [
          {
            urlPattern: /^\/api\//,
            handler: 'NetworkOnly',
          },
        ],
      },
      devOptions: {
        // Enable the service worker in dev so W3/W4 are testable on localhost.
        enabled: true,
      },
    }),
  ],
  server: {
    proxy: {
      '/api': {
        target: 'https://nonthaburi.info',
        changeOrigin: true,
        secure: true,
      },
    },
  },
})