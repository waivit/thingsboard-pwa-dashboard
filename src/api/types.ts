// Shapes from the ThingsBoard REST API. Ported from the Expo app
// (apps/nonthaburi/src/api/types.ts) — plain data, no platform specifics.

export interface LoginResp {
  token: string
  refreshToken: string
}

export interface EntityId {
  entityType: string
  id: string
}

export interface Device {
  id: EntityId
  name: string
  type: string
  label?: string
}

export interface PageData<T> {
  data: T[]
  totalElements: number
  hasNext: boolean
}

export interface TsPoint {
  ts: number
  value: string
}
export type Timeseries = Record<string, TsPoint[]>

export interface LatestValue {
  key: string
  value: string
  ts: number
}

export interface TokenClaims {
  scopes?: string[]
  customerId?: string
  exp?: number
}

export type AlarmSeverity = 'CRITICAL' | 'MAJOR' | 'MINOR' | 'WARNING' | 'INDETERMINATE'

export interface AlarmInfo {
  id: EntityId
  createdTime: number
  startTs: number
  type: string
  originatorName: string
  severity: AlarmSeverity
  status: string
  acknowledged: boolean
  cleared: boolean
}

export interface HistoryPoint {
  ts: number
  value: number
}

export type ApiResult<T> =
  | { kind: 'ok'; data: T }
  | { kind: 'auth_error'; message: string }
  | { kind: 'error'; message: string }
