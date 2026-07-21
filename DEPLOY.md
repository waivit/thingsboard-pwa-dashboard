# Deploy — dashboard-pwa

Static PWA served **same-origin** as ThingsBoard at `nonthaburi.info/pwa_app` (its own
Kong service on port 7081). Same-origin means the app's `/api/...` calls hit the existing
ThingsBoard route directly — **no CORS**.

## 1. Build & serve (Docker)
The host runs everything in Docker — no Node/npm needed on the host at all. A
multi-stage [Dockerfile](Dockerfile) builds the app (`node:24-alpine`) and copies the
output into an `nginx:alpine` image with an **SPA fallback** config (unknown paths →
`index.html`, required for client-side routing). See [nginx.pwa.conf](nginx.pwa.conf) and
[docker-compose.pwa.yml](docker-compose.pwa.yml).

```bash
docker compose -f docker-compose.pwa.yml up -d --build
```

This builds the image fresh each deploy and (re)starts the `pwa-app` container on
`:7081` — `deploy.sh` does exactly this after `git pull`.

## 2. Kong route
```bash
# Kong Admin API — check the actual mapped host port with `docker ps` (this host
# publishes it as 32768, not the default 8001).
ADMIN=http://localhost:32768

# service → the static server above
curl -s -X POST $ADMIN/services \
  -d name=pwa-app -d url=http://127.0.0.1:7081

# route: nonthaburi.info/pwa_app → pwa-app  (DO NOT strip — the app expects /pwa_app/*)
curl -s -X POST $ADMIN/services/pwa-app/routes \
  -d 'paths[]=/pwa_app' -d strip_path=false -d 'hosts[]=nonthaburi.info'
```

> `strip_path=false` here (unlike the alarm-push route): the built assets reference
> `/pwa_app/assets/...`, so Kong must forward the prefix. The static server's `root`
> serves those because `dist` was built with `base: /pwa_app/`.

## 3. Verify
- Open `https://nonthaburi.info/pwa_app` on a phone → login works (same-origin API).
- Browser install prompt appears (HTTPS + manifest + SW) → **Add to Home Screen**.
- Settings → toggle **แจ้งเตือน (push)** on → allow → it registers with alarm-push.
- Trigger a new alarm in ThingsBoard → push arrives even with the PWA closed
  (Android always; iOS 16.4+ only when installed to the home screen).

## Notes
- HTTPS is mandatory for the service worker + Web Push. `nonthaburi.info` already has TLS
  (Kong), so serving under it satisfies this — plain-IP/HTTP won't register the SW.
- The push backend (`../alarm-push`) must be deployed and routed at `/pwa_push` for the
  notification toggle to work.