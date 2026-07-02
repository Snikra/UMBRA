import { memo } from 'react'

const SIDEBAR_ITEMS = [
  { icon: '🗺️', label: 'Map Layers', id: 'layers' },
  { icon: '⚔️', label: 'Bestiary', id: 'bestiary' },
  { icon: '🎒', label: 'Inventory', id: 'inventory' },
  { icon: '🛡️', label: 'Equipment', id: 'equipment' },
  { icon: '📜', label: 'Quest Log', id: 'quests' },
  { icon: '⚙️', label: 'Settings', id: 'settings' },
]

const Sidebar = memo(({ isOpen, onClose, activeItem, onItemSelect }) => {
  return (
    <>
      <div className={`sidebar-backdrop ${isOpen ? 'visible' : ''}`} onClick={onClose} />
      <nav className={`sidebar ${isOpen ? 'open' : ''}`}>
        {SIDEBAR_ITEMS.map((item) => (
          <button
            key={item.id}
            className={`sidebar-item ${activeItem === item.id ? 'active' : ''}`}
            onClick={() => {
              onItemSelect?.(item.id)
              onClose()
            }}
            title={item.label}
          >
            <span className="sidebar-icon">{item.icon}</span>
          </button>
        ))}
      </nav>
    </>
  )
})

Sidebar.displayName = 'Sidebar'

export default Sidebar
