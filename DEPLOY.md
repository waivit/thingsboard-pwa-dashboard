# Deploy — dashboard-pwa

Static PWA served **same-origin** as ThingsBoard at `nonthaburi.info/pwa_app` (its own
Kong service on port 7081). Same-origin means the app's `/api/...` calls hit the existing
ThingsBoard route directly — **no CORS**.

## 1. Build
```bash
npm ci
npm run build          # → dist/  (base path is already /pwa_app/)
```

## 2. Serve dist/ on :7081
Any static server works; the one requirement is an **SPA fallback** (unknown paths →
`index.html`) because the app uses client-side routing. Example nginx serving on 7081:

```nginx
server {
    listen 7081;
    root /var/www/pwa_app;          # copy dist/* here
    location / {
        try_files $uri $uri/ /index.html;
    }
}
```
```bash
sudo mkdir -p /var/www/pwa_app
sudo cp -r dist/* /var/www/pwa_app/
```

## 3. Kong route
```bash
# service → the static server above
curl -s -X POST http://localhost:8001/services \
  -d name=pwa-app -d url=http://127.0.0.1:7081

# route: nonthaburi.info/pwa_app → pwa-app  (DO NOT strip — the app expects /pwa_app/*)
curl -s -X POST http://localhost:8001/services/pwa-app/routes \
  -d 'paths[]=/pwa_app' -d strip_path=false -d 'hosts[]=nonthaburi.info'
```

> `strip_path=false` here (unlike the alarm-push route): the built assets reference
> `/pwa_app/assets/...`, so Kong must forward the prefix. The static server's `root`
> serves those because `dist` was built with `base: /pwa_app/`.

## 4. Verify
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