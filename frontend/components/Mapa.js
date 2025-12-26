'use client'

import { useState, useEffect, useRef } from 'react'
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
      return createCustomIcon('🏥', '#74b9ff')
    case 'seguridad':
      return createCustomIcon('🚓', '#0077b6')
    case 'bomberos':
      return createCustomIcon('🚒', '#ff7675')
    case 'gobierno':
      return createCustomIcon('🏛️', '#8b5cf6')
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

function MapUpdater({ zoom, targetZoom, setZoom, setTargetZoom, updatingZoom, setUpdatingZoom }) {
  const map = useMap()

  useEffect(() => {
    if (map) {
      map.setZoom(zoom)
    }
  }, [zoom, map])

  useEffect(() => {
    if (map && !updatingZoom) {
      const handleZoom = () => {
        setUpdatingZoom(true)
        const currentZoom = map.getZoom()
        setZoom(currentZoom)
        setTargetZoom(currentZoom)
        setUpdatingZoom(false)
      }

      map.on('zoomend', handleZoom)

      return () => {
        map.off('zoomend', handleZoom)
      }
    }
  }, [map, setZoom, setTargetZoom, setUpdatingZoom, updatingZoom])

  return null
}

function Mapa() {
  const [customMarker, setCustomMarker] = useState(null)
  const [filters, setFilters] = useState(['salud', 'seguridad', 'bomberos', 'gobierno'])
  const [zoom, setZoom] = useState(14)
  const [targetZoom, setTargetZoom] = useState(14)
  const [updatingZoom, setUpdatingZoom] = useState(false)
  const mapRef = useRef(null)
  const center = [10.4, -71.45]
  const maxBounds = [[10.3, -71.55], [10.5, -71.35]]

  // Efecto para escuchar eventos personalizados para agregar y quitar marcadores
  useEffect(() => {
    const handleAddMarker = () => {
      // Obtener el centro actual del mapa
      const map = mapRef.current
      if (map) {
        const center = map.getCenter()
        const newMarker = [center.lat, center.lng]
        setCustomMarker(null) // Primero limpiar para forzar re-render
        setTimeout(() => {
          setCustomMarker(newMarker) // Luego agregar el nuevo marcador
        }, 10)
      }
    }
    
    const handleRemoveMarker = () => {
      setCustomMarker(null)
    }
    
    // Agregar listeners para los eventos personalizados
    window.addEventListener('add-marker', handleAddMarker)
    window.addEventListener('remove-marker', handleRemoveMarker)
    
    // Limpiar listeners cuando el componente se desmonte
    return () => {
      window.removeEventListener('add-marker', handleAddMarker)
      window.removeEventListener('remove-marker', handleRemoveMarker)
    }
  }, [])

  const handleDragEnd = (e) => {
    const marker = e.target
    const position = marker.getLatLng()
    setCustomMarker([position.lat, position.lng])
  }

  useEffect(() => {
    const handleZoomChange = (e) => {
      const newZoom = parseInt(e.target.value)
      setTargetZoom(newZoom)
    }

    const handleFilterChange = (e) => {
      const { id, checked } = e.target
      let updatedFilters = [...filters]
      if (id === 'todos-checkbox') {
        if (checked) {
          updatedFilters = ['salud', 'seguridad', 'bomberos', 'gobierno']
        } else {
          updatedFilters = []
        }
      } else {
        if (checked) {
          updatedFilters.push(id.replace('-checkbox', ''))
        } else {
          updatedFilters = updatedFilters.filter(f => f !== id.replace('-checkbox', ''))
        }
      }
      setFilters(updatedFilters)
    }

    const zoomRange = document.getElementById('zoom-range')
    const todosCheckbox = document.getElementById('todos-checkbox')
    const saludCheckbox = document.getElementById('salud-checkbox')
    const seguridadCheckbox = document.getElementById('seguridad-checkbox')
    const bomberosCheckbox = document.getElementById('bomberos-checkbox')
    const gobiernoCheckbox = document.getElementById('gobierno-checkbox')

    if (zoomRange) {
      zoomRange.addEventListener('input', handleZoomChange)
    }

    if (todosCheckbox) {
      todosCheckbox.addEventListener('change', handleFilterChange)
    }

    if (saludCheckbox) {
      saludCheckbox.addEventListener('change', handleFilterChange)
    }

    if (seguridadCheckbox) {
      seguridadCheckbox.addEventListener('change', handleFilterChange)
    }

    if (bomberosCheckbox) {
      bomberosCheckbox.addEventListener('change', handleFilterChange)
    }

    if (gobiernoCheckbox) {
      gobiernoCheckbox.addEventListener('change', handleFilterChange)
    }

    return () => {
      if (zoomRange) {
        zoomRange.removeEventListener('input', handleZoomChange)
      }
      if (todosCheckbox) {
        todosCheckbox.removeEventListener('change', handleFilterChange)
      }
      if (saludCheckbox) {
        saludCheckbox.removeEventListener('change', handleFilterChange)
      }
      if (seguridadCheckbox) {
        seguridadCheckbox.removeEventListener('change', handleFilterChange)
      }
      if (bomberosCheckbox) {
        bomberosCheckbox.removeEventListener('change', handleFilterChange)
      }
      if (gobiernoCheckbox) {
        gobiernoCheckbox.removeEventListener('change', handleFilterChange)
      }
    }
  }, [filters])

  useEffect(() => {
    if (zoom !== targetZoom) {
      const timeoutId = setTimeout(() => {
        const diff = targetZoom - zoom
        const step = diff > 0 ? 1 : -1
        setZoom(prevZoom => prevZoom + step)
      }, 100)

      return () => clearTimeout(timeoutId)
    }
  }, [zoom, targetZoom])

  useEffect(() => {
    const todosCheckbox = document.getElementById('todos-checkbox')
    const saludCheckbox = document.getElementById('salud-checkbox')
    const seguridadCheckbox = document.getElementById('seguridad-checkbox')
    const bomberosCheckbox = document.getElementById('bomberos-checkbox')
    const gobiernoCheckbox = document.getElementById('gobierno-checkbox')

    if (todosCheckbox) {
      todosCheckbox.checked = filters.length === 4
    }

    if (saludCheckbox) {
      saludCheckbox.checked = filters.includes('salud')
    }

    if (seguridadCheckbox) {
      seguridadCheckbox.checked = filters.includes('seguridad')
    }

    if (bomberosCheckbox) {
      bomberosCheckbox.checked = filters.includes('bomberos')
    }

    if (gobiernoCheckbox) {
      gobiernoCheckbox.checked = filters.includes('gobierno')
    }
  }, [filters])

  useEffect(() => {
    const zoomRange = document.getElementById('zoom-range')
    if (zoomRange) {
      zoomRange.value = zoom
    }
  }, [zoom])

  const getMarkers = () => {
    let markers = []
    if (filters.includes('salud')) {
      markers = markers.concat(hospitales.map(item => ({ ...item, type: 'salud' })))
    }
    if (filters.includes('seguridad')) {
      markers = markers.concat(seguridad.map(item => ({ ...item, type: 'seguridad' })))
    }
    if (filters.includes('bomberos')) {
      markers = markers.concat(bomberos.map(item => ({ ...item, type: 'bomberos' })))
    }
    if (filters.includes('gobierno')) {
      markers = markers.concat(gobierno.map(item => ({ ...item, type: 'gobierno' })))
    }
    return markers
  }

  return (
    <div style={{ position: 'relative', height: '100vh' }}>
      <MapContainer 
        center={center} 
        zoom={zoom} 
        minZoom={13} 
        maxZoom={16} 
        maxBounds={maxBounds} 
        style={{ height: '100%', width: '100%' }}
        ref={mapRef}
      >
        <TileLayer
          url="/tile/{z}/{x}/{y}.png"
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
        />
        {getMarkers().map((item, index) => (
          <Marker key={index} position={[item.lat, item.lng]} icon={getIconForFilter(item.type)}>
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
            icon={L.divIcon({
              html: `<div style="color: #ff6b6b; font-size: 30px; text-shadow: 0 2px 5px rgba(0,0,0,0.3);">📍</div>`,
              className: 'custom-marker',
              iconSize: [30, 30],
              iconAnchor: [15, 15]
            })}
            eventHandlers={{
              dragend: handleDragEnd,
            }}
          >
            <Popup>
              <p>Coordenadas: {customMarker[0].toFixed(6)}, {customMarker[1].toFixed(6)}</p>
              <p>Este es un marcador personalizado. Puedes arrastrarlo para cambiar su posición.</p>
            </Popup>
          </Marker>
        )}
        <MapUpdater zoom={zoom} targetZoom={targetZoom} setZoom={setZoom} setTargetZoom={setTargetZoom} updatingZoom={updatingZoom} setUpdatingZoom={setUpdatingZoom} />
      </MapContainer>
    </div>
  )
}

export default Mapa