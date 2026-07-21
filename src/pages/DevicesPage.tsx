import { useCallback, useEffect, useState } from 'react'
import { listDevices, type AuthCtx } from '../api/tb'
import type { Device } from '../api/types'
import { DeviceCard } from '../components/DeviceCard'

interface Props {
  ctx: AuthCtx
  onAuthError: () => void
}

type Load = { status: 'loading' | 'ok' | 'error'; devices: Device[]; message: string | null }

export function DevicesPage({ ctx, onAuthError }: Props) {
  const [load, setLoad] = useState<Load>({ status: 'loading', devices: [], message: null })

  const fetchDevices = useCallback(async () => {
    const res = await listDevices(ctx)
    if (res.kind === 'ok') {
      const devices = [...res.data].sort(
        (a, b) => a.type.localeCompare(b.type) || a.name.localeCompare(b.name),
      )
      setLoad({ status: 'ok', devices, message: null })
    } else if (res.kind === 'auth_error') {
      onAuthError()
    } else {
      setLoad((prev) => ({ ...prev, status: 'error', message: res.message }))
    }
  }, [ctx, onAuthError])

  useEffect(() => {
    void fetchDevices()
  }, [fetchDevices])

  return (
    <div className="page">
      <header className="page-head">
        <h1>อุปกรณ์</h1>
      </header>

      {load.status === 'loading' ? (
        <div className="center muted">กำลังโหลด...</div>
      ) : load.status === 'error' && load.devices.length === 0 ? (
        <div className="center">
          <div className="err-title">โหลดรายการอุปกรณ์ไม่ได้</div>
          <div className="muted">{load.message}</div>
          <button className="retry" onClick={() => void fetchDevices()}>
            ลองใหม่
          </button>
        </div>
      ) : load.devices.length === 0 ? (
        <div className="center muted">ไม่พบอุปกรณ์</div>
      ) : (
        <div className="cards">
          {load.devices.map((d) => (
            <DeviceCard key={d.id.id} ctx={ctx} device={d} onAuthError={onAuthError} />
          ))}
        </div>
      )}
    </div>
  )
}
