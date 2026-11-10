import { NavLink, useLocation } from 'react-router-dom'
import { DASHBOARDS } from '../dashboards'
import './BottomNav.css'

const TABS = [
  ...DASHBOARDS.map((d) => ({ to: `/d/${d.id}`, icon: d.icon, label: d.label })),
  { to: '/alarms', icon: '🔔', label: 'แจ้งเตือน' },
  { to: '/settings', icon: '⚙️', label: 'ตั้งค่า' },
]

// Devices and history are reached from the settings tab, so keep it highlighted there.
const SETTINGS_CHILDREN = ['/devices', '/history']

export function BottomNav({ alarmCount = 0 }: { alarmCount?: number }) {
  const { pathname } = useLocation()
  const underSettings = SETTINGS_CHILDREN.some((p) => pathname.startsWith(p))

  return (
    <nav className="bottom-nav">
      {TABS.map((t) => (
        <NavLink
          key={t.to}
          to={t.to}
          className={({ isActive }) =>
            `bn-item${isActive || (t.to === '/settings' && underSettings) ? ' active' : ''}`
          }
        >
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
