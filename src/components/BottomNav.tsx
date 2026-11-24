import { useEffect, useRef } from 'react'
import { NavLink, useLocation } from 'react-router-dom'
import { DASHBOARDS } from '../dashboards'
import { Icon, type IconName } from './Icon'
import './BottomNav.css'

interface Tab {
  to: string
  icon: IconName
  label: string
}

const TABS: Tab[] = [
  ...DASHBOARDS.map((d) => ({ to: `/d/${d.id}`, icon: d.icon, label: d.label })),
  { to: '/alarms', icon: 'bell', label: 'แจ้งเตือน' },
]
const REPORT_TAB: Tab = { to: '/report', icon: 'report', label: 'รายงาน' }
const SETTINGS_TAB: Tab = { to: '/settings', icon: 'settings', label: 'ตั้งค่า' }

// Devices and history are reached from the settings tab, so keep it highlighted there.
const SETTINGS_CHILDREN = ['/devices', '/history']

/**
 * Horizontally scrolling tab bar: wide tabs with full labels instead of squeezing
 * every tab into the screen width. The active tab is scrolled into view whenever the
 * route changes, including the jump back to the home tab on resume.
 */
export function BottomNav({ alarmCount = 0, showReport = false }: { alarmCount?: number; showReport?: boolean }) {
  const { pathname } = useLocation()
  const underSettings = SETTINGS_CHILDREN.some((p) => pathname.startsWith(p))
  const tabs = [...TABS, ...(showReport ? [REPORT_TAB] : []), SETTINGS_TAB]
  const navRef = useRef<HTMLElement>(null)

  useEffect(() => {
    const active = navRef.current?.querySelector<HTMLElement>('.bn-item.active')
    active?.scrollIntoView({ behavior: 'smooth', inline: 'nearest', block: 'nearest' })
  }, [pathname])

  return (
    <div className="bottom-nav-wrap">
      <nav className="bottom-nav" ref={navRef}>
        {tabs.map((t) => (
          <NavLink
            key={t.to}
            to={t.to}
            className={({ isActive }) =>
              `bn-item${isActive || (t.to === '/settings' && underSettings) ? ' active' : ''}`
            }
          >
            <span className="bn-icon">
              <Icon name={t.icon} size={30} />
              {t.to === '/alarms' && alarmCount > 0 && (
                <span className="bn-badge">{alarmCount > 99 ? '99+' : alarmCount}</span>
              )}
            </span>
            <span className="bn-label">{t.label}</span>
          </NavLink>
        ))}
      </nav>
      {/* Fade on the right edge: hints that more tabs are a swipe away. */}
      <div className="bn-fade" aria-hidden="true" />
    </div>
  )
}
