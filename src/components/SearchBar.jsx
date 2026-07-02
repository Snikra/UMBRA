import { useState, memo } from 'react'

const FILTERS = [
  { label: 'Fenda', color: '#FF0000', category: 'Rift' },
  { label: 'Loja', color: '#C5A55A', category: 'Shop/NPC' },
  { label: 'NPC', color: '#4A90D9', category: 'NPC' },
  { label: 'Dungeon', color: '#800080', category: 'Dungeon' },
  { label: 'Fast Travel', color: '#FF4500', category: 'Fast Travel' },
]

const SearchBar = memo(({ onSearch, onFilterChange, activeFilters }) => {
  const [query, setQuery] = useState('')
  const [focused, setFocused] = useState(false)

  const handleChange = (e) => {
    const val = e.target.value
    setQuery(val)
    onSearch?.(val)
  }

  const toggleFilter = (category) => {
    const current = activeFilters || []
    const next = current.includes(category)
      ? current.filter((f) => f !== category)
      : [...current, category]
    onFilterChange?.(next)
  }

  return (
    <div className={`search-bar ${focused ? 'focused' : ''}`}>
      <div className="search-input-row">
        <span className="search-icon">🔍</span>
        <input
          type="text"
          className="search-input"
          placeholder="Buscar local, NPC ou item..."
          value={query}
          onChange={handleChange}
          onFocus={() => setFocused(true)}
          onBlur={() => setFocused(false)}
        />
      </div>
      <div className="search-filters">
        {FILTERS.map((f) => {
          const active = activeFilters?.includes(f.category)
          return (
            <button
              key={f.category}
              className={`filter-chip ${active ? 'active' : ''}`}
              style={{
                '--chip-color': f.color,
                '--chip-bg': `${f.color}20`,
              }}
              onClick={() => toggleFilter(f.category)}
            >
              {f.label}
            </button>
          )
        })}
      </div>
    </div>
  )
})

SearchBar.displayName = 'SearchBar'

export default SearchBar
