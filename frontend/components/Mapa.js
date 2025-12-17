'use client'

import { useState } from 'react'
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet'
import 'leaflet/dist/leaflet.css'
import L from 'leaflet'
import hospitales from '../data/hospitales.json'

// Fix for default markers in react-leaflet
delete L.Icon.Default.prototype._getIconUrl
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
})

function AddMarkerButton({ onAddMarker }) {
  const map = useMap()

  const handleClick = () => {
    const center = map.getCenter()
    onAddMarker([center.lat, center.lng])
  }

  return (
    <button
      onClick={handleClick}
      style={{
        position: 'absolute',
        top: '12px',
        left: '50px',
        zIndex: 1000,
        padding: '10px 20px',
        backgroundColor: '#007bff',
        color: 'white',
        border: 'none',
        borderRadius: '5px',
        cursor: 'pointer'
      }}
    >
      Agregar Pin
    </button>
  )
}

export default function Mapa() {
  const [customMarker, setCustomMarker] = useState(null)
  const center = [10.4, -71.45]
  const zoom = 14
  const maxBounds = [[10.3, -71.55], [10.5, -71.35]]

  const addMarker = (position) => {
    setCustomMarker(position)
  }

  const handleDragEnd = (e) => {
    const marker = e.target
    const position = marker.getLatLng()
    setCustomMarker([position.lat, position.lng])
  }

  return (
    <div style={{ position: 'relative', height: '100vh' }}>
      <MapContainer center={center} zoom={zoom} minZoom={13} maxZoom={16} maxBounds={maxBounds} style={{ height: '100%', width: '100%' }}>
        <TileLayer
          url="/tile/{z}/{x}/{y}.png"
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
        />
        {hospitales.map((hospital, index) => (
          <Marker key={index} position={[hospital.lat, hospital.lng]}>
            <Popup>
              <h3>{hospital.nombre}</h3>
              <p><strong>Servicios:</strong> {hospital.servicios.join(', ')}</p>
              <p><strong>Horarios:</strong> {hospital.horarios}</p>
            </Popup>
          </Marker>
        ))}
        {customMarker && (
          <Marker
            position={customMarker}
            draggable={true}
            eventHandlers={{
              dragend: handleDragEnd,
            }}
          >
            <Popup>
              <p>Coordenadas: {customMarker[0].toFixed(6)}, {customMarker[1].toFixed(6)}</p>
            </Popup>
          </Marker>
        )}
        <AddMarkerButton onAddMarker={addMarker} />
      </MapContainer>
    </div>
  )
}