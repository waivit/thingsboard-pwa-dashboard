# ThingsBoard PWA Dashboard

A mobile-first Progressive Web App for monitoring IoT devices through a
[ThingsBoard](https://thingsboard.io/) backend — built to be installed on a phone's home
screen and to keep working like a native app: offline shell, background push
notifications, and no browser chrome.

Built solo end-to-end: authentication, data layer, UI, offline/service-worker plumbing,
push notifications, and the deploy pipeline.

## What it does

- **Sign in** with ThingsBoard credentials (JWT-based auth, token refresh handled
  transparently).
- **Browse devices** with live status at a glance.
- **Drill into a device** to see recent telemetry, plotted on a history chart.
- **Review alarms** raised by the ThingsBoard rule engine.
- **Get push notifications** for new alarms — delivered by the browser/OS even when the
  app is closed, via a companion Web Push service.
- **Install to the home screen** (Add to Home Screen) and use it like a native app,
  including basic offline shell caching.

## Why it's worth a look

This isn't a CRUD scaffold — it's a small, complete demonstration of the harder parts of
building a real PWA:

- **Custom service worker** (`src/sw.ts`), not just a generated one — Workbox precaching
  wired in by hand via `vite-plugin-pwa`'s `injectManifest` strategy, plus a Web Push
  event handler for background notifications.
- **Push notifications done properly**: subscription lifecycle, permission handling, and
  a same-origin backend contract (see `src/push/webpush.ts`), tested end-to-end against
  a real push service.
- **Same-origin architecture by design**: the app is deployed under the same domain and
  gateway as the ThingsBoard instance it talks to (`/api/...` relative paths), sidestepping
  CORS entirely instead of papering over it — see [DEPLOY.md](DEPLOY.md).
- **CI/CD included**: GitHub Actions builds and lints on every push/PR, and auto-deploys
  to the production host over SSH on merge to `master` (`.github/workflows/`,
  `deploy.sh`).
- Small, readable codebase: React 19 + TypeScript, no state-management library, no CSS
  framework — just enough structure to stay maintainable (`src/api`, `src/auth`,
  `src/pages`, `src/push`, `src/settings`).

## Tech stack

| Layer | Choice |
|---|---|
| UI | React 19, TypeScript, React Router 7 |
| Build | Vite 8, `vite-plugin-pwa` (`injectManifest`), Workbox |
| Backend | ThingsBoard REST API (external, not part of this repo) |
| Push | Web Push API + custom service worker |
| Lint | oxlint |
| CI/CD | GitHub Actions → SSH deploy to an nginx + Kong host |

## Getting started

```bash
npm ci
npm run dev       # http://localhost:5173, proxies /api to the ThingsBoard host
```

```bash
npm run lint      # oxlint
npm run build     # tsc -b && vite build -> dist/
npm run preview   # serve the production build locally
```

The app expects a ThingsBoard instance reachable at `/api/...` on the same origin (the
dev server proxies this for local development — see `vite.config.ts`). There is no
separate frontend config/env file: the base path (`/pwa_app/`) and API proxy target are
set directly in `vite.config.ts`.

## Deployment

See [DEPLOY.md](DEPLOY.md) for the full production setup (nginx, Kong routing, HTTPS/
service-worker requirements). In short: `npm run build` produces a static `dist/` that
is served same-origin with ThingsBoard so the app's API calls need no CORS handling.
Pushing to `master` triggers the GitHub Actions workflow in
[.github/workflows/deploy.yml](.github/workflows/deploy.yml), which builds and publishes
the app automatically.

## Project structure

```
src/
  api/        ThingsBoard REST client + types
  auth/       Auth context (login, token refresh)
  hooks/      Small reusable hooks (e.g. polling)
  components/ Shared UI (device card, bottom nav, chart)
  pages/      Route-level screens (devices, device detail, alarms, history, settings)
  push/       Web Push subscription logic
  settings/   User settings context
  sw.ts       Custom service worker (Workbox precache + push handler)
```
