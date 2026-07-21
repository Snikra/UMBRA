import { useState, useEffect, useMemo } from 'react'
import { MapContainer, TileLayer, Marker, Popup, useMap, Polygon } from 'react-leaflet'
import 'leaflet/dist/leaflet.css'
import L from 'leaflet'
import { POI_DATA } from '../data/pois'

delete L.Icon.Default.prototype._getIconUrl
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
})

const FENDA_POSITIONS = [
  { name: 'Fenda Sombria Alpha', desc: 'Nível de Perigo: Alto' },
  { name: 'Fenda Sombria Beta', desc: 'Nível de Perigo: Crítico' },
  { name: 'Fenda Sombria Gamma', desc: 'Nível de Perigo: Alto' },
  { name: 'Fenda Sombria Delta', desc: 'Nível de Perigo: Moderado' },
  { name: 'Fenda Sombria Epsilon', desc: 'Nível de Perigo: Extremo' },
]

const POI_DESCRIPTIONS = {
  Rift: 'Uma fenda no tecido da realidade. Perigo iminente.',
  'Shop/NPC': 'Comerciantes e serviços disponíveis.',
  NPC: 'Um aliado aguarda sua visita.',
  Monster: 'Território de criaturas hostis.',
  Dungeon: 'Masmorra antiga cheia de tesouros e perigos.',
  Quest: 'Local de missão importante.',
  Treasure: 'Tesouro escondido aguarda.',
  'Fast Travel': 'Portal de viagem rápida desbloqueado.',
}

const BIOME_CONFIG = {
  SAFE: { fillColor: '#2a2622', color: '#3a3632', opacity: 0.4, weight: 1, label: 'Terras Seguras' },
  FOREST: { fillColor: '#1a2a1a', color: '#2a4a2a', opacity: 0.5, weight: 1, label: 'Floresta Sombria' },
  VOLCANIC: { fillColor: '#2a1a0a', color: '#4a2a1a', opacity: 0.5, weight: 1, label: 'Terras Vulcânicas' },
  CORRUPTED: { fillColor: '#2a1a3a', color: '#4a2a5a', opacity: 0.5, weight: 1, label: 'Zona Corrompida' },
  DOCKS: { fillColor: '#1a2a3a', color: '#2a4a5a', opacity: 0.5, weight: 1, label: 'Docas Abandonadas' },
}

const BIOME_CENTERS = {
  SAFE: { lat: -25.5900, lng: -49.4100, radius: 400 },
  FOREST: { lat: -25.6000, lng: -49.4000, radius: 350 },
  VOLCANIC: { lat: -25.5850, lng: -49.3950, radius: 300 },
  CORRUPTED: { lat: -25.5950, lng: -49.4200, radius: 300 },
  DOCKS: { lat: -25.5880, lng: -49.4150, radius: 250 },
}

const PLAYER_ICON = L.divIcon({
  className: 'custom-player-icon',
  html: `<div class="fantasy-marker player">
    <div class="marker-shield"><span class="marker-icon">⚔️</span></div>
  </div>`,
  iconSize: [32, 40],
  iconAnchor: [16, 20],
  popupAnchor: [0, -20],
})

const FENDA_ICON = L.divIcon({
  className: 'custom-fenda-icon',
  html: `<div class="fantasy-marker fenda">
    <div class="marker-shield"><span class="marker-icon">💀</span></div>
  </div>`,
  iconSize: [32, 40],
  iconAnchor: [16, 20],
  popupAnchor: [0, -20],
})

const poiIconCache = new Map()

function getPoiIcon(poi, discovered) {
  const key = `${poi.id}-${discovered}`
  let icon = poiIconCache.get(key)
  if (icon) return icon
  const color = discovered ? poi.ringColor : '#555'
  const iconChar = discovered ? poi.icon : '?'
  const opacity = discovered ? '1' : '0.4'
  const labelText = discovered ? poi.name : '???'
  icon = L.divIcon({
    className: 'poi-marker-icon',
    html: `
      <div class="poi-marker" style="--ring-color: ${color}; opacity: ${opacity};">
        <div class="poi-ring">
          <span class="poi-icon">${iconChar}</span>
        </div>
        <span class="poi-label">${labelText}</span>
      </div>
    `,
    iconSize: [80, 56],
    iconAnchor: [40, 56],
    popupAnchor: [0, -56],
  })
  poiIconCache.set(key, icon)
  return icon
}

function CenterUpdater({ position }) {
  const map = useMap()
  useEffect(() => {
    if (position) {
      map.flyTo(position, 15, { duration: 1.5 })
    }
  }, [position, map])
  return null
}

function BiomePolygons() {
  return (
    <>
      {Object.entries(BIOME_CENTERS).map(([key, center]) => {
        const config = BIOME_CONFIG[key]
        const points = []
        const numPoints = 24
        const radius = center.radius
        for (let i = 0; i < numPoints; i++) {
          const angle = (i / numPoints) * Math.PI * 2
          const dLat = (radius / 111320) * Math.cos(angle)
          const dLng = (radius / (111320 * Math.cos(center.lat * Math.PI / 180))) * Math.sin(angle)
          points.push([center.lat + dLat, center.lng + dLng])
        }
        return (
          <Polygon
            key={key}
            positions={points}
            pathOptions={{
              fillColor: config.fillColor,
              color: config.color,
              fillOpacity: key === 'SAFE' ? 0.15 : 0.25,
              opacity: 0.3,
              weight: 1,
              dashArray: key === 'CORRUPTED' ? '5, 5' : null,
            }}
          />
        )
      })}
    </>
  )
}

function PoiMarkers({ position, activeFilters, searchQuery }) {
  const poiPositions = useMemo(() => {
    if (!position) return []
    return POI_DATA.map((poi) => ({
      ...poi,
      lat: position[0] + poi.gpsOffset[0],
      lng: position[1] + poi.gpsOffset[1],
    }))
  }, [position])

  const filteredSet = useMemo(() => {
    if (!activeFilters?.length && !searchQuery) return null
    let result = poiPositions
    if (activeFilters && activeFilters.length > 0) {
      result = result.filter((p) => activeFilters.includes(p.category))
    }
    if (searchQuery) {
      const q = searchQuery.toLowerCase()
      result = result.filter((p) =>
        p.name.toLowerCase().includes(q) || p.category.toLowerCase().includes(q)
      )
    }
    return new Set(result.map((p) => p.id))
  }, [poiPositions, activeFilters, searchQuery])

  return (
    <>
      {poiPositions.map((poi) => {
        const visible = !filteredSet || filteredSet.has(poi.id)
        const poiIcon = getPoiIcon(poi, true)
        return (
          <Marker
            key={poi.id}
            position={[poi.lat, poi.lng]}
            icon={poiIcon}
            opacity={visible ? 1 : 0.3}
          >
            <Popup>
              <div className="poi-popup-content" style={{ '--poi-color': poi.ringColor }}>
                <h3 className="poi-popup-name">{poi.name}</h3>
                <div className="poi-popup-tags">
                  <span className="poi-popup-level">Lv.{poi.level}</span>
                  <span className="poi-popup-category" style={{ background: `${poi.ringColor}20`, color: poi.ringColor, border: `1px solid ${poi.ringColor}` }}>
                    {poi.category}
                  </span>
                </div>
                <p className="poi-popup-desc">{POI_DESCRIPTIONS[poi.category] || ''}</p>
                <button className="poi-visit-btn">Visitar</button>
              </div>
            </Popup>
          </Marker>
        )
      })}
    </>
  )
}

export default function MapComponent({ onEngageCombat, activeFilters, searchQuery }) {
  const [position, setPosition] = useState(null)
  const [errorMsg, setErrorMsg] = useState('')
  const [fendas, setFendas] = useState([])

  useEffect(() => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (loc) => {
          const { latitude, longitude } = loc.coords
          setPosition([latitude, longitude])
          const cols = [longitude + 0.002, longitude - 0.001, longitude + 0.003, longitude - 0.002, longitude + 0.001]
          const rows = [latitude + 0.002, latitude + 0.003, latitude - 0.001, latitude - 0.002, latitude + 0.001]
          setFendas(rows.map((lat, i) => [lat, cols[i]]))
        },
        (_err) => {
          setErrorMsg('Sinal da Umbra indisponível')
          const fallback = [-25.5936, -49.4069]
          setPosition(fallback)
          setFendas([
            [fallback[0] + 0.002, fallback[1] + 0.002],
            [fallback[0] - 0.001, fallback[1] + 0.003],
            [fallback[0] + 0.003, fallback[1] - 0.001],
            [fallback[0] - 0.002, fallback[1] - 0.002],
            [fallback[0] + 0.001, fallback[1] + 0.001],
          ])
        }
      )
    } else {
      setErrorMsg('Geolocalização não suportada')
      setPosition([-25.5936, -49.4069])
    }
  }, [])

  const mapLayers = useMemo(() => {
    if (!position) return null
    return (
      <>
        <BiomePolygons />
        <CenterUpdater position={position} />
        <PoiMarkers position={position} activeFilters={activeFilters} searchQuery={searchQuery} />
      </>
    )
  }, [position, activeFilters, searchQuery])

  if (!position) {
    return (
      <div className="map-loading">
        <div className="loading-icon">🕯️</div>
        <p>Buscando seu espírito na Umbra...</p>
        <p style={{ fontSize: '0.7rem', marginTop: '8px', color: 'var(--text-dim)' }}>
          {errorMsg || 'Aguardando conexão com as sombras'}
        </p>
      </div>
    )
  }

  return (
    <div className="map-wrapper">
      <MapContainer
        center={position}
        zoom={15}
        style={{ height: '100%', width: '100%' }}
        zoomControl={true}
        scrollWheelZoom={true}
        doubleClickZoom={false}
      >
        <TileLayer
          url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OSM</a>'
        />
        {mapLayers}
        <Marker position={position} icon={PLAYER_ICON}>
          <Popup>
            <div className="fenda-popup">
              <h3>Kaelen, o Sombrio</h3>
              <p className="perigo-level">Caçador de Daemons — Nv. 8</p>
            </div>
          </Popup>
        </Marker>
        {fendas.map((pos, idx) => (
          <Marker key={idx} position={pos} icon={FENDA_ICON}>
            <Popup>
              <div className="fenda-popup">
                <h3>{FENDA_POSITIONS[idx]?.name || 'Fenda Sombria'}</h3>
                <p className="perigo-level">{FENDA_POSITIONS[idx]?.desc || 'Nível de Perigo: Alto'}</p>
                <button className="engage-btn" onClick={onEngageCombat}>
                  Entrar no Combate
                </button>
              </div>
            </Popup>
          </Marker>
        ))}
      </MapContainer>
    </div>
  )
}
