import type {
  AlarmInfo,
  ApiResult,
  Device,
  HistoryPoint,
  LatestValue,
  LoginResp,
  PageData,
  Timeseries,
  TokenClaims,
} from './types'

// Relative base: same-origin as nonthaburi.info in production, dev proxy in development.
const BASE = ''
const TIMEOUT_MS = 15_000

async function timedFetch(url: string, init: RequestInit): Promise<Response> {
  const controller = new AbortController()
  const timer = setTimeout(() => controller.abort(), TIMEOUT_MS)
  try {
    return await fetch(url, { ...init, signal: controller.signal })
  } finally {
    clearTimeout(timer)
  }
}

export async function login(username: string, password: string): Promise<ApiResult<LoginResp>> {
  try {
    const res = await timedFetch(`${BASE}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username, password }),
    })
    if (res.status === 401) return { kind: 'auth_error', message: 'ชื่อผู้ใช้หรือรหัสผ่านไม่ถูกต้อง' }
    if (!res.ok) return { kind: 'error', message: `HTTP ${res.status}` }
    return { kind: 'ok', data: (await res.json()) as LoginResp }
  } catch (e) {
    return { kind: 'error', message: String(e) }
  }
}

export async function refresh(refreshToken: string): Promise<ApiResult<LoginResp>> {
  try {
    const res = await timedFetch(`${BASE}/api/auth/token`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ refreshToken }),
    })
    if (res.status === 401) return { kind: 'auth_error', message: 'session หมดอายุ' }
    if (!res.ok) return { kind: 'error', message: `HTTP ${res.status}` }
    return { kind: 'ok', data: (await res.json()) as LoginResp }
  } catch (e) {
    return { kind: 'error', message: String(e) }
  }
}

export function decodeClaims(token: string): TokenClaims {
  try {
    const payload = token.split('.')[1]
    const b64 = payload.replace(/-/g, '+').replace(/_/g, '/')
    return JSON.parse(atob(b64)) as TokenClaims
  } catch {
    return {}
  }
}

// Auth context passed to authed calls so they can refresh + retry once on 401.
export interface AuthCtx {
  getToken: () => string
  getRefreshToken: () => string
  onRefreshed: (resp: LoginResp) => void
}

async function authGet<T>(ctx: AuthCtx, path: string): Promise<ApiResult<T>> {
  const call = (token: string) =>
    timedFetch(`${BASE}${path}`, { headers: { 'X-Authorization': `Bearer ${token}` } })
  try {
    let res = await call(ctx.getToken())
    if (res.status === 401) {
      const r = await refresh(ctx.getRefreshToken())
      if (r.kind !== 'ok') return { kind: 'auth_error', message: 'ต้องเข้าสู่ระบบใหม่' }
      ctx.onRefreshed(r.data)
      res = await call(r.data.token)
      if (res.status === 401) return { kind: 'auth_error', message: 'ต้องเข้าสู่ระบบใหม่' }
    }
    if (!res.ok) return { kind: 'error', message: `HTTP ${res.status}` }
    return { kind: 'ok', data: (await res.json()) as T }
  } catch (e) {
    return { kind: 'error', message: String(e) }
  }
}

export interface UsageEvent {
  ts: number
  event: string
  page: string
  deviceId: string
  user: string
  ip: string
  ua: string
}

const USAGE_KEYS = ['event', 'page', 'deviceId', 'user', 'ip', 'ua'] as const

// Raw usage events of the "PWA Usage" device, newest first. Each event is stored as
// one telemetry row per key sharing a timestamp, so the keys are joined back on ts.
export async function usageEvents(
  ctx: AuthCtx,
  deviceId: string,
  startTs: number,
  endTs: number,
): Promise<ApiResult<UsageEvent[]>> {
  const q = new URLSearchParams({
    keys: USAGE_KEYS.join(','),
    startTs: String(startTs),
    endTs: String(endTs),
    limit: '10000',
    orderBy: 'DESC',
  })
  const res = await authGet<Record<string, { ts: number; value: string }[]>>(
    ctx,
    `/api/plugins/telemetry/DEVICE/${deviceId}/values/timeseries?${q}`,
  )
  if (res.kind !== 'ok') return res
  const byTs = new Map<number, UsageEvent>()
  for (const key of USAGE_KEYS) {
    for (const { ts, value } of res.data[key] ?? []) {
      let e = byTs.get(ts)
      if (!e) {
        e = { ts, event: '', page: '', deviceId: '', user: '', ip: '', ua: '' }
        byTs.set(ts, e)
      }
      e[key] = String(value)
    }
  }
  return { kind: 'ok', data: [...byTs.values()].sort((a, b) => b.ts - a.ts) }
}

// Resolves the title and doubles as an access check: a 403/404 means this user cannot open it.
export async function getDashboardInfo(ctx: AuthCtx, id: string): Promise<ApiResult<{ title: string }>> {
  return authGet<{ title: string }>(ctx, `/api/dashboard/info/${id}`)
}

// Same refresh-and-retry-once contract as authGet, for endpoints that act rather than
// read: ThingsBoard answers these with 200 and an empty body, so nothing is parsed.
async function authPostVoid(ctx: AuthCtx, path: string): Promise<ApiResult<void>> {
  const call = (token: string) =>
    timedFetch(`${BASE}${path}`, { method: 'POST', headers: { 'X-Authorization': `Bearer ${token}` } })
  try {
    let res = await call(ctx.getToken())
    if (res.status === 401) {
      const r = await refresh(ctx.getRefreshToken())
      if (r.kind !== 'ok') return { kind: 'auth_error', message: 'ต้องเข้าสู่ระบบใหม่' }
      ctx.onRefreshed(r.data)
      res = await call(r.data.token)
      if (res.status === 401) return { kind: 'auth_error', message: 'ต้องเข้าสู่ระบบใหม่' }
    }
    // Not an auth_error: the session is fine, this user just may not write alarms.
    // Signing them out over it would be wrong.
    if (res.status === 403) return { kind: 'error', message: 'ไม่มีสิทธิ์รับทราบการแจ้งเตือน' }
    if (!res.ok) return { kind: 'error', message: `HTTP ${res.status}` }
    return { kind: 'ok', data: undefined }
  } catch (e) {
    return { kind: 'error', message: String(e) }
  }
}

export async function ackAlarm(ctx: AuthCtx, alarmId: string): Promise<ApiResult<void>> {
  return authPostVoid(ctx, `/api/alarm/${alarmId}/ack`)
}

export async function listDevices(ctx: AuthCtx): Promise<ApiResult<Device[]>> {
  const claims = decodeClaims(ctx.getToken())
  const isTenant = claims.scopes?.includes('TENANT_ADMIN')
  const path = isTenant
    ? `/api/tenant/devices?pageSize=200&page=0`
    : `/api/customer/${claims.customerId}/devices?pageSize=200&page=0`
  const res = await authGet<PageData<Device>>(ctx, path)
  if (res.kind !== 'ok') return res
  return { kind: 'ok', data: res.data.data }
}

export async function latestTelemetry(ctx: AuthCtx, deviceId: string): Promise<ApiResult<LatestValue[]>> {
  const res = await authGet<Timeseries>(ctx, `/api/plugins/telemetry/DEVICE/${deviceId}/values/timeseries`)
  if (res.kind !== 'ok') return res
  const flat: LatestValue[] = Object.entries(res.data)
    .map(([key, points]) => ({ key, value: points[0]?.value ?? '', ts: points[0]?.ts ?? 0 }))
    .sort((a, b) => a.key.localeCompare(b.key))
  return { kind: 'ok', data: flat }
}

export async function timeseriesKeys(ctx: AuthCtx, deviceId: string): Promise<ApiResult<string[]>> {
  return authGet<string[]>(ctx, `/api/plugins/telemetry/DEVICE/${deviceId}/keys/timeseries`)
}

export async function historyTelemetry(
  ctx: AuthCtx,
  deviceId: string,
  key: string,
  startTs: number,
  endTs: number,
  limit = 500,
): Promise<ApiResult<HistoryPoint[]>> {
  const q = `keys=${encodeURIComponent(key)}&startTs=${startTs}&endTs=${endTs}&limit=${limit}&orderBy=ASC&agg=NONE`
  const res = await authGet<Timeseries>(ctx, `/api/plugins/telemetry/DEVICE/${deviceId}/values/timeseries?${q}`)
  if (res.kind !== 'ok') return res
  const raw = res.data[key] ?? []
  const points: HistoryPoint[] = []
  for (const p of raw) {
    const n = Number(p.value)
    if (Number.isFinite(n)) points.push({ ts: p.ts, value: n })
  }
  return { kind: 'ok', data: points }
}

export async function listAlarms(ctx: AuthCtx): Promise<ApiResult<AlarmInfo[]>> {
  const res = await authGet<PageData<AlarmInfo>>(
    ctx,
    `/api/v2/alarms?pageSize=100&page=0&sortProperty=createdTime&sortOrder=DESC&searchStatus=ACTIVE`,
  )
  if (res.kind !== 'ok') return res
  return { kind: 'ok', data: res.data.data }
}
