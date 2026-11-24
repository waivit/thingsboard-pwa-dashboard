import { useEffect, useState } from 'react'
import { enablePush, pushStatus } from '../push/webpush'
import { Icon } from './Icon'
import './PushPrompt.css'

type Step = 'hidden' | 'ask' | 'busy' | 'done' | 'denied' | 'install' | 'error'

/**
 * Asks for push on every app open and every return to the app, until this device is
 * subscribed. The enable button subscribes right here: the OS permission prompt needs
 * a user tap, which this button provides. A blocked permission cannot be re-asked by
 * the app, and iOS has no push outside an installed home-screen app, so those two
 * cases explain what to do instead.
 *
 * `checkKey` changes whenever App sees the app open or come back to the foreground.
 */
export function PushPrompt({ checkKey }: { checkKey: number }) {
  const [step, setStep] = useState<Step>('hidden')
  const [error, setError] = useState('')

  useEffect(() => {
    let cancelled = false
    void pushStatus().then((s) => {
      if (cancelled) return
      if (s === 'off') setStep('ask')
      else if (s === 'denied') setStep('denied')
      else if (s === 'install') setStep('install')
      else setStep('hidden')
    })
    return () => {
      cancelled = true
    }
  }, [checkKey])

  if (step === 'hidden') return null
  const close = () => setStep('hidden')

  const onEnable = async () => {
    setStep('busy')
    const err = await enablePush()
    if (!err) return setStep('done')
    if ('Notification' in window && Notification.permission === 'denied') return setStep('denied')
    setError(err)
    setStep('error')
  }

  return (
    <div className="pp-backdrop" role="dialog" aria-modal="true" aria-labelledby="pp-title">
      <div className="pp-card">
        {(step === 'ask' || step === 'busy') && (
          <>
            <div className="pp-badge">
              <Icon name="bell" size={32} />
            </div>
            <h2 id="pp-title" className="pp-title">
              เปิดรับการแจ้งเตือน
            </h2>
            <p className="pp-text">รับแจ้งเตือนทันทีเมื่อมี alarm จากอุปกรณ์ แม้ไม่ได้เปิดแอปอยู่</p>
            <button className="pp-primary" onClick={() => void onEnable()} disabled={step === 'busy'}>
              {step === 'busy' ? 'กำลังเปิด...' : 'เปิดแจ้งเตือน'}
            </button>
            <button className="pp-secondary" onClick={close} disabled={step === 'busy'}>
              ไว้ทีหลัง
            </button>
          </>
        )}

        {step === 'done' && (
          <>
            <div className="pp-badge pp-ok">
              <Icon name="check" size={32} />
            </div>
            <h2 id="pp-title" className="pp-title">
              เปิดแจ้งเตือนแล้ว
            </h2>
            <p className="pp-text">เมื่อมี alarm คุณจะได้รับแจ้งเตือนทันที</p>
            <button className="pp-primary" onClick={close}>
              ตกลง
            </button>
          </>
        )}

        {step === 'denied' && (
          <>
            <div className="pp-badge pp-warn">
              <Icon name="bellOff" size={32} />
            </div>
            <h2 id="pp-title" className="pp-title">
              การแจ้งเตือนถูกปิดอยู่
            </h2>
            <p className="pp-text">
              มือถือไม่ให้แอปขอซ้ำ เปิดได้ที่
              <br />
              <strong>ตั้งค่ามือถือ → แอป Nonthaburi → การแจ้งเตือน</strong>
            </p>
            <button className="pp-primary" onClick={close}>
              ตกลง
            </button>
          </>
        )}

        {step === 'install' && (
          <>
            <div className="pp-badge">
              <Icon name="install" size={32} />
            </div>
            <h2 id="pp-title" className="pp-title">
              ติดตั้งแอปก่อนเพื่อรับแจ้งเตือน
            </h2>
            <p className="pp-text">iPhone ส่งแจ้งเตือนได้เฉพาะแอปที่อยู่บนหน้าจอโฮม</p>
            <ol className="pp-steps">
              <li>กดปุ่มแชร์ด้านล่างของ Safari</li>
              <li>เลือก “เพิ่มไปยังหน้าจอโฮม”</li>
              <li>เปิดแอปจากหน้าจอโฮม แล้วกดเปิดแจ้งเตือน</li>
            </ol>
            <button className="pp-primary" onClick={close}>
              ตกลง
            </button>
          </>
        )}

        {step === 'error' && (
          <>
            <div className="pp-badge pp-warn">
              <Icon name="bellOff" size={32} />
            </div>
            <h2 id="pp-title" className="pp-title">
              เปิดแจ้งเตือนไม่สำเร็จ
            </h2>
            <p className="pp-text">{error}</p>
            <button className="pp-primary" onClick={() => void onEnable()}>
              ลองอีกครั้ง
            </button>
            <button className="pp-secondary" onClick={close}>
              ไว้ทีหลัง
            </button>
          </>
        )}
      </div>
    </div>
  )
}
