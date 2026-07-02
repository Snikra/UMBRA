import { useState, useCallback, memo } from 'react'
import MapComponent from './MapComponent'
import HudBar from './HudBar'
import SearchBar from './SearchBar'
import Sidebar from './Sidebar'
import PlayerMarker from './PlayerMarker'
import CompassRose from './CompassRose'
import ParticleLayer from './ParticleLayer'

const PLAYER_STATS = { HP: 85, MAX_HP: 100, MP: 42, MAX_MP: 60 }

const MapScreen = memo(({ onEngageCombat }) => {
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [sidebarItem, setSidebarItem] = useState(null)
  const [activeFilters, setActiveFilters] = useState([])
  const [searchQuery, setSearchQuery] = useState('')
  const heading = 0

  const handleSearch = useCallback((query) => {
    setSearchQuery(query)
  }, [])

  const handleFilterChange = useCallback((filters) => {
    setActiveFilters(filters)
  }, [])

  return (
    <div className="map-screen">
      <ParticleLayer />
      <div className="map-container">
        <MapComponent
          onEngageCombat={onEngageCombat}
          activeFilters={activeFilters}
          searchQuery={searchQuery}
        />
      </div>

      <div className="map-hud-layer">
        <HudBar playerStats={PLAYER_STATS} heading={heading} />
        <SearchBar onSearch={handleSearch} onFilterChange={handleFilterChange} activeFilters={activeFilters} />
      </div>

      <div className="map-overlay-top-right">
        <CompassRose heading={heading} />
      </div>

      <div className="map-overlay-center">
        <PlayerMarker />
      </div>

      <button
        className="hamburger-btn"
        onClick={() => setSidebarOpen(true)}
        aria-label="Abrir menu"
      >
        ☰
      </button>

      <Sidebar
        isOpen={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
        activeItem={sidebarItem}
        onItemSelect={setSidebarItem}
      />
    </div>
  )
})

MapScreen.displayName = 'MapScreen'

export default MapScreen
