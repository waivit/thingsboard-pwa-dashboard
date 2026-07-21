import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// The app calls the ThingsBoard REST API with relative paths (/api/...). In production
// the PWA is served same-origin as nonthaburi.info, so those resolve directly with no
// CORS. In dev, this proxy forwards /api to nonthaburi.info so the browser stays same-
// origin against the Vite dev server.
export default defineConfig({
  plugins: [react()],
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
