import { NavLink } from 'react-router-dom'
import './BottomNav.css'

const TABS = [
  { to: '/devices', icon: '📟', label: 'อุปกรณ์' },
  { to: '/alarms', icon: '🔔', label: 'แจ้งเตือน' },
  { to: '/history', icon: '📈', label: 'กราฟ' },
  { to: '/settings', icon: '⚙️', label: 'ตั้งค่า' },
  { to: '/dashboard', icon: '📊', label: 'แดชบอร์ด' },
]

export function BottomNav({ alarmCount = 0 }: { alarmCount?: number }) {
  return (
    <nav className="bottom-nav">
      {TABS.map((t) => (
        <NavLink key={t.to} to={t.to} className={({ isActive }) => `bn-item${isActive ? ' active' : ''}`}>
          <span className="bn-icon">
            {t.icon}
            {t.to === '/alarms' && alarmCount > 0 && (
              <span className="bn-badge">{alarmCount > 99 ? '99+' : alarmCount}</span>
            )}
          </span>
          <span className="bn-label">{t.label}</span>
        </NavLink>
      ))}
    </nav>
  )
}
