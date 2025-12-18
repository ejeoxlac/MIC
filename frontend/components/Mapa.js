'use client'

import { useState } from 'react'
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet'
import 'leaflet/dist/leaflet.css'
import L from 'leaflet'
import hospitales from '../data/hospitales.json'
import seguridad from '../data/seguridad.json'
import bomberos from '../data/bomberos.json'
import gobierno from '../data/gobierno.json'

// Fix for default markers in react-leaflet
delete L.Icon.Default.prototype._getIconUrl
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
})

// Custom icons
const createCustomIcon = (letter, color) => L.divIcon({
  html: `<div style="background-color: ${color}; color: white; width: 30px; height: 30px; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-weight: bold; font-size: 14px; border: 2px solid white;">${letter}</div>`,
  className: 'custom-marker',
  iconSize: [25, 25],
  iconAnchor: [12, 12]
})

const getIconForFilter = (filter) => {
  switch (filter) {
    case 'salud':
      return createCustomIcon('🏥', '#28a745')
    case 'seguridad':
      return createCustomIcon('🚓', '#007bff')
    case 'bomberos':
      return createCustomIcon('🚒', '#dc3545')
    case 'gobierno':
      return createCustomIcon('🏛️', '#6f42c1')
    default:
      return L.icon({
        iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
        iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
        shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
        iconSize: [25, 41],
        iconAnchor: [12, 41],
        popupAnchor: [1, -34]
      })
  }
}

function FilterButtons({ filter, setFilter }) {
  return (
    <div style={{
      position: 'absolute',
      top: '80px',
      left: '12px',
      zIndex: 1000,
      display: 'grid',
      gap: '10px'
    }}>
      <button
        onClick={() => setFilter('salud')}
        style={{
          padding: '10px 20px',
          backgroundColor: filter === 'salud' ? '#28a745' : '#6c757d',
          color: 'white',
          border: 'none',
          borderRadius: '5px',
          cursor: 'pointer'
        }}
      >
        Salud
      </button>
      <button
        onClick={() => setFilter('seguridad')}
        style={{
          padding: '10px 20px',
          backgroundColor: filter === 'seguridad' ? '#28a745' : '#6c757d',
          color: 'white',
          border: 'none',
          borderRadius: '5px',
          cursor: 'pointer'
        }}
      >
        Seguridad
      </button>
      <button
        onClick={() => setFilter('bomberos')}
        style={{
          padding: '10px 20px',
          backgroundColor: filter === 'bomberos' ? '#28a745' : '#6c757d',
          color: 'white',
          border: 'none',
          borderRadius: '5px',
          cursor: 'pointer'
        }}
      >
        Bomberos
      </button>
      <button
        onClick={() => setFilter('gobierno')}
        style={{
          padding: '10px 20px',
          backgroundColor: filter === 'gobierno' ? '#28a745' : '#6c757d',
          color: 'white',
          border: 'none',
          borderRadius: '5px',
          cursor: 'pointer'
        }}
      >
        Gobierno
      </button>
    </div>
  )
}

function AddMarkerButton({ customMarker, onAddMarker, onRemoveMarker }) {
  const map = useMap()

  const handleClick = () => {
    if (customMarker) {
      onRemoveMarker()
    } else {
      const center = map.getCenter()
      onAddMarker([center.lat, center.lng])
    }
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
        backgroundColor: customMarker ? '#dc3545' : '#007bff',
        color: 'white',
        border: 'none',
        borderRadius: '5px',
        cursor: 'pointer'
      }}
    >
      {customMarker ? 'Eliminar Pin' : 'Agregar Pin'}
    </button>
  )
}

export default function Mapa() {
  const [customMarker, setCustomMarker] = useState(null)
  const [filter, setFilter] = useState('salud')
  const center = [10.4, -71.45]
  const zoom = 14
  const maxBounds = [[10.3, -71.55], [10.5, -71.35]]

  const addMarker = (position) => {
    setCustomMarker(position)
  }

  const removeMarker = () => {
    setCustomMarker(null)
  }

  const handleDragEnd = (e) => {
    const marker = e.target
    const position = marker.getLatLng()
    setCustomMarker([position.lat, position.lng])
  }

  const getMarkers = () => {
    if (filter === 'salud') {
      return hospitales
    } else if (filter === 'seguridad') {
      return seguridad
    } else if (filter === 'bomberos') {
      return bomberos
    } else if (filter === 'gobierno') {
      return gobierno
    }
    return []
  }

  return (
    <div style={{ position: 'relative', height: '100vh' }}>
      <MapContainer center={center} zoom={zoom} minZoom={13} maxZoom={16} maxBounds={maxBounds} style={{ height: '100%', width: '100%' }}>
        <TileLayer
          url="/tile/{z}/{x}/{y}.png"
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
        />
        {getMarkers().map((item, index) => (
          <Marker key={index} position={[item.lat, item.lng]} icon={getIconForFilter(filter)}>
            <Popup>
              <h3>{item.nombre}</h3>
              <p><strong>Servicios:</strong> {item.servicios.join(', ')}</p>
              <p><strong>Horarios:</strong> {item.horarios}</p>
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
        <AddMarkerButton customMarker={customMarker} onAddMarker={addMarker} onRemoveMarker={removeMarker} />
      </MapContainer>
      <FilterButtons filter={filter} setFilter={setFilter} />
    </div>
  )
}