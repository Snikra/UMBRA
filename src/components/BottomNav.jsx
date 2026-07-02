import { memo } from 'react'

const TABS = [
  { id: 'MAPA', icon: '🗺️', label: 'MAPA' },
  { id: 'COMBATE', icon: '⚔️', label: 'COMBATE' },
  { id: 'INVENTARIO', icon: '🎒', label: 'INVENTÁRIO' },
  { id: 'DIARIO', icon: '📜', label: 'DIÁRIO' },
  { id: 'CONFIG', icon: '⚙️', label: 'CONFIG' },
]

const BottomNav = memo(({ activeTab, onTabChange }) => {
  return (
    <nav className="bottom-nav">
      <div className="bottom-nav-indicator" />
      {TABS.map((tab) => {
        const isActive = activeTab === tab.id
        return (
          <button
            key={tab.id}
            className={`nav-item ${isActive ? 'active' : ''}`}
            onClick={() => onTabChange(tab.id)}
          >
            <div className="nav-icon-wrapper">
              <span className="nav-icon">{tab.icon}</span>
              {isActive && <span className="nav-active-line" />}
            </div>
            <span className="nav-label">{tab.label}</span>
          </button>
        )
      })}
    </nav>
  )
})

BottomNav.displayName = 'BottomNav'

export default BottomNav
