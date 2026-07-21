# Deploy — dashboard-pwa

Static PWA served **same-origin** as ThingsBoard at `nonthaburi.info/pwa_app` (its own
Kong service). Same-origin means the app's `/api/...` calls hit the existing ThingsBoard
route directly — **no CORS**. The container is **not published to the host** — Kong reaches
it over the internal Docker network (`kongapi_default`), so nothing is exposed outside Kong.

## 1. Build & serve (Docker)
The host runs everything in Docker — no Node/npm needed on the host at all. A
multi-stage [Dockerfile](Dockerfile) builds the app (`node:24-alpine`) and copies the
output into an `nginx:alpine` image **under `/pwa_app/`** so the on-disk paths match the
URL paths exactly (files live at `.../html/pwa_app/...`, same as the `/pwa_app/` base the
app is built with). nginx adds an **SPA fallback** (unknown `/pwa_app/*` → `/pwa_app/
index.html`) plus cache headers. See [nginx.pwa.conf](nginx.pwa.conf) and
[docker-compose.pwa.yml](docker-compose.pwa.yml).

```bash
docker compose -f docker-compose.pwa.yml up -d --build
```

This builds the image fresh each deploy and (re)starts the `pwa-app` container, joined to
Kong's `kongapi_default` network with no host port published — `deploy.sh` does exactly
this after `git pull`.

## 2. Kong route
```bash
# Kong Admin API — check the actual mapped host port with `docker ps` (this host
# publishes it as 32768, not the default 8001).
ADMIN=http://localhost:32768

# service → the pwa-app container, reached by name over the kongapi_default network
# (port 80 = nginx inside the container; the container publishes no host port)
curl -s -X POST $ADMIN/services \
  -d name=pwa-app -d url=http://pwa-app:80

# route: nonthaburi.info/pwa_app → pwa-app  (DO NOT strip — the app expects /pwa_app/*)
curl -s -X POST $ADMIN/services/pwa-app/routes \
  -d 'paths[]=/pwa_app' -d strip_path=false -d 'hosts[]=nonthaburi.info'
```

> `strip_path=false` here (unlike the alarm-push route): the built assets reference
> `/pwa_app/assets/...`, so Kong forwards the full prefix and nginx serves the matching
> files under `.../html/pwa_app/`. Because the paths line up at every layer, the app also
> works when hit directly (e.g. `http://<host>:7081/pwa_app/`), not only through Kong.

> **CDN note:** `nonthaburi.info` sits behind Cloudflare. After a deploy, Cloudflare may
> keep serving a stale copy of the app shell / `registerSW.js` (symptom: white page,
> `registerSW.js` returns HTML). The `no-cache` headers above tell it not to pin those,
> but an already-cached entry must be **purged in Cloudflare** to take effect immediately.

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