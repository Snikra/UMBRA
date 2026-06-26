import React, { useState, useEffect } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';

// Fix default icon issue with Leaflet in React
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

// Custom Icon for Fendas Sombrias
const fendaIcon = new L.Icon({
  iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-red.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41]
});

// Component to recenter map when location is found
function LocationMarker({ position }) {
  const map = useMap();
  useEffect(() => {
    if (position) {
      map.flyTo(position, map.getZoom());
    }
  }, [position, map]);

  return position === null ? null : (
    <Marker position={position}>
      <Popup>Você está aqui.</Popup>
    </Marker>
  );
}

export default function MapComponent({ onEngageCombat }) {
  const [position, setPosition] = useState(null);
  const [errorMsg, setErrorMsg] = useState('');
  const [fendas, setFendas] = useState([]);

  useEffect(() => {
    // Get user GPS
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (loc) => {
          const { latitude, longitude } = loc.coords;
          setPosition([latitude, longitude]);
          
          // Generate 3 random "Fendas" nearby
          const newFendas = [
            [latitude + 0.002, longitude + 0.002],
            [latitude - 0.001, longitude + 0.003],
            [latitude + 0.003, longitude - 0.001]
          ];
          setFendas(newFendas);
        },
        (err) => {
          setErrorMsg('Acesso ao GPS negado ou indisponível.');
          // Fallback to center of Araucária (PR) as example from GDD
          setPosition([-25.5936, -49.4069]);
        }
      );
    } else {
      setErrorMsg('Geolocalização não suportada pelo seu navegador.');
      setPosition([-25.5936, -49.4069]);
    }
  }, []);

  if (!position) {
    return (
      <div className="map-loading">
        <p>Procurando sinal de GPS na Umbra...</p>
        <p className="error-msg">{errorMsg}</p>
      </div>
    );
  }

  return (
    <div className="map-wrapper">
      <MapContainer center={position} zoom={15} style={{ height: '100%', width: '100%' }} zoomControl={false}>
        {/* CartoDB Dark Matter TileLayer for the Sanguine Eclipse dark look */}
        <TileLayer
          url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>'
        />
        
        <LocationMarker position={position} />

        {fendas.map((pos, idx) => (
          <Marker key={idx} position={pos} icon={fendaIcon}>
            <Popup>
              <div className="fenda-popup">
                <h3>Fenda Sombria</h3>
                <p>Nível de Perigo: Alto</p>
                <button className="engage-btn" onClick={onEngageCombat}>Entrar no Combate</button>
              </div>
            </Popup>
          </Marker>
        ))}
      </MapContainer>
    </div>
  );
}
