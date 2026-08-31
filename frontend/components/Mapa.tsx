'use client'

import { useState, useEffect, useRef, useCallback, useMemo } from 'react'
import {
  MapContainer,
  TileLayer,
  Marker,
  Popup,
  Tooltip,
  Polyline,
  Circle,
  GeoJSON,
  useMap,
} from 'react-leaflet'
import type { GeoJsonObject } from 'geojson'
import type { LatLngTuple, Path, PathOptions } from 'leaflet'
import 'leaflet/dist/leaflet.css'
import L from 'leaflet'
import { createRoot } from 'react-dom/client'
import {
  FaFacebook,
  FaInstagram,
  FaLinkedin,
  FaTiktok,
  FaTwitter,
  FaWhatsapp,
  FaYoutube,
} from 'react-icons/fa'
import { FiGlobe, FiLink } from 'react-icons/fi'
import type { IconType as SocialIconType } from 'react-icons'
import hospitales from '../data/hospitales.json'
import seguridad from '../data/seguridad.json'
import bomberos from '../data/bomberos.json'
import gobierno from '../data/gobierno.json'
import parroquiasCombinadas from '../data/parroquias-combinadas.json'
import type { FilterCategory, IconType, MapEntity, MapStyle } from '../types/map'
import {
  getMapMinZoom,
  isInsideMapBounds,
  MAP_BOUNDS_NE,
  MAP_BOUNDS_SW,
  MAP_CENTER,
  MAP_MAX_ZOOM,
} from '../types/map'
import { useUserLocation } from '../hooks/useUserLocation'
import { ENTITY_LEGEND, getIconSVGPath } from '../lib/mapIcons'
import MapLegend from './MapLegend'
import '../types/events'

const PARISH_PALETTE = [
  { fill: '#3b82f6', stroke: '#1d4ed8' },
  { fill: '#10b981', stroke: '#047857' },
  { fill: '#f59e0b', stroke: '#b45309' },
  { fill: '#8b5cf6', stroke: '#6d28d9' },
  { fill: '#ef4444', stroke: '#b91c1c' },
  { fill: '#06b6d4', stroke: '#0e7490' },
  { fill: '#ec4899', stroke: '#be185d' },
  { fill: '#84cc16', stroke: '#4d7c0f' },
  { fill: '#f97316', stroke: '#c2410c' },
]

const getCheckbox = (id: string) =>
  document.getElementById(id) as HTMLInputElement | null

/** Compatibilidad react-leaflet v3/v4: el ref puede ser el layer o un wrapper con leafletElement */
function getLeafletLayer<T>(ref: { leafletElement?: T } | T | null | undefined): T | null {
  if (!ref) return null
  if (typeof ref === 'object' && 'leafletElement' in ref && ref.leafletElement) {
    return ref.leafletElement
  }
  return ref as T
}

const PARISH_DISPLAY_NAMES = {
  AMBROSIO: 'Ambrosio',
  'ARISTEDES CALVANI': 'Arístides Calvanni',
  'CARMEN HERRERA': 'Carmen Herrera',
  'GERMAN RIOS LINARES': 'Germán Ríos Linares',
  'JORGE HERNANDEZ': 'Jorge Hernández',
  'LA ROSA': 'La Rosa',
  'PUNTA GORDA': 'Punta Gorda',
  'ROMULO BETANCOURT': 'Rómulo Betancourt',
  'SAN BENITO': 'San Benito',
}

const formatParishName = (raw: string | undefined) => {
  if (!raw) return ''
  return PARISH_DISPLAY_NAMES[raw as keyof typeof PARISH_DISPLAY_NAMES] || raw
}

const getParishStyle = (feature: GeoJSON.Feature): PathOptions => {
  const cod = parseInt(feature.properties?.COD_PARROQ || '1', 10)
  const { fill, stroke } = PARISH_PALETTE[(cod - 1) % PARISH_PALETTE.length]
  return {
    fillColor: fill,
    color: stroke,
    weight: 2.5,
    opacity: 0.95,
    fillOpacity: 0.28,
  }
}

function MapInstanceSync({
  mapRef,
  mapInstanceRef,
}: {
  mapRef: React.MutableRefObject<L.Map | null>
  mapInstanceRef: React.MutableRefObject<L.Map | null>
}) {
  const map = useMap()

  useEffect(() => {
    mapInstanceRef.current = map
    mapRef.current = map

    return () => {
      if (mapInstanceRef.current === map) {
        mapInstanceRef.current = null
      }
      if (mapRef.current === map) {
        mapRef.current = null
      }
    }
  }, [map, mapRef, mapInstanceRef])

  return null
}

function ParroquiasLayer({
  visible,
  clickThrough = false,
}: {
  visible: boolean
  clickThrough?: boolean
}) {
  const onEachFeature = useCallback((feature: GeoJSON.Feature, layer: Path) => {
    const name = formatParishName(feature.properties?.PARROQUIA)
    const sede = feature.properties?.CAP_PARROQ
    const baseStyle = getParishStyle(feature)

    layer.bindTooltip(name, {
      permanent: true,
      direction: 'center',
      className: 'parroquia-label',
    })

    if (clickThrough) {
      layer.off('click')
      return
    }

    layer.bindPopup(
      `<div class="parroquia-popup">
        <strong>${name}</strong>
        <span>Parroquia de Cabimas</span>
        ${
          sede && sede !== 'CABIMAS'
            ? `<small>Sede: ${sede.charAt(0)}${sede.slice(1).toLowerCase()}</small>`
            : ''
        }
      </div>`,
      { className: 'parroquia-popup-container' }
    )

    layer.on({
      mouseover: () => {
        layer.setStyle({ weight: 4, fillOpacity: 0.45 })
        layer.bringToFront()
      },
      mouseout: () => layer.setStyle(baseStyle),
    })
  }, [clickThrough])

  const data = useMemo(() => parroquiasCombinadas as GeoJsonObject, [])

  if (!visible) return null

  return (
    <GeoJSON
      key={`parroquias-cabimas-${clickThrough ? 'through' : 'on'}`}
      data={data}
      style={getParishStyle}
      onEachFeature={onEachFeature}
      interactive={!clickThrough}
    />
  )
}

// Fix for default markers in react-leaflet
delete (L.Icon.Default.prototype as L.Icon.Default & { _getIconUrl?: unknown })._getIconUrl
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
})

interface MapStyleConfig {
  url: string
  attribution: string
  className?: string
}

const mapStyleConfigs: Record<MapStyle, MapStyleConfig> = {
  local: {
    url: '/tile/{z}/{x}/{y}.png',
    attribution:
      '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
  },
  streets: {
    url: 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',
    attribution:
      '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
  },
  satellite: {
    url: 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}',
    attribution:
      'Tiles &copy; Esri &mdash; Source: Esri, i-cubed, USDA, USGS, AEX, GeoEye, Getmapping, Aerogrid, IGN, IGP, UPR-EGP, and the GIS User Community',
  },
  terrain: {
    url: 'https://{s}.tile.opentopomap.org/{z}/{x}/{y}.png',
    attribution:
      'Map data: &copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors, <a href="http://viewfinderpanoramas.org">SRTM</a> | Map style: &copy; <a href="https://opentopomap.org">OpenTopoMap</a> (<a href="https://creativecommons.org/licenses/by-sa/3.0/">CC-BY-SA</a>)',
  },
  dark: {
    // OSM no requiere API key. El filtro CSS convierte sus teselas claras en
    // una apariencia oscura sin depender de un proveedor con autenticación.
    url: 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',
    attribution:
      '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
    className: 'dark-map-tiles',
  },
}

type MapMarker = MapEntity & { type: FilterCategory }

const getMarkerKey = (item: MapMarker) => `${item.type}-${item.nombre}`

const formatDuracionOSRM = (seconds: number) => {
  const totalMinutes = Math.max(1, Math.round(seconds / 60))
  const hours = Math.floor(totalMinutes / 60)
  const minutes = totalMinutes % 60
  if (hours > 0) return `${hours}h ${minutes}min`
  return `${minutes}min`
}

interface RouteInfo {
  tiempo: string
  distancia: number
  duracion?: number
}

interface NavigationRouteOption extends RouteInfo {
  id: number
  label: string
  coordinates: LatLngTuple[]
}

interface OsrmRouteRaw {
  coordinates: LatLngTuple[]
  distancia: number
  duracion: number
}

const NAVIGATION_ROUTE_LABELS = ['Más corta', 'Alternativa 2', 'Alternativa 3'] as const

const parseOsrmRoute = (route: {
  geometry: { coordinates: [number, number][] }
  distance: number
  duration: number
}): OsrmRouteRaw => ({
  coordinates: route.geometry.coordinates.map((coord) => [coord[1], coord[0]]),
  distancia: route.distance / 1000,
  duracion: route.duration,
})

const getOffsetWaypoint = (
  start: LatLngTuple,
  end: LatLngTuple,
  side: 'left' | 'right',
  offset = 0.004
): LatLngTuple => {
  const midLat = (start[0] + end[0]) / 2
  const midLng = (start[1] + end[1]) / 2
  const dLat = end[0] - start[0]
  const dLng = end[1] - start[1]
  const len = Math.hypot(dLat, dLng) || 1
  const sign = side === 'left' ? 1 : -1
  return [midLat + sign * (-dLng / len) * offset, midLng + sign * (dLat / len) * offset]
}

const areRoutesSimilar = (a: OsrmRouteRaw, b: OsrmRouteRaw) =>
  Math.abs(a.distancia - b.distancia) < 0.12

const dedupeOsrmRoutes = (routes: OsrmRouteRaw[]): OsrmRouteRaw[] => {
  const sorted = [...routes].sort((a, b) => a.distancia - b.distancia)
  const unique: OsrmRouteRaw[] = []
  for (const route of sorted) {
    if (!unique.some((existing) => areRoutesSimilar(existing, route))) {
      unique.push(route)
    }
  }
  return unique
}

const buildNavigationOptions = (
  routes: OsrmRouteRaw[],
  calcTimeFallback: (km: number) => string
): NavigationRouteOption[] =>
  dedupeOsrmRoutes(routes)
    .slice(0, 3)
    .map((route, index) => ({
      id: index,
      label: NAVIGATION_ROUTE_LABELS[index] ?? `Alternativa ${index + 1}`,
      coordinates: route.coordinates,
      distancia: route.distancia,
      duracion: route.duracion,
      tiempo: route.duracion
        ? formatDuracionOSRM(route.duracion)
        : calcTimeFallback(route.distancia),
    }))

function RouteNavigationControls({
  isLoading,
  isActive,
  routeOptions,
  selectedRouteIndex,
  onNavigate,
  onClearRoute,
  onSelectRoute,
}: {
  isLoading: boolean
  isActive: boolean
  routeOptions: NavigationRouteOption[]
  selectedRouteIndex: number
  onNavigate: () => void
  onClearRoute: () => void
  onSelectRoute: (index: number) => void
}) {
  if (isLoading) {
    return <p className="entity-route-status">Calculando rutas...</p>
  }

  if (isActive && routeOptions.length > 0) {
    return (
      <>
        <p className="entity-route-picker-title">Elige una ruta:</p>
        <div className="entity-route-picker">
          {routeOptions.map((option, index) => (
            <button
              key={option.id}
              type="button"
              className={`entity-route-option${selectedRouteIndex === index ? ' is-active' : ''}`}
              onMouseDown={(e) => e.stopPropagation()}
              onClick={(e) => {
                e.preventDefault()
                e.stopPropagation()
                onSelectRoute(index)
              }}
            >
              <span className="entity-route-option-label">{option.label}</span>
              <span className="entity-route-option-meta">
                {option.tiempo} · {option.distancia.toFixed(2)} km
              </span>
            </button>
          ))}
        </div>
        <button
          type="button"
          className="pin-navigate-button pin-navigate-button-secondary"
          onMouseDown={(e) => e.stopPropagation()}
          onClick={(e) => {
            e.preventDefault()
            e.stopPropagation()
            onClearRoute()
          }}
        >
          Ocultar rutas
        </button>
      </>
    )
  }

  return (
    <button
      type="button"
      className="pin-navigate-button"
      onMouseDown={(e) => e.stopPropagation()}
      onClick={(e) => {
        e.preventDefault()
        e.stopPropagation()
        onNavigate()
      }}
    >
      Cómo llegar
    </button>
  )
}

interface EntityLink {
  label: string
  url: string
  icon: SocialIconType
}

const normalizeExternalUrl = (value: unknown): string | null => {
  if (typeof value !== 'string') return null

  const url = value.trim()
  return /^https?:\/\//i.test(url) ? url : null
}

const getSocialIcon = (name: string, url: string): SocialIconType => {
  const searchableValue = `${name} ${url}`.toLowerCase()

  if (searchableValue.includes('instagram') || searchableValue.includes('/ig')) {
    return FaInstagram
  }
  if (searchableValue.includes('facebook') || searchableValue.includes('fb')) {
    return FaFacebook
  }
  if (searchableValue.includes('youtube')) {
    return FaYoutube
  }
  if (searchableValue.includes('whatsapp')) {
    return FaWhatsapp
  }
  if (searchableValue.includes('tiktok')) {
    return FaTiktok
  }
  if (searchableValue.includes('linkedin')) {
    return FaLinkedin
  }
  if (searchableValue.includes('twitter') || searchableValue.includes('/x')) {
    return FaTwitter
  }

  return FiLink
}

const getEntityLinks = (item: MapMarker): EntityLink[] => {
  const links: EntityLink[] = []
  const paginaWeb = normalizeExternalUrl(item.paginaWeb)

  if (paginaWeb) {
    links.push({ label: 'Página web', url: paginaWeb, icon: FiGlobe })
  }

  for (const redSocial of item.redesSociales ?? []) {
    const url = normalizeExternalUrl(redSocial.url)
    if (url) {
      links.push({
        label: redSocial.nombre.trim() || 'Red social',
        url,
        icon: getSocialIcon(redSocial.nombre, url),
      })
    }
  }

  return links
}

// Custom icons com SVG profissionais
const createCustomIcon = (iconType: IconType, color: string) => {
  return L.divIcon({
    html: `
      <div style="
        background: linear-gradient(135deg, ${color} 0%, ${color}dd 100%);
        width: 38px;
        height: 38px;
        border-radius: 50%;
        display: flex;
        align-items: center;
        justify-content: center;
        border: 3px solid white;
        box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3), 0 2px 4px rgba(0, 0, 0, 0.2);
        transition: all 0.2s ease;
      ">
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" style="filter: drop-shadow(0 1px 2px rgba(0,0,0,0.3));">
          ${getIconSVGPath(iconType)}
        </svg>
      </div>
    `,
    className: 'custom-marker',
    iconSize: [38, 38],
    iconAnchor: [19, 19]
  })
}

// Iconos para veículos (emojis de carros)
const createVehiculoIcon = (tipo: string) => {
  const iconos = {
    policia: '🚓',
    ambulancia: '🚑',
    bombeiros: '🚒'
  }
  const colores = {
    policia: '#0077b6',
    ambulancia: '#ff0000',
    bombeiros: '#ff8800'
  }
  return L.divIcon({
    html: `<div style="background-color: ${colores[tipo]}; color: white; width: 35px; height: 35px; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-size: 20px; border: 3px solid white; box-shadow: 0 2px 8px rgba(0,0,0,0.4); transform: rotate(0deg); transition: transform 0.1s;">${iconos[tipo]}</div>`,
    className: 'vehiculo-marker',
    iconSize: [35, 35],
    iconAnchor: [17, 17]
  })
}

function createUserLocationIcon() {
  return L.divIcon({
    html: `
      <div class="user-location-marker" aria-hidden="true">
        <span class="user-location-pulse"></span>
        <span class="user-location-dot"></span>
      </div>
    `,
    className: 'user-location-icon',
    iconSize: [44, 44],
    iconAnchor: [22, 22],
  })
}

const getIconForFilter = (filter: FilterCategory) => {
  const config = ENTITY_LEGEND[filter]
  if (config) {
    return createCustomIcon(config.icon, config.color)
  }
  
  // Ícone padrão profissional
  return L.divIcon({
    html: `
      <div style="
        background: linear-gradient(135deg, #64748b 0%, #475569 100%);
        width: 38px;
        height: 38px;
        border-radius: 50%;
        display: flex;
        align-items: center;
        justify-content: center;
        border: 3px solid white;
        box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3), 0 2px 4px rgba(0, 0, 0, 0.2);
      ">
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" style="filter: drop-shadow(0 1px 2px rgba(0,0,0,0.3));">
          ${getIconSVGPath('pin')}
        </svg>
      </div>
    `,
    className: 'custom-marker',
    iconSize: [38, 38],
    iconAnchor: [19, 19]
  })
}

// Componente para veículo animado
function VehiculoAnimado({ vehiculo, onLlegada, mostrarRuta, onToggleRuta, isMobile }) {
  // Sempre chamar todos os hooks antes de qualquer retorno antecipado
  const [posicion, setPosicion] = useState(vehiculo.posicionInicial || [0, 0])
  const [status, setStatus] = useState('En movimiento')
  const [coordenadasRuta, setCoordenadasRuta] = useState([])
  const markerRef = useRef(null)
  const tooltipRef = useRef(null)
  const animationRef = useRef(null)
  const indiceRef = useRef(0)
  const progresoRef = useRef(0)
  const ultimaActualizacionRef = useRef(Date.now())
  const coordenadasCompletasRef = useRef([])
  const animacaoIniciadaRef = useRef(false)

  // Atualizar posição do marker quando posicion muda
  useEffect(() => {
    if (markerRef.current && posicion) {
      const marker = getLeafletLayer(markerRef.current)
      if (marker && marker.setLatLng) {
        marker.setLatLng(posicion)
      }
    }
  }, [posicion])

  // Gestionar estado del popup para ocultar tooltip cuando popup está abierto
  useEffect(() => {
    if (markerRef.current) {
      const marker = markerRef.current
      const leafletMarker = getLeafletLayer(marker)
      
      if (leafletMarker) {
        const handlePopupOpen = () => {
          // Fechar o tooltip quando o popup abre
          if (tooltipRef.current) {
            const tooltip = tooltipRef.current
            const leafletTooltip = getLeafletLayer(tooltip)
            if (leafletTooltip && leafletTooltip.close) {
              leafletTooltip.close()
            }
          }
          // Toggle da rota quando o popup abre (ao clicar no veículo)
          if (onToggleRuta) {
            console.log('Popup aberto, toggle rota para:', vehiculo.id)
            onToggleRuta(vehiculo.id)
          }
        }
        
        leafletMarker.on('popupopen', handlePopupOpen)
        
        return () => {
          leafletMarker.off('popupopen', handlePopupOpen)
        }
      }
    }
  }, [onToggleRuta, vehiculo.id])

  useEffect(() => {
    if (!vehiculo.activo || !vehiculo.coordenadas || vehiculo.coordenadas.length === 0) {
      // Cancelar animación si el vehículo no está activo
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current)
        animationRef.current = null
      }
      animacaoIniciadaRef.current = false
      console.log(`Veículo ${vehiculo.id} não está ativo ou não tem coordenadas`)
      return
    }

    // Se a animação já está rodando (verificar se há um frame ativo), não reiniciar
    if (animationRef.current !== null) {
      console.log(`Vehículo ${vehiculo.id} ya está animando, continuando...`)
      return
    }

    // Marcar que la animación fue iniciada
    animacaoIniciadaRef.current = true

    console.log(`Iniciando animação do veículo ${vehiculo.id} (${vehiculo.tipo}) na rota ${vehiculo.rutaId + 1}`)
    console.log(`Coordenadas: ${vehiculo.coordenadas.length} pontos`)
    console.log(`Punto A:`, vehiculo.posicionInicial)
    console.log(`Punto B:`, vehiculo.puntoB)

    // Garantir que as coordenadas começam no ponto A e terminam no ponto B
    let coordenadas = [...vehiculo.coordenadas]
    
    // Verificar si la primera coordenada es el punto A (con tolerancia)
    const distanciaInicial = Math.sqrt(
      Math.pow(coordenadas[0][0] - vehiculo.posicionInicial[0], 2) +
      Math.pow(coordenadas[0][1] - vehiculo.posicionInicial[1], 2)
    )
    
    // Se a primeira coordenada não é o ponto A, adicionar o ponto A no início
    if (distanciaInicial > 0.001) {
      coordenadas = [vehiculo.posicionInicial, ...coordenadas]
    }
    
    // Verificar si la última coordenada es el punto B (si hay puntoB definido)
    if (vehiculo.puntoB) {
      const ultimaCoord = coordenadas[coordenadas.length - 1]
      const distanciaFinal = Math.sqrt(
        Math.pow(ultimaCoord[0] - vehiculo.puntoB[0], 2) +
        Math.pow(ultimaCoord[1] - vehiculo.puntoB[1], 2)
      )
      
      // Se a última coordenada não é o ponto B, adicionar o ponto B no final
      if (distanciaFinal > 0.001) {
        coordenadas = [...coordenadas, vehiculo.puntoB]
      }
    }
    
    coordenadasCompletasRef.current = coordenadas
    console.log(`Coordenadas completas: ${coordenadas.length} pontos`)
    
    // Atualizar coordenadas da rota para exibição
    setCoordenadasRuta(coordenadas)

    // Resetear estado de animación - comenzar exactamente en el punto A
    indiceRef.current = 0
    progresoRef.current = 0
    setPosicion(vehiculo.posicionInicial)
    setStatus('Em movimento')
    ultimaActualizacionRef.current = Date.now()
    
    console.log(`Veículo ${vehiculo.id} posicionado no ponto A e iniciando movimento`)

    // Velocidad mucho más rápida para simular vehículo real
    // Aumentado significativamente para movimiento visible y rápido
    const velocidad = 0.008 // Velocidad duplicada (0.0015 * 2)

    const animar = () => {
      const ahora = Date.now()
      const deltaTime = (ahora - ultimaActualizacionRef.current) / 16.67 // normalizado para ~60fps
      ultimaActualizacionRef.current = ahora

      if (indiceRef.current >= coordenadasCompletasRef.current.length - 1) {
        // Llegó al destino (ponto B)
        const puntoB = vehiculo.puntoB || coordenadasCompletasRef.current[coordenadasCompletasRef.current.length - 1]
        setPosicion(puntoB)
        setStatus('Llegó al destino')
        if (onLlegada) {
          onLlegada(vehiculo.id)
        }
        return
      }

      const puntoActual = coordenadasCompletasRef.current[indiceRef.current]
      const puntoSiguiente = coordenadasCompletasRef.current[indiceRef.current + 1]

      if (!puntoActual || !puntoSiguiente) {
        return
      }

      // Calcular distancia entre pontos para velocidade adaptativa
      const distancia = Math.sqrt(
        Math.pow(puntoSiguiente[0] - puntoActual[0], 2) +
        Math.pow(puntoSiguiente[1] - puntoActual[1], 2)
      )

      // Calcular progreso basado en velocidad (mais rápido)
      // Usar velocidade baseada em distância para movimento mais suave
      const velocidadAdaptativa = velocidad * (1 + distancia * 10) // Aumentar velocidade em segmentos longos
      progresoRef.current += velocidadAdaptativa * Math.max(deltaTime, 0.1)

      if (progresoRef.current >= 1) {
        // Pasar al siguiente segmento
        indiceRef.current++
        progresoRef.current = 0
        if (indiceRef.current < coordenadasCompletasRef.current.length) {
          const nuevaPos = coordenadasCompletasRef.current[indiceRef.current]
          setPosicion(nuevaPos)
          // Atualizar marker diretamente
          if (markerRef.current) {
            const marker = getLeafletLayer(markerRef.current)
            if (marker && marker.setLatLng) {
              marker.setLatLng(nuevaPos)
            }
          }
        }
      } else {
        // Interpolar posición suavemente
        const nuevaLat = puntoActual[0] + (puntoSiguiente[0] - puntoActual[0]) * progresoRef.current
        const nuevaLng = puntoActual[1] + (puntoSiguiente[1] - puntoActual[1]) * progresoRef.current
        const nuevaPosicion = [nuevaLat, nuevaLng]
        setPosicion(nuevaPosicion)
        
        // Atualizar posição do marker diretamente via Leaflet para movimento suave
        if (markerRef.current) {
          const marker = getLeafletLayer(markerRef.current)
          if (marker && marker.setLatLng) {
            marker.setLatLng(nuevaPosicion)
          }
        }
      }

      // Actualizar rotación del ícone basado en dirección
      if (markerRef.current && indiceRef.current < coordenadasCompletasRef.current.length - 1) {
        const marker = getLeafletLayer(markerRef.current)
        if (marker && marker._icon) {
          const dx = puntoSiguiente[1] - puntoActual[1]
          const dy = puntoSiguiente[0] - puntoActual[0]
          const angulo = Math.atan2(dy, dx) * (180 / Math.PI)
          marker._icon.style.transform = `rotate(${angulo + 90}deg)`
          marker._icon.style.transition = 'transform 0.1s ease-out'
        }
      }

      animationRef.current = requestAnimationFrame(animar)
    }

    // Iniciar animação imediatamente
    animationRef.current = requestAnimationFrame(animar)

    return () => {
      // Não cancelar a animação aqui, apenas limpar quando o componente for desmontado
      // ou quando o veículo for explicitamente desativado
    }
  }, [vehiculo.activo, vehiculo.coordenadas, vehiculo.id, onLlegada])

  // Cleanup quando o veículo é desativado ou componente desmontado
  useEffect(() => {
    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current)
        animationRef.current = null
      }
      animacaoIniciadaRef.current = false
    }
  }, [])

  // Sempre renderizar o veículo se estiver ativo, mesmo antes da animação começar
  if (!vehiculo.activo) {
    return null
  }

  // Garantizar que la posición inicial sea siempre el punto A
  const posicionFinal = posicion && posicion.length === 2 && posicion[0] !== 0 && posicion[1] !== 0 
    ? posicion 
    : vehiculo.posicionInicial

  // Efeito para calcular coordenadas da rota quando o veículo muda
  useEffect(() => {
    // Primeiro tentar usar as coordenadas completas do ref (se a animação já começou)
    if (coordenadasCompletasRef.current.length > 0) {
      setCoordenadasRuta(coordenadasCompletasRef.current)
      return
    }
    
    // Caso contrário, usar as coordenadas do veículo e garantir que incluem ponto A e B
    if (vehiculo.coordenadas && vehiculo.coordenadas.length > 0) {
      let coords = [...vehiculo.coordenadas]
      
      // Garantir que começa no ponto A
      if (vehiculo.posicionInicial && coords.length > 0) {
        const distanciaInicial = Math.sqrt(
          Math.pow(coords[0][0] - vehiculo.posicionInicial[0], 2) +
          Math.pow(coords[0][1] - vehiculo.posicionInicial[1], 2)
        )
        if (distanciaInicial > 0.001) {
          coords = [vehiculo.posicionInicial, ...coords]
        }
      } else if (vehiculo.posicionInicial && coords.length === 0) {
        coords = [vehiculo.posicionInicial]
      }
      
      // Garantir que termina no ponto B
      if (vehiculo.puntoB && coords.length > 0) {
        const ultimaCoord = coords[coords.length - 1]
        const distanciaFinal = Math.sqrt(
          Math.pow(ultimaCoord[0] - vehiculo.puntoB[0], 2) +
          Math.pow(ultimaCoord[1] - vehiculo.puntoB[1], 2)
        )
        if (distanciaFinal > 0.001) {
          coords = [...coords, vehiculo.puntoB]
        }
      } else if (vehiculo.puntoB && coords.length === 0) {
        coords = [vehiculo.puntoB]
      }
      
      setCoordenadasRuta(coords)
    } else if (vehiculo.posicionInicial && vehiculo.puntoB) {
      // Se não há coordenadas, criar uma rota mínima do ponto A ao B
      setCoordenadasRuta([vehiculo.posicionInicial, vehiculo.puntoB])
    } else {
      setCoordenadasRuta([])
    }
  }, [vehiculo.coordenadas, vehiculo.posicionInicial, vehiculo.puntoB])

  // Cor da rota baseada no tipo de veículo
  const colorRuta = vehiculo.tipo === 'policia' ? '#0077b6' : vehiculo.tipo === 'ambulancia' ? '#ff0000' : '#ff8800'

  return (
    <>
      {mostrarRuta && coordenadasRuta.length > 0 && (
        <Polyline
          key={`ruta-${vehiculo.id}-${vehiculo.rutaId}`}
          positions={coordenadasRuta}
          color={colorRuta}
          weight={4}
          opacity={0.8}
          lineCap="round"
          lineJoin="round"
          smoothFactor={1}
        />
      )}
      <Marker
        position={posicionFinal}
        icon={createVehiculoIcon(vehiculo.tipo)}
        ref={markerRef}
        eventHandlers={{
          click: (e) => {
            // Prevenir propagação para não interferir com o popup
            if (e.originalEvent) {
              e.originalEvent.stopPropagation()
            }
            // Toggle da rota deste veículo específico
            if (onToggleRuta) {
              console.log('Toggle rota para veículo:', vehiculo.id, 'Coordenadas:', coordenadasRuta.length)
              onToggleRuta(vehiculo.id)
            }
            // O popup será aberto automaticamente pelo Leaflet
          }
        }}
      >
        {!isMobile && (
          <Tooltip 
            ref={tooltipRef}
            permanent={false} 
            direction="top" 
            offset={[0, -10]}
            interactive={false}
          >
            <div style={{ textAlign: 'center' }}>
              <strong style={{ display: 'block', marginBottom: '4px' }}>
                {vehiculo.tipo === 'policia' ? '🚓 Viatura de Polícia' : vehiculo.tipo === 'ambulancia' ? '🚑 Ambulância' : '🚒 Bombeiros'}
              </strong>
              <p style={{ margin: '2px 0', fontSize: '12px' }}>
                <strong>Condutor:</strong> {vehiculo.motorista || 'Não informado'}
              </p>
              <p style={{ margin: '2px 0', fontSize: '12px' }}>
                <strong>Estado:</strong> {vehiculo.status || 'Patrullando'}
              </p>
            </div>
          </Tooltip>
        )}
        <Popup>
          <div style={{ minWidth: '200px' }}>
            <strong style={{ fontSize: '16px', display: 'block', marginBottom: '8px' }}>
              {vehiculo.tipo === 'policia' ? '🚓 Viatura de Polícia' : vehiculo.tipo === 'ambulancia' ? '🚑 Ambulância' : '🚒 Bombeiros'}
            </strong>
            <p style={{ margin: '4px 0' }}><strong>Conductor:</strong> {vehiculo.motorista || 'No informado'}</p>
            <p style={{ margin: '4px 0' }}><strong>Estado:</strong> {vehiculo.status || 'Patrullando'}</p>
            <p style={{ margin: '4px 0' }}><strong>Movimiento:</strong> {status}</p>
            <hr style={{ margin: '8px 0', border: 'none', borderTop: '1px solid #ddd' }} />
            <p style={{ margin: '4px 0' }}><strong>Ruta:</strong> {vehiculo.rutaId !== undefined ? vehiculo.rutaId + 1 : 'N/A'}</p>
            <p style={{ margin: '4px 0' }}>Ponto A: {vehiculo.posicionInicial[0].toFixed(6)}, {vehiculo.posicionInicial[1].toFixed(6)}</p>
            {vehiculo.puntoB && (
              <p style={{ margin: '4px 0' }}>Ponto B: {vehiculo.puntoB[0].toFixed(6)}, {vehiculo.puntoB[1].toFixed(6)}</p>
            )}
            <p style={{ margin: '4px 0', fontSize: '12px', color: '#666', fontStyle: 'italic' }}>
              💡 Clique no veículo para ver/ocultar a rota
            </p>
          </div>
        </Popup>
      </Marker>
    </>
  )
}

// Componente para veículo com rota salva (rota visível apenas no click)
function VehiculoConRutaSalva({ vehiculo, onLlegada, mostrarRuta, onToggleRuta, isMobile }) {
  const [posicion, setPosicion] = useState(vehiculo.posicionInicial || [0, 0])
  const [status, setStatus] = useState('En movimiento')
  const markerRef = useRef(null)
  const tooltipRef = useRef(null)
  const animationRef = useRef(null)
  const indiceRef = useRef(0)
  const progresoRef = useRef(0)
  const ultimaActualizacionRef = useRef(Date.now())
  const coordenadasCompletasRef = useRef([])
  const animacaoIniciadaRef = useRef(false)
  const rutaIdAnteriorRef = useRef(vehiculo.rutaId)

  // Atualizar posição do marker quando posicion muda
  useEffect(() => {
    if (markerRef.current && posicion) {
      const marker = getLeafletLayer(markerRef.current)
      if (marker && marker.setLatLng) {
        marker.setLatLng(posicion)
      }
    }
  }, [posicion])

  // Gestionar estado del popup para ocultar tooltip cuando popup está abierto
  useEffect(() => {
    if (markerRef.current) {
      const marker = markerRef.current
      const leafletMarker = getLeafletLayer(marker)
      
      if (leafletMarker) {
        const handlePopupOpen = () => {
          // Fechar o tooltip quando o popup abre
          if (tooltipRef.current) {
            const tooltip = tooltipRef.current
            const leafletTooltip = getLeafletLayer(tooltip)
            if (leafletTooltip && leafletTooltip.close) {
              leafletTooltip.close()
            }
          }
        }
        
        leafletMarker.on('popupopen', handlePopupOpen)
        
        return () => {
          leafletMarker.off('popupopen', handlePopupOpen)
        }
      }
    }
  }, [])

  useEffect(() => {
    if (!vehiculo.activo || !vehiculo.coordenadas || vehiculo.coordenadas.length === 0) {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current)
        animationRef.current = null
      }
      animacaoIniciadaRef.current = false
      return
    }

    // Se a rota mudou, reiniciar a animação
    if (rutaIdAnteriorRef.current !== vehiculo.rutaId) {
      // Cancelar animação anterior se existir
      if (animationRef.current !== null) {
        cancelAnimationFrame(animationRef.current)
        animationRef.current = null
      }
      animacaoIniciadaRef.current = false
      rutaIdAnteriorRef.current = vehiculo.rutaId
    }
    
    // Se a animação já está rodando e a rota não mudou, continuar
    if (animationRef.current !== null && animacaoIniciadaRef.current) {
      return
    }

    animacaoIniciadaRef.current = true

    let coordenadas = [...vehiculo.coordenadas]
    
    const distanciaInicial = Math.sqrt(
      Math.pow(coordenadas[0][0] - vehiculo.posicionInicial[0], 2) +
      Math.pow(coordenadas[0][1] - vehiculo.posicionInicial[1], 2)
    )
    
    if (distanciaInicial > 0.001) {
      coordenadas = [vehiculo.posicionInicial, ...coordenadas]
    }
    
    if (vehiculo.puntoB) {
      const ultimaCoord = coordenadas[coordenadas.length - 1]
      const distanciaFinal = Math.sqrt(
        Math.pow(ultimaCoord[0] - vehiculo.puntoB[0], 2) +
        Math.pow(ultimaCoord[1] - vehiculo.puntoB[1], 2)
      )
      
      if (distanciaFinal > 0.001) {
        coordenadas = [...coordenadas, vehiculo.puntoB]
      }
    }
    
    coordenadasCompletasRef.current = coordenadas

    indiceRef.current = 0
    progresoRef.current = 0
    setPosicion(vehiculo.posicionInicial)
    setStatus('Em movimento')
    ultimaActualizacionRef.current = Date.now()

    // Velocidade constante (ajustada para movimento suave e visível)
    const velocidad = 0.005

    const animar = () => {
      const ahora = Date.now()
      const deltaTime = Math.min((ahora - ultimaActualizacionRef.current) / 16.67, 2) // Limitar deltaTime para evitar saltos
      ultimaActualizacionRef.current = ahora

      if (indiceRef.current >= coordenadasCompletasRef.current.length - 1) {
        const puntoB = vehiculo.puntoB || coordenadasCompletasRef.current[coordenadasCompletasRef.current.length - 1]
        setPosicion(puntoB)
        setStatus('Llegó al destino')
        if (onLlegada) {
          onLlegada(vehiculo.id, vehiculo)
        }
        return
      }

      const puntoActual = coordenadasCompletasRef.current[indiceRef.current]
      const puntoSiguiente = coordenadasCompletasRef.current[indiceRef.current + 1]

      if (!puntoActual || !puntoSiguiente) {
        return
      }

      // Velocidade constante - não varia com a distância
      progresoRef.current += velocidad * Math.max(deltaTime, 0.1)

      if (progresoRef.current >= 1) {
        indiceRef.current++
        progresoRef.current = 0
        if (indiceRef.current < coordenadasCompletasRef.current.length) {
          const nuevaPos = coordenadasCompletasRef.current[indiceRef.current]
          setPosicion(nuevaPos)
          if (markerRef.current) {
            const marker = getLeafletLayer(markerRef.current)
            if (marker && marker.setLatLng) {
              marker.setLatLng(nuevaPos)
            }
          }
        }
      } else {
        const nuevaLat = puntoActual[0] + (puntoSiguiente[0] - puntoActual[0]) * progresoRef.current
        const nuevaLng = puntoActual[1] + (puntoSiguiente[1] - puntoActual[1]) * progresoRef.current
        const nuevaPosicion = [nuevaLat, nuevaLng]
        setPosicion(nuevaPosicion)
        
        if (markerRef.current) {
          const marker = getLeafletLayer(markerRef.current)
          if (marker && marker.setLatLng) {
            marker.setLatLng(nuevaPosicion)
          }
        }
      }

      if (markerRef.current && indiceRef.current < coordenadasCompletasRef.current.length - 1) {
        const marker = getLeafletLayer(markerRef.current)
        if (marker && marker._icon) {
          const dx = puntoSiguiente[1] - puntoActual[1]
          const dy = puntoSiguiente[0] - puntoActual[0]
          const angulo = Math.atan2(dy, dx) * (180 / Math.PI)
          marker._icon.style.transform = `rotate(${angulo + 90}deg)`
          marker._icon.style.transition = 'transform 0.1s ease-out'
        }
      }

      animationRef.current = requestAnimationFrame(animar)
    }

    animationRef.current = requestAnimationFrame(animar)

    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current)
        animationRef.current = null
      }
      animacaoIniciadaRef.current = false
    }
  }, [vehiculo.activo, vehiculo.coordenadas, vehiculo.id, vehiculo.rutaId, onLlegada])

  useEffect(() => {
    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current)
        animationRef.current = null
      }
      animacaoIniciadaRef.current = false
    }
  }, [])


  if (!vehiculo.activo) {
    return null
  }

  const posicionFinal = posicion && posicion.length === 2 && posicion[0] !== 0 && posicion[1] !== 0 
    ? posicion 
    : vehiculo.posicionInicial

  // Mostrar rota apenas se este veículo específico estiver marcado (clicado)
  const rutaVisible = mostrarRuta

  return (
    <>
      {rutaVisible && vehiculo.rutaOriginal && (
        <Polyline
          key={`ruta-${vehiculo.id}-${vehiculo.rutaId}`}
          positions={vehiculo.rutaOriginal.coordinates}
          color={vehiculo.rutaOriginal.color}
          weight={3}
          opacity={0.6}
          lineCap="round"
          lineJoin="round"
          smoothFactor={1}
        />
      )}
      <Marker
        position={posicionFinal}
        icon={createVehiculoIcon(vehiculo.tipo)}
        ref={markerRef}
        eventHandlers={{
          click: (e) => {
            // Toggle da rota deste veículo específico
            if (onToggleRuta) {
              onToggleRuta(vehiculo.id)
            }
            // O popup será aberto automaticamente pelo Leaflet
          }
        }}
      >
        {!isMobile && (
          <Tooltip 
            ref={tooltipRef}
            permanent={false} 
            direction="top" 
            offset={[0, -10]}
            interactive={false}
          >
            <div style={{ textAlign: 'center' }}>
              <strong style={{ display: 'block', marginBottom: '4px' }}>
                {vehiculo.tipo === 'policia' ? '🚓 Viatura de Polícia' : vehiculo.tipo === 'ambulancia' ? '🚑 Ambulância' : '🚒 Bombeiros'}
              </strong>
              <p style={{ margin: '2px 0', fontSize: '12px' }}>
                <strong>Condutor:</strong> {vehiculo.motorista || 'Não informado'}
              </p>
              <p style={{ margin: '2px 0', fontSize: '12px' }}>
                <strong>Estado:</strong> {vehiculo.status || 'Patrullando'}
              </p>
            </div>
          </Tooltip>
        )}
        <Popup>
          <div style={{ minWidth: '200px' }}>
            <strong style={{ fontSize: '16px', display: 'block', marginBottom: '8px' }}>
              {vehiculo.tipo === 'policia' ? '🚓 Viatura de Polícia' : vehiculo.tipo === 'ambulancia' ? '🚑 Ambulância' : '🚒 Bombeiros'}
            </strong>
            <p style={{ margin: '4px 0' }}><strong>Condutor:</strong> {vehiculo.motorista || 'Não informado'}</p>
            <p style={{ margin: '4px 0' }}><strong>Status:</strong> {vehiculo.status || 'Patrulhando'}</p>
            <p style={{ margin: '4px 0' }}><strong>Movimento:</strong> {status}</p>
            <hr style={{ margin: '8px 0', border: 'none', borderTop: '1px solid #ddd' }} />
            <p style={{ margin: '4px 0' }}><strong>Ruta:</strong> {vehiculo.rutaId !== undefined ? vehiculo.rutaId + 1 : 'N/A'}</p>
            {vehiculo.rutaOriginal && (
              <>
                <p style={{ margin: '4px 0' }}><strong>Distancia:</strong> {vehiculo.rutaOriginal.distancia.toFixed(2)} km</p>
                <p style={{ margin: '4px 0' }}><strong>Tiempo estimado:</strong> {vehiculo.rutaOriginal.tiempo}</p>
              </>
            )}
          </div>
        </Popup>
      </Marker>
    </>
  )
}

function MapUpdater({ zoom, targetZoom, setZoom, setTargetZoom, updatingZoom, setUpdatingZoom, minZoom }) {
  const map = useMap()

  useEffect(() => {
    if (map) {
      map.setMinZoom(minZoom)
    }
  }, [map, minZoom])

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

function MarkerWithTooltip({
  item,
  isMobile,
  canNavigate,
  isActiveDestination,
  isLoadingRoute,
  routeOptions,
  selectedRouteIndex,
  onNavigate,
  onClearRoute,
  onSelectRoute,
}: {
  item: MapMarker
  isMobile: boolean
  canNavigate: boolean
  isActiveDestination: boolean
  isLoadingRoute: boolean
  routeOptions: NavigationRouteOption[]
  selectedRouteIndex: number
  onNavigate: () => void
  onClearRoute: () => void
  onSelectRoute: (index: number) => void
}) {
  const markerRef = useRef(null)
  const tooltipRef = useRef(null)
  
  useEffect(() => {
    if (markerRef.current) {
      const marker = markerRef.current
      const leafletMarker = getLeafletLayer(marker)
      
      if (leafletMarker) {
        const handlePopupOpen = () => {
          // Cerrar el tooltip cuando se abre el popup
          if (tooltipRef.current) {
            const tooltip = tooltipRef.current
            const leafletTooltip = getLeafletLayer(tooltip)
            if (leafletTooltip && leafletTooltip.close) {
              leafletTooltip.close()
            }
          }
        }
        
        leafletMarker.on('popupopen', handlePopupOpen)
        
        return () => {
          leafletMarker.off('popupopen', handlePopupOpen)
        }
      }
    }
  }, [])
  
  const entityLinks = getEntityLinks(item)

  return (
    <Marker
      position={[item.lat, item.lng]}
      icon={getIconForFilter(item.type)}
      ref={markerRef}
    >
      {!isMobile && (
        <Tooltip 
          ref={tooltipRef}
          direction="top" 
          permanent={false} 
          interactive={false}
          offset={[0, -10]}
        >
          <div>
            <h3 style={{ margin: '0 0 5px 0', fontSize: '14px' }}>{item.nombre}</h3>
            <p style={{ margin: '0 0 3px 0', fontSize: '12px' }}><strong>Servicios:</strong> {item.servicios.join(', ')}</p>
            <p style={{ margin: '0', fontSize: '12px' }}><strong>Horarios:</strong> {item.horarios}</p>
          </div>
        </Tooltip>
      )}
      <Popup offset={[0, -10]}>
        <div className={`entity-popup entity-popup-${item.type}`}>
          <svg
            className="entity-popup-watermark"
            viewBox="0 0 24 24"
            fill="none"
            stroke={ENTITY_LEGEND[item.type].color}
            strokeWidth="1.4"
            strokeLinecap="round"
            strokeLinejoin="round"
            aria-hidden="true"
            dangerouslySetInnerHTML={{
              __html: getIconSVGPath(ENTITY_LEGEND[item.type].icon),
            }}
          />
          <div className="entity-popup-content">
            <h3>{item.nombre}</h3>
            <p><strong>Servicios:</strong> {item.servicios.join(', ')}</p>
            <p><strong>Horarios:</strong> {item.horarios}</p>
            {entityLinks.length > 0 && (
              <div className="entity-links">
                <strong>Enlaces:</strong>
                {entityLinks.map((link) => (
                  <a
                    key={`${link.label}-${link.url}`}
                    className="entity-link"
                    href={link.url}
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    <link.icon size={16} aria-hidden="true" />
                    <span>{link.label}</span>
                  </a>
                ))}
              </div>
            )}
            {canNavigate && (
              <div className="entity-navigation">
                <RouteNavigationControls
                  isLoading={isLoadingRoute}
                  isActive={isActiveDestination}
                  routeOptions={isActiveDestination ? routeOptions : []}
                  selectedRouteIndex={selectedRouteIndex}
                  onNavigate={onNavigate}
                  onClearRoute={onClearRoute}
                  onSelectRoute={onSelectRoute}
                />
              </div>
            )}
          </div>
        </div>
      </Popup>
    </Marker>
  )
}

interface MapaProps {
  hideLegend?: boolean
}

function Mapa({ hideLegend = false }: MapaProps) {
  const [customMarker, setCustomMarker] = useState(null)
  const [addingMarker, setAddingMarker] = useState(false)
  const [tiempoMedioMode, setTiempoMedioMode] = useState(false)
  const [puntoA, setPuntoA] = useState(null)
  const [puntoB, setPuntoB] = useState(null)
  const [tiempoMedio, setTiempoMedio] = useState(null)
  const [ruta, setRuta] = useState(null)
  const [cargandoRuta, setCargandoRuta] = useState(false)
  const [opcionesRutaHaciaPin, setOpcionesRutaHaciaPin] = useState<NavigationRouteOption[]>([])
  const [indiceRutaHaciaPin, setIndiceRutaHaciaPin] = useState(0)
  const [destinoNavegacion, setDestinoNavegacion] = useState<{
    key: string
    nombre: string
    lat: number
    lng: number
  } | null>(null)
  const [cargandoRutaHaciaPin, setCargandoRutaHaciaPin] = useState(false)
  const [rutasAleatorias, setRutasAleatorias] = useState([])
  const [cargandoRutasAleatorias, setCargandoRutasAleatorias] = useState(false)
  const [rutasSalvas, setRutasSalvas] = useState([])
  const [cargandoRutasSalvas, setCargandoRutasSalvas] = useState(false)
  const [rutasSalvasCargadasManualmente, setRutasSalvasCargadasManualmente] = useState(false)
  const [vehiculos, setVehiculos] = useState([])
  const [vehiculosActivos, setVehiculosActivos] = useState(false)
  const [vehiculosConRutasSalvas, setVehiculosConRutasSalvas] = useState([])
  const [vehiculosConRutasSalvasActivos, setVehiculosConRutasSalvasActivos] = useState(false)
  const [rutasVisibles, setRutasVisibles] = useState(new Set()) // IDs de veículos cujas rotas estão visíveis
  const [rutasVisiblesAnimados, setRutasVisiblesAnimados] = useState(new Set()) // IDs de veículos animados cujas rotas estão visíveis
  const [rutasUsadasPorVehiculo, setRutasUsadasPorVehiculo] = useState(new Map()) // Mapa de veículoId -> Set de rutaIds usadas
  const [filters, setFilters] = useState<FilterCategory[]>([
    'salud',
    'seguridad',
    'bomberos',
    'gobierno',
  ])
  const [currentMapStyle, setCurrentMapStyle] = useState<MapStyle>('local')
  const [showParroquias, setShowParroquias] = useState(true)
  const [zoom, setZoom] = useState(14)
  const [targetZoom, setTargetZoom] = useState(14)
  const [updatingZoom, setUpdatingZoom] = useState(false)
  const minZoom = getMapMinZoom(currentMapStyle)
  const [mounted, setMounted] = useState(false)
  const [isMobile, setIsMobile] = useState(false)
  const mapRef = useRef<L.Map | null>(null)
  const mapInstanceRef = useRef<L.Map | null>(null)
  const rutasAleatoriasRef = useRef([])
  const userLocationIcon = useMemo(() => createUserLocationIcon(), [])
  const {
    status: locationStatus,
    location: userLocation,
    error: locationError,
    outsideBounds: userOutsideBounds,
  } = useUserLocation(mapInstanceRef)
  const center: LatLngTuple = MAP_CENTER
  const maxBounds: [LatLngTuple, LatLngTuple] = [MAP_BOUNDS_SW, MAP_BOUNDS_NE]
  const accuracyRadius = userLocation
    ? Math.max(20, Math.min(userLocation.accuracy, 1000))
    : 0
  const canNavigateFromLocation = locationStatus === 'tracking' && userLocation !== null
  const rutaHaciaPinActiva = opcionesRutaHaciaPin[indiceRutaHaciaPin]?.coordinates ?? null
  const infoRutaHaciaPinActiva = opcionesRutaHaciaPin[indiceRutaHaciaPin] ?? null

  const clearRutaHaciaPin = useCallback(() => {
    setOpcionesRutaHaciaPin([])
    setIndiceRutaHaciaPin(0)
    setDestinoNavegacion(null)
    setCargandoRutaHaciaPin(false)
  }, [])

  const fitRouteBounds = useCallback((coordinates: LatLngTuple[]) => {
    const map = mapInstanceRef.current
    if (map && coordinates.length > 0) {
      map.fitBounds(L.latLngBounds(coordinates), { padding: [50, 50] })
    }
  }, [])

  const selectRutaHaciaPin = useCallback(
    (index: number) => {
      setIndiceRutaHaciaPin(index)
      const coordinates = opcionesRutaHaciaPin[index]?.coordinates
      if (coordinates) {
        fitRouteBounds(coordinates)
      }
    },
    [fitRouteBounds, opcionesRutaHaciaPin]
  )

  useEffect(() => {
    if (locationStatus === 'idle') {
      clearRutaHaciaPin()
    }
  }, [locationStatus, clearRutaHaciaPin])

  const getCurrentMapStyle = useCallback(() => {
    return mapStyleConfigs[currentMapStyle] || mapStyleConfigs.local
  }, [currentMapStyle])

  useEffect(() => {
    const handleMapStyleChange = (event) => {
      const newStyle = event.detail?.style
      if (newStyle && mapStyleConfigs[newStyle]) {
        const nextMinZoom = getMapMinZoom(newStyle)
        setCurrentMapStyle(newStyle)
        setZoom((current) => Math.max(current, nextMinZoom))
        setTargetZoom((current) => Math.max(current, nextMinZoom))
      }
    }

    window.addEventListener('map-style-changed', handleMapStyleChange)
    return () => window.removeEventListener('map-style-changed', handleMapStyleChange)
  }, [])

  useEffect(() => {
    if (zoom < minZoom) {
      setZoom(minZoom)
      setTargetZoom(minZoom)
    }
  }, [minZoom, zoom])

  // Sincronizar ref com o estado de rutasAleatorias
  useEffect(() => {
    rutasAleatoriasRef.current = rutasAleatorias
  }, [rutasAleatorias])

  // Detectar si es un dispositivo móvil
  useEffect(() => {
    const checkIsMobile = () => {
      // Verificar por user agent
      const userAgent = navigator.userAgent.toLowerCase()
      const mobileKeywords = ['mobile', 'android', 'iphone', 'ipad', 'tablet']
      const isMobileUserAgent = mobileKeywords.some(keyword => userAgent.includes(keyword))
      
      // Verificar por viewport width
      const isMobileViewport = window.innerWidth <= 768
      
      // Verificar por capacidad táctil
      const isTouchDevice = 'ontouchstart' in window || navigator.maxTouchPoints > 0
      
      // Detectar dispositivos que no soportan hover
      const noHover = window.matchMedia('(hover: none)').matches
      
      setIsMobile(isMobileUserAgent || (isMobileViewport && isTouchDevice) || noHover)
    }
    
    checkIsMobile()
    
    // Escuchar cambios de tamaño de ventana
    window.addEventListener('resize', checkIsMobile)
    
    return () => {
      window.removeEventListener('resize', checkIsMobile)
    }
  }, [])

  // Asegurar que el componente solo se monte en el cliente
  useEffect(() => {
    setMounted(true)
  }, [])

  // Función para calcular distancia entre dos puntos (Haversine)
  const calcularDistancia = (lat1, lon1, lat2, lon2) => {
    const R = 6371 // Radio de la Tierra en km
    const dLat = (lat2 - lat1) * Math.PI / 180
    const dLon = (lon2 - lon1) * Math.PI / 180
    const a = 
      Math.sin(dLat/2) * Math.sin(dLat/2) +
      Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
      Math.sin(dLon/2) * Math.sin(dLon/2)
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a))
    return R * c // Distancia en km
  }

  // Función para calcular tiempo medio (asumiendo velocidad promedio de 30 km/h en ciudad)
  const calcularTiempoMedio = (distancia) => {
    const velocidadPromedio = 30 // km/h
    const tiempoHoras = distancia / velocidadPromedio
    const horas = Math.floor(tiempoHoras)
    const minutos = Math.round((tiempoHoras - horas) * 60)
    
    if (horas > 0) {
      return `${horas}h ${minutos}min`
    }
    return `${minutos}min`
  }

  // Función para obtener el punto más cercano en una calle usando OSRM
  const obtenerPuntoEnCalle = async (lat, lon) => {
    try {
      // OSRM nearest service para encontrar el punto más cercano en una calle
      const url = `https://router.project-osrm.org/nearest/v1/driving/${lon},${lat}?number=1`
      
      const response = await fetch(url)
      const data = await response.json()
      
      if (data.code === 'Ok' && data.waypoints && data.waypoints.length > 0) {
        const waypoint = data.waypoints[0]
        // OSRM devuelve [lon, lat], convertir a [lat, lon]
        return [waypoint.location[1], waypoint.location[0]]
      }
      // Si falla, devolver el punto original
      return [lat, lon]
    } catch (error) {
      console.error('Error al obtener punto en calle:', error)
      // Si falla, devolver el punto original
      return [lat, lon]
    }
  }

  // Función para obtener la ruta real usando OSRM
  const obtenerRuta = async (lat1, lon1, lat2, lon2) => {
    try {
      // OSRM usa formato [lon, lat] (longitud primero)
      const url = `https://router.project-osrm.org/route/v1/driving/${lon1},${lat1};${lon2},${lat2}?overview=full&geometries=geojson`
      
      const response = await fetch(url)
      const data = await response.json()
      
      if (data.code === 'Ok' && data.routes && data.routes.length > 0) {
        const route = data.routes[0]
        // Convertir GeoJSON coordinates a formato [lat, lng] para Leaflet
        const coordinates = route.geometry.coordinates.map(coord => [coord[1], coord[0]])
        const distanciaKm = route.distance / 1000 // Convertir metros a kilómetros
        
        return {
          coordinates,
          distancia: distanciaKm,
          duracion: route.duration // en segundos
        }
      }
      return null
    } catch (error) {
      console.error('Error al obtener la ruta:', error)
      return null
    }
  }

  const fetchOsrmRoutesFromCoords = async (
    start: LatLngTuple,
    end: LatLngTuple,
    options?: { alternatives?: number; via?: LatLngTuple; continueStraight?: boolean }
  ): Promise<OsrmRouteRaw[]> => {
    try {
      const coordString = options?.via
        ? `${start[1]},${start[0]};${options.via[1]},${options.via[0]};${end[1]},${end[0]}`
        : `${start[1]},${start[0]};${end[1]},${end[0]}`

      const params = new URLSearchParams({
        overview: 'full',
        geometries: 'geojson',
      })

      if (options?.alternatives) {
        params.set('alternatives', String(options.alternatives))
      }
      if (options?.continueStraight !== undefined) {
        params.set('continue_straight', String(options.continueStraight))
      }

      const url = `https://router.project-osrm.org/route/v1/driving/${coordString}?${params}`
      const response = await fetch(url)
      const data = await response.json()

      if (data.code === 'Ok' && data.routes?.length) {
        return data.routes.map(parseOsrmRoute)
      }
      return []
    } catch (error) {
      console.error('Error al obtener rutas OSRM:', error)
      return []
    }
  }

  const obtenerRutasAlternativas = async (
    lat1: number,
    lon1: number,
    lat2: number,
    lon2: number
  ): Promise<NavigationRouteOption[]> => {
    const [startRaw, endRaw] = await Promise.all([
      obtenerPuntoEnCalle(lat1, lon1),
      obtenerPuntoEnCalle(lat2, lon2),
    ])
    const start = startRaw as LatLngTuple
    const end = endRaw as LatLngTuple

    const collected: OsrmRouteRaw[] = []

    collected.push(...(await fetchOsrmRoutesFromCoords(start, end, { alternatives: 3 })))

    if (dedupeOsrmRoutes(collected).length < 3) {
      collected.push(...(await fetchOsrmRoutesFromCoords(start, end, { continueStraight: false })))
    }

    const offsetSteps = [0.004, 0.007, 0.01]
    for (const offset of offsetSteps) {
      if (dedupeOsrmRoutes(collected).length >= 3) break
      for (const side of ['left', 'right'] as const) {
        if (dedupeOsrmRoutes(collected).length >= 3) break
        const via = getOffsetWaypoint(start, end, side, offset)
        const viaSnapped = (await obtenerPuntoEnCalle(via[0], via[1])) as LatLngTuple
        collected.push(...(await fetchOsrmRoutesFromCoords(start, end, { via: viaSnapped })))
      }
    }

    const options = buildNavigationOptions(collected, calcularTiempoMedio)

    if (options.length > 0) {
      return options
    }

    const distancia = calcularDistancia(lat1, lon1, lat2, lon2)
    return [
      {
        id: 0,
        label: 'Más corta',
        coordinates: [
          [lat1, lon1],
          [lat2, lon2],
        ],
        distancia,
        tiempo: calcularTiempoMedio(distancia),
      },
    ]
  }

  const navigateToPin = async (destino: {
    key: string
    nombre: string
    lat: number
    lng: number
  }) => {
    if (!userLocation) return

    if (destinoNavegacion?.key === destino.key && opcionesRutaHaciaPin.length > 0) {
      const coordinates = opcionesRutaHaciaPin[indiceRutaHaciaPin]?.coordinates
      if (coordinates) {
        fitRouteBounds(coordinates)
      }
      return
    }

    setCargandoRutaHaciaPin(true)
    setDestinoNavegacion(destino)
    setOpcionesRutaHaciaPin([])
    setIndiceRutaHaciaPin(0)

    setPuntoA(null)
    setPuntoB(null)
    setRuta(null)
    setTiempoMedio(null)
    setCargandoRuta(false)

    try {
      const routeOptions = await obtenerRutasAlternativas(
        userLocation.lat,
        userLocation.lng,
        destino.lat,
        destino.lng
      )

      setOpcionesRutaHaciaPin(routeOptions)
      setIndiceRutaHaciaPin(0)

      if (routeOptions[0]?.coordinates.length) {
        fitRouteBounds(routeOptions[0].coordinates)
      }
    } catch (error) {
      console.error('Error al calcular rutas hacia el pin:', error)
      const distancia = calcularDistancia(
        userLocation.lat,
        userLocation.lng,
        destino.lat,
        destino.lng
      )
      const tiempo = calcularTiempoMedio(distancia)
      const fallbackRoute: NavigationRouteOption[] = [
        {
          id: 0,
          label: 'Más corta',
          coordinates: [
            [userLocation.lat, userLocation.lng],
            [destino.lat, destino.lng],
          ],
          distancia,
          tiempo,
        },
      ]
      setOpcionesRutaHaciaPin(fallbackRoute)
      setIndiceRutaHaciaPin(0)
      fitRouteBounds(fallbackRoute[0].coordinates)
    } finally {
      setCargandoRutaHaciaPin(false)
    }
  }

  // Función para verificar si una ruta está suficientemente lejos de otras rutas
  const esRutaSuficientementeLejos = (nuevaRuta, rutasExistentes, distanciaMinimaKm = 0.5) => {
    if (rutasExistentes.length === 0) return true
    
    for (const rutaExistente of rutasExistentes) {
      // Calcular distancia entre puntos A
      const distA = calcularDistancia(
        nuevaRuta.puntoA[0], nuevaRuta.puntoA[1],
        rutaExistente.puntoA[0], rutaExistente.puntoA[1]
      )
      
      // Calcular distancia entre puntos B
      const distB = calcularDistancia(
        nuevaRuta.puntoB[0], nuevaRuta.puntoB[1],
        rutaExistente.puntoB[0], rutaExistente.puntoB[1]
      )
      
      // Calcular distancia entre A de nueva y B de existente
      const distAB = calcularDistancia(
        nuevaRuta.puntoA[0], nuevaRuta.puntoA[1],
        rutaExistente.puntoB[0], rutaExistente.puntoB[1]
      )
      
      // Calcular distancia entre B de nueva y A de existente
      const distBA = calcularDistancia(
        nuevaRuta.puntoB[0], nuevaRuta.puntoB[1],
        rutaExistente.puntoA[0], rutaExistente.puntoA[1]
      )
      
      // Si alguna distancia es menor que la mínima, la ruta está muy cerca
      if (distA < distanciaMinimaKm || distB < distanciaMinimaKm || 
          distAB < distanciaMinimaKm || distBA < distanciaMinimaKm) {
        return false
      }
    }
    
    return true
  }

  // Función para verificar si un punto está dentro de los límites del mapa
  const estaDentroDeLimites = (lat, lng) => {
    const [southWest, northEast] = maxBounds
    return lat >= southWest[0] && lat <= northEast[0] && 
           lng >= southWest[1] && lng <= northEast[1]
  }

  // Función para generar un punto aleatorio dentro de los límites del mapa
  const generarPuntoAleatorio = () => {
    const [southWest, northEast] = maxBounds
    const lat = southWest[0] + Math.random() * (northEast[0] - southWest[0])
    const lng = southWest[1] + Math.random() * (northEast[1] - southWest[1])
    return [lat, lng]
  }

  // Función para obtener punto en calle y verificar que esté dentro de límites
  const obtenerPuntoEnCalleDentroDeLimites = async (lat, lng, maxIntentos = 5) => {
    for (let intento = 0; intento < maxIntentos; intento++) {
      const puntoEnCalle = await obtenerPuntoEnCalle(lat, lng)
      
      // Verificar que el punto esté dentro de los límites
      if (estaDentroDeLimites(puntoEnCalle[0], puntoEnCalle[1])) {
        return puntoEnCalle
      }
      
      // Si está fuera, generar un nuevo punto aleatorio más cerca del centro
      if (intento < maxIntentos - 1) {
        const [southWest, northEast] = maxBounds
        // Generar un punto más cerca del centro de los límites
        const centroLat = (southWest[0] + northEast[0]) / 2
        const centroLng = (southWest[1] + northEast[1]) / 2
        // Reducir el área de búsqueda gradualmente
        const factor = 0.7 - (intento * 0.1)
        const nuevoLat = centroLat + (lat - centroLat) * factor
        const nuevoLng = centroLng + (lng - centroLng) * factor
        lat = nuevoLat
        lng = nuevoLng
      }
    }
    
    // Si después de varios intentos no encontramos un punto válido,
    // devolver el punto original si está dentro de límites, o un punto del centro
    const puntoEnCalle = await obtenerPuntoEnCalle(lat, lng)
    if (estaDentroDeLimites(puntoEnCalle[0], puntoEnCalle[1])) {
      return puntoEnCalle
    }
    
    // Último recurso: punto del centro
    const [southWest, northEast] = maxBounds
    const centroLat = (southWest[0] + northEast[0]) / 2
    const centroLng = (southWest[1] + northEast[1]) / 2
    return await obtenerPuntoEnCalle(centroLat, centroLng)
  }

  // Función para generar 10 rutas aleatorias desde puntos aleatorios del mapa
  const generarRutasAleatorias = async () => {
    setCargandoRutasAleatorias(true)
    setRutasAleatorias([])
    
    const colores = [
      '#ff0000', '#00ff00', '#0000ff', '#ffff00', '#ff00ff', 
      '#00ffff', '#ff8800', '#8800ff', '#00ff88', '#ff0088'
    ]
    const nuevasRutas = []
    const paresUsados = new Set()
    const distanciaMinimaEntreRutas = 0.5 // km - distancia mínima entre rutas
    const distanciaMinimaEntrePuntos = 0.3 // km - distancia mínima entre punto A y B
    
    let intentosGenerales = 0
    const maxIntentosGenerales = 300 // Límite de intentos totales
    
    for (let i = 0; i < 10 && intentosGenerales < maxIntentosGenerales; i++) {
      let rutaValida = false
      let intentosRuta = 0
      const maxIntentosPorRuta = 40
      
      while (!rutaValida && intentosRuta < maxIntentosPorRuta && intentosGenerales < maxIntentosGenerales) {
        intentosRuta++
        intentosGenerales++
        
        // Generar puntos aleatorios
        const puntoAleatorioA = generarPuntoAleatorio()
        const puntoAleatorioB = generarPuntoAleatorio()
        
        // Obtener puntos en calles que estén dentro de límites (en paralelo para optimizar)
        const [puntoAEnCalle, puntoBEnCalle] = await Promise.all([
          obtenerPuntoEnCalleDentroDeLimites(puntoAleatorioA[0], puntoAleatorioA[1]),
          obtenerPuntoEnCalleDentroDeLimites(puntoAleatorioB[0], puntoAleatorioB[1])
        ])
        
        // Verificar que ambos puntos estén dentro de límites
        if (!estaDentroDeLimites(puntoAEnCalle[0], puntoAEnCalle[1]) || 
            !estaDentroDeLimites(puntoBEnCalle[0], puntoBEnCalle[1])) {
          continue // Punto fuera de límites, intentar otra vez
        }
        
        // Verificar que la distancia entre A y B sea razonable
        const distanciaAB = calcularDistancia(
          puntoAEnCalle[0], puntoAEnCalle[1], 
          puntoBEnCalle[0], puntoBEnCalle[1]
        )
        
        if (distanciaAB < distanciaMinimaEntrePuntos) {
          continue // Ruta muy corta, intentar otra
        }
        
        // Crear una clave única para el par (ordenada para evitar duplicados)
        const puntoAKey = `${puntoAEnCalle[0].toFixed(4)},${puntoAEnCalle[1].toFixed(4)}`
        const puntoBKey = `${puntoBEnCalle[0].toFixed(4)},${puntoBEnCalle[1].toFixed(4)}`
        const parKey = puntoAKey < puntoBKey ? `${puntoAKey}-${puntoBKey}` : `${puntoBKey}-${puntoAKey}`
        
        // Verificar que el par no haya sido usado
        if (paresUsados.has(parKey)) {
          continue
        }
        
        // Crear objeto de ruta temporal para verificar distancia
        const rutaTemporal = {
          puntoA: puntoAEnCalle,
          puntoB: puntoBEnCalle
        }
        
        // Verificar que esté suficientemente lejos de otras rutas
        if (!esRutaSuficientementeLejos(rutaTemporal, nuevasRutas, distanciaMinimaEntreRutas)) {
          continue // Muy cerca de otra ruta, intentar otra
        }
        
        // Obtener la ruta real usando OSRM (igual que tiempo medio)
        const routeData = await obtenerRuta(
          puntoAEnCalle[0], puntoAEnCalle[1], 
          puntoBEnCalle[0], puntoBEnCalle[1]
        )
        
        if (routeData && routeData.distancia >= distanciaMinimaEntrePuntos) {
          // Filtrar coordenadas de la ruta para mantener solo las que están dentro de límites
          const coordenadasFiltradas = routeData.coordinates.filter(coord => 
            estaDentroDeLimites(coord[0], coord[1])
          )
          
          // Verificar que al menos los puntos A y B estén en las coordenadas filtradas
          // y que tengamos suficientes puntos para dibujar la ruta
          if (coordenadasFiltradas.length >= 2) {
            // Asegurar que los puntos A y B estén incluidos
            const tienePuntoA = coordenadasFiltradas.some(coord => 
              calcularDistancia(coord[0], coord[1], puntoAEnCalle[0], puntoAEnCalle[1]) < 0.01
            )
            const tienePuntoB = coordenadasFiltradas.some(coord => 
              calcularDistancia(coord[0], coord[1], puntoBEnCalle[0], puntoBEnCalle[1]) < 0.01
            )
            
            if (tienePuntoA && tienePuntoB) {
              // Ruta válida encontrada
              paresUsados.add(parKey)
              
              nuevasRutas.push({
                id: i,
                puntoA: puntoAEnCalle,
                puntoB: puntoBEnCalle,
                nombreA: `Punto A${i + 1}`,
                nombreB: `Punto B${i + 1}`,
                coordinates: coordenadasFiltradas,
                distancia: routeData.distancia,
                duracion: routeData.duracion,
                color: colores[i],
                tiempo: calcularTiempoMedio(routeData.distancia)
              })
              
              rutaValida = true
            }
          }
        }
      }
      
      // Si no se pudo generar una ruta válida después de varios intentos, continuar
      if (!rutaValida) {
        console.warn(`No se pudo generar la ruta ${i + 1} después de ${intentosRuta} intentos`)
      }
    }
    
    setRutasAleatorias(nuevasRutas)
    rutasAleatoriasRef.current = nuevasRutas
    setCargandoRutasAleatorias(false)
    
    if (nuevasRutas.length === 0) {
      alert('No se pudieron generar rutas. Intente nuevamente.')
    } else if (nuevasRutas.length < 10) {
      console.log(`Se generaron ${nuevasRutas.length} rutas de 10 solicitadas`)
    }
    
    // Disparar evento para notificar que las rutas fueron generadas
    const event = new CustomEvent('rutas-aleatorias-generadas')
    window.dispatchEvent(event)
  }

  // Función para limpiar rutas aleatorias
  const limpiarRutasAleatorias = () => {
    setRutasAleatorias([])
    rutasAleatoriasRef.current = []
    setVehiculos([])
    setVehiculosActivos(false)
    // Disparar evento para notificar que las rutas fueron limpiadas
    const event = new CustomEvent('rutas-aleatorias-limpiadas')
    window.dispatchEvent(event)
  }

  // Función para cargar rutas guardadas desde el archivo
  const cargarRutasSalvas = async () => {
    setCargandoRutasSalvas(true)
    try {
      console.log('🔄 Iniciando carga de rutas...')
      const response = await fetch('/data/rutas.json')
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        throw new Error(`Error ${response.status}: ${errorData.message || 'No se pudo cargar las rutas'}`)
      }
      
      const rutas = await response.json()
      console.log('📦 Respuesta recibida:', Array.isArray(rutas) ? `${rutas.length} rutas` : 'formato inválido')
      
      if (Array.isArray(rutas) && rutas.length > 0) {
        setRutasSalvas(rutas)
        // Disparar evento para notificar que las rutas fueron cargadas
        const event = new CustomEvent('rutas-salvas-cargadas', { detail: { count: rutas.length } })
        window.dispatchEvent(event)
        console.log(`✅ ${rutas.length} rutas cargadas y mostradas en el mapa`)
      } else {
        console.warn('⚠️ No se encontraron rutas o el array está vacío')
        alert('No se encontraron rutas guardadas.\n\nEjecuta primero: npm run gerar-rotas\n\nEsto generará las rutas en la carpeta data/rutas/')
      }
    } catch (error) {
      console.error('❌ Error al cargar rutas:', error)
      console.error('Detalles:', error.message)
      alert(`Error al cargar las rutas: ${error.message}\n\nAsegúrate de que existan archivos ruta-*.json en la carpeta data/rutas/\n\nEjecuta: npm run gerar-rotas\n\nRevisa la consola del servidor para más detalles.`)
    } finally {
      setCargandoRutasSalvas(false)
    }
  }

  // Función para limpiar rutas guardadas
  const limpiarRutasSalvas = () => {
    setRutasSalvas([])
    setRutasSalvasCargadasManualmente(false)
    // Disparar evento para notificar que las rutas fueron limpiadas
    const event = new CustomEvent('rutas-salvas-limpiadas')
    window.dispatchEvent(event)
  }

  // Función para generar nombres de motoristas aleatorios
  const generarNombreMotorista = (tipo, index) => {
    const nombresPolicia = ['Carlos Mendoza', 'Roberto Silva', 'Ana García', 'Luis Pérez', 'María Rodríguez']
    const nombresBomberos = ['José Martínez', 'Pedro López', 'Carmen Sánchez', 'Fernando Torres', 'Laura Díaz']
    const nombresAmbulancia = ['Dr. Juan Ramírez', 'Dra. Sofía Herrera', 'Dr. Miguel Castro', 'Dra. Elena Morales', 'Dr. Andrés Vega']
    
    if (tipo === 'policia') {
      return nombresPolicia[index % nombresPolicia.length]
    } else if (tipo === 'bombeiros') {
      return nombresBomberos[index % nombresBomberos.length]
    } else {
      return nombresAmbulancia[index % nombresAmbulancia.length]
    }
  }

  // Función para activar veículos com rotas guardadas
  const activarVehiculosConRutasSalvas = async () => {
    let rutasParaUsar = [...rutasSalvas]
    
    // Si las rutas no están cargadas, cargar automáticamente
    if (rutasParaUsar.length === 0) {
      console.log('🔄 Carregando rotas automaticamente...')
      setCargandoRutasSalvas(true)
      try {
        const response = await fetch('/data/rutas.json')
        if (!response.ok) {
          throw new Error(`Error ${response.status}: No se pudo cargar el archivo de rutas`)
        }
        const rutas = await response.json()
        
        if (Array.isArray(rutas) && rutas.length > 0) {
          rutasParaUsar = rutas
          setRutasSalvas(rutas)
          console.log(`✅ ${rutas.length} rutas cargadas automáticamente`)
          
          // Verificar se há rotas suficientes
          if (rutas.length < 15) {
            setCargandoRutasSalvas(false)
            alert(`Necesita al menos 15 rutas guardadas. Actualmente hay ${rutas.length} rutas.\n\nEjecuta: npm run gerar-rotas`)
            return
          }
        } else {
          setCargandoRutasSalvas(false)
          alert('No se encontraron rutas guardadas.\n\nEjecuta primero: npm run gerar-rotas\n\nEsto generará las rutas en la carpeta data/rutas/')
          return
        }
      } catch (error) {
        console.error('❌ Error al cargar rutas:', error)
        setCargandoRutasSalvas(false)
        alert(`Error al cargar las rutas: ${error.message}\n\nAsegúrate de que existan archivos ruta-*.json en la carpeta data/rutas/\n\nEjecuta: npm run gerar-rotas`)
        return
      } finally {
        setCargandoRutasSalvas(false)
      }
    }

    if (rutasParaUsar.length < 15) {
      alert(`Necesita al menos 15 rutas guardadas. Actualmente hay ${rutasParaUsar.length} rutas.\n\nEjecuta: npm run gerar-rotas`)
      return
    }

    // Limpiar veículos anteriores
    setVehiculosConRutasSalvas([])
    
    const nuevosVehiculos = []
    const rutasUsadas = new Set()
    const rutasDisponibles = [...rutasParaUsar]

    // 5 viaturas de polícia
    for (let i = 0; i < 5; i++) {
      let rutaIndex = Math.floor(Math.random() * rutasDisponibles.length)
      while (rutasUsadas.has(rutaIndex)) {
        rutaIndex = Math.floor(Math.random() * rutasDisponibles.length)
      }
      rutasUsadas.add(rutaIndex)
      
      const ruta = rutasDisponibles[rutaIndex]
      const vehiculoId = `policia-salva-${i}`
      nuevosVehiculos.push({
        id: vehiculoId,
        tipo: 'policia',
        rutaId: rutaIndex,
        rutaOriginal: ruta,
        posicionInicial: ruta.puntoA,
        puntoB: ruta.puntoB,
        coordenadas: ruta.coordinates,
        activo: true,
        motorista: generarNombreMotorista('policia', i),
        status: 'Patrullando'
      })
      // Inicializar rotas usadas para este veículo
      setRutasUsadasPorVehiculo(prev => {
        const nuevo = new Map(prev)
        nuevo.set(vehiculoId, new Set([rutaIndex]))
        return nuevo
      })
    }

    // 5 bombeiros
    for (let i = 0; i < 5; i++) {
      let rutaIndex = Math.floor(Math.random() * rutasDisponibles.length)
      while (rutasUsadas.has(rutaIndex)) {
        rutaIndex = Math.floor(Math.random() * rutasDisponibles.length)
      }
      rutasUsadas.add(rutaIndex)
      
      const ruta = rutasDisponibles[rutaIndex]
      const vehiculoId = `bombeiros-salva-${i}`
      nuevosVehiculos.push({
        id: vehiculoId,
        tipo: 'bombeiros',
        rutaId: rutaIndex,
        rutaOriginal: ruta,
        posicionInicial: ruta.puntoA,
        puntoB: ruta.puntoB,
        coordenadas: ruta.coordinates,
        activo: true,
        motorista: generarNombreMotorista('bombeiros', i),
        status: 'Patrullando'
      })
      // Inicializar rotas usadas para este veículo
      setRutasUsadasPorVehiculo(prev => {
        const nuevo = new Map(prev)
        nuevo.set(vehiculoId, new Set([rutaIndex]))
        return nuevo
      })
    }

    // 5 ambulâncias
    for (let i = 0; i < 5; i++) {
      let rutaIndex = Math.floor(Math.random() * rutasDisponibles.length)
      while (rutasUsadas.has(rutaIndex)) {
        rutaIndex = Math.floor(Math.random() * rutasDisponibles.length)
      }
      rutasUsadas.add(rutaIndex)
      
      const ruta = rutasDisponibles[rutaIndex]
      const vehiculoId = `ambulancia-salva-${i}`
      nuevosVehiculos.push({
        id: vehiculoId,
        tipo: 'ambulancia',
        rutaId: rutaIndex,
        rutaOriginal: ruta,
        posicionInicial: ruta.puntoA,
        puntoB: ruta.puntoB,
        coordenadas: ruta.coordinates,
        activo: true,
        motorista: generarNombreMotorista('ambulancia', i),
        status: 'Patrullando'
      })
      // Inicializar rotas usadas para este veículo
      setRutasUsadasPorVehiculo(prev => {
        const nuevo = new Map(prev)
        nuevo.set(vehiculoId, new Set([rutaIndex]))
        return nuevo
      })
    }

    setVehiculosConRutasSalvas(nuevosVehiculos)
    setVehiculosConRutasSalvasActivos(true)
    
    // Disparar evento para notificar que los veículos fueron activados
    const event = new CustomEvent('vehiculos-con-rutas-salvas-activados')
    window.dispatchEvent(event)
  }

  // Función para desactivar veículos con rutas guardadas
  const desactivarVehiculosConRutasSalvas = () => {
    setVehiculosConRutasSalvas([])
    setVehiculosConRutasSalvasActivos(false)
    setRutasVisibles(new Set())
    setRutasUsadasPorVehiculo(new Map()) // Limpar rotas usadas
    const event = new CustomEvent('vehiculos-con-rutas-salvas-desactivados')
    window.dispatchEvent(event)
  }

  // Función para mostrar/ocultar rota de un veículo (com rotas salvas)
  const toggleRutaVehiculo = (vehiculoId) => {
    setRutasVisibles(prev => {
      const nuevo = new Set(prev)
      
      if (nuevo.has(vehiculoId)) {
        // Se já está visível, remover (ocultar)
        nuevo.delete(vehiculoId)
      } else {
        // Se não está visível, limpar todos e mostrar apenas este
        nuevo.clear()
        nuevo.add(vehiculoId)
      }
      
      return nuevo
    })
  }

  // Función para mostrar/ocultar rota de un veículo animado
  const toggleRutaVehiculoAnimado = (vehiculoId) => {
    console.log('toggleRutaVehiculoAnimado chamado para:', vehiculoId)
    setRutasVisiblesAnimados(prev => {
      const nuevo = new Set(prev)
      
      if (nuevo.has(vehiculoId)) {
        // Se já está visível, remover (ocultar)
        console.log('Ocultando rota para:', vehiculoId)
        nuevo.delete(vehiculoId)
      } else {
        // Se não está visível, limpar todos e mostrar apenas este
        console.log('Mostrando rota para:', vehiculoId)
        nuevo.clear()
        nuevo.add(vehiculoId)
      }
      
      console.log('Novo estado de rotas visíveis:', Array.from(nuevo))
      return nuevo
    })
  }

  // Función para activar veículos
  const activarVehiculos = () => {
    if (rutasAleatorias.length === 0) {
      alert('Primero debe generar rutas aleatorias')
      return
    }

    if (rutasAleatorias.length < 10) {
      alert(`Necesita 10 rutas. Actualmente hay ${rutasAleatorias.length} rutas.`)
      return
    }

    // Limpiar veículos anteriores
    setVehiculos([])
    
    const nuevosVehiculos = []
    const rutasUsadas = new Set()

    // 5 viaturas de polícia
    for (let i = 0; i < 5; i++) {
      let rutaIndex = Math.floor(Math.random() * rutasAleatorias.length)
      while (rutasUsadas.has(rutaIndex)) {
        rutaIndex = Math.floor(Math.random() * rutasAleatorias.length)
      }
      rutasUsadas.add(rutaIndex)
      
      const ruta = rutasAleatorias[rutaIndex]
      nuevosVehiculos.push({
        id: `policia-${i}`,
        tipo: 'policia',
        rutaId: rutaIndex,
        posicionInicial: ruta.puntoA,
        puntoB: ruta.puntoB,
        coordenadas: ruta.coordinates,
        activo: true,
        motorista: generarNombreMotorista('policia', i),
        status: Math.random() > 0.5 ? 'Em ocorrência' : 'Patrulhando'
      })
    }

    // 3 ambulâncias
    for (let i = 0; i < 3; i++) {
      let rutaIndex = Math.floor(Math.random() * rutasAleatorias.length)
      while (rutasUsadas.has(rutaIndex)) {
        rutaIndex = Math.floor(Math.random() * rutasAleatorias.length)
      }
      rutasUsadas.add(rutaIndex)
      
        const ruta = rutasAleatorias[rutaIndex]
        if (!ruta.puntoA || !ruta.coordinates || ruta.coordinates.length === 0) {
          console.error(`Error: Ruta ${rutaIndex} no tiene punto A o coordenadas válidas`)
          continue
        }
        
        nuevosVehiculos.push({
          id: `ambulancia-${i}`,
          tipo: 'ambulancia',
          rutaId: rutaIndex,
          posicionInicial: ruta.puntoA,
          puntoB: ruta.puntoB,
          coordenadas: ruta.coordinates,
          activo: true,
          motorista: generarNombreMotorista('ambulancia', i),
          status: Math.random() > 0.5 ? 'Em ocorrência' : 'Patrulhando'
        })
    }

    // 2 bombeiros
    for (let i = 0; i < 2; i++) {
      let rutaIndex = Math.floor(Math.random() * rutasAleatorias.length)
      while (rutasUsadas.has(rutaIndex)) {
        rutaIndex = Math.floor(Math.random() * rutasAleatorias.length)
      }
      rutasUsadas.add(rutaIndex)
      
        const ruta = rutasAleatorias[rutaIndex]
        if (!ruta.puntoA || !ruta.coordinates || ruta.coordinates.length === 0) {
          console.error(`Error: Ruta ${rutaIndex} no tiene punto A o coordenadas válidas`)
          continue
        }
        
        nuevosVehiculos.push({
          id: `bombeiros-${i}`,
          tipo: 'bombeiros',
          rutaId: rutaIndex,
          posicionInicial: ruta.puntoA,
          puntoB: ruta.puntoB,
          coordenadas: ruta.coordinates,
          activo: true,
          motorista: generarNombreMotorista('bombeiros', i),
          status: Math.random() > 0.5 ? 'Em ocorrência' : 'Patrulhando'
        })
    }

    setVehiculos(nuevosVehiculos)
    setVehiculosActivos(true)
    
    // Disparar evento para notificar que los veículos fueron activados
    const event = new CustomEvent('vehiculos-activados')
    window.dispatchEvent(event)
  }

  // Función para desactivar veículos
  const desactivarVehiculos = () => {
    setVehiculos([])
    setVehiculosActivos(false)
    setRutasVisiblesAnimados(new Set()) // Limpar rotas visíveis
    const event = new CustomEvent('vehiculos-desactivados')
    window.dispatchEvent(event)
  }

  // Callback cuando un veículo llega al destino
  const handleVehiculoLlegada = (vehiculoId, vehiculo) => {
    // Se for um veículo com rotas salvas, escolher uma nova rota
    if (vehiculo && vehiculo.rutaOriginal) {
      setRutasUsadasPorVehiculo(prev => {
        const rutasUsadas = prev.get(vehiculoId) || new Set()
        const rutasDisponibles = rutasSalvas.filter((ruta, index) => !rutasUsadas.has(index))
        
        let nuevaRuta
        let nuevaRutaIndex
        
        if (rutasDisponibles.length === 0) {
          // Se todas as rotas foram usadas, resetar e começar de novo
          console.log(`🔄 Veículo ${vehiculoId} completou todas as rotas, reiniciando...`)
          nuevaRutaIndex = Math.floor(Math.random() * rutasSalvas.length)
          nuevaRuta = rutasSalvas[nuevaRutaIndex]
          
          // Resetar rotas usadas para este veículo
          const nuevo = new Map(prev)
          nuevo.set(vehiculoId, new Set([nuevaRutaIndex]))
          
          // Atualizar veículo com nova rota (preservar motorista e status)
          setVehiculosConRutasSalvas(prevVehiculos => 
            prevVehiculos.map(v => {
              if (v.id === vehiculoId) {
                return {
                  ...v,
                  rutaId: nuevaRutaIndex,
                  rutaOriginal: nuevaRuta,
                  posicionInicial: nuevaRuta.puntoA,
                  puntoB: nuevaRuta.puntoB,
                  coordenadas: nuevaRuta.coordinates,
                  activo: true, // Reiniciar animação
                  motorista: v.motorista, // Preservar motorista
                  status: v.status // Preservar status
                }
              }
              return v
            })
          )
          
          return nuevo
        } else {
          // Escolher uma nova rota das disponíveis
          nuevaRuta = rutasDisponibles[Math.floor(Math.random() * rutasDisponibles.length)]
          nuevaRutaIndex = rutasSalvas.findIndex(r => r.id === nuevaRuta.id)
          
          // Adicionar nova rota às usadas
          const nuevo = new Map(prev)
          const usadas = nuevo.get(vehiculoId) || new Set()
          usadas.add(nuevaRutaIndex)
          nuevo.set(vehiculoId, usadas)
          
          // Atualizar veículo com nova rota (preservar motorista e status)
          setVehiculosConRutasSalvas(prevVehiculos => 
            prevVehiculos.map(v => {
              if (v.id === vehiculoId) {
                return {
                  ...v,
                  rutaId: nuevaRutaIndex,
                  rutaOriginal: nuevaRuta,
                  posicionInicial: nuevaRuta.puntoA,
                  puntoB: nuevaRuta.puntoB,
                  coordenadas: nuevaRuta.coordinates,
                  activo: true, // Reiniciar animação
                  motorista: v.motorista, // Preservar motorista
                  status: v.status // Preservar status
                }
              }
              return v
            })
          )
          
          return nuevo
        }
      })
    } else {
      // Para veículos normais (sem rotas salvas), apenas desativar
      setVehiculos(prevVehiculos => 
        prevVehiculos.map(v => 
          v.id === vehiculoId ? { ...v, activo: false } : v
        )
      )
    }
  }

  // Efecto para escuchar eventos personalizados para agregar y quitar marcadores
  useEffect(() => {
    const handleAddMarker = () => {
      // Salir del modo tiempo medio si está activo
      if (tiempoMedioMode) {
        setTiempoMedioMode(false)
        setPuntoA(null)
        setPuntoB(null)
        setRuta(null)
        setTiempoMedio(null)
        setCargandoRuta(false)
        clearRutaHaciaPin()
      }
      // Entrar en modo de adición de marcador
      setAddingMarker(true)
      const map = mapRef.current
      if (map) {
        const leafletMap = map
        if (leafletMap) {
          leafletMap.getContainer().style.cursor = 'crosshair'
        }
      }
    }
    
    const handleRemoveMarker = () => {
      setCustomMarker(null)
      setAddingMarker(false)
      setPuntoA(null)
      setPuntoB(null)
      setRuta(null)
      setTiempoMedio(null)
      setCargandoRuta(false)
      const map = mapRef.current
      if (map) {
        const leafletMap = map
        if (leafletMap) {
          leafletMap.getContainer().style.cursor = ''
        }
      }
    }

    const handleToggleTiempoMedio = () => {
      if (tiempoMedioMode) {
        // Salir del modo
        setTiempoMedioMode(false)
        setPuntoA(null)
        setPuntoB(null)
        setRuta(null)
        setTiempoMedio(null)
        setCargandoRuta(false)
        setAddingMarker(false)
        const map = mapRef.current
        if (map) {
          const leafletMap = map
          if (leafletMap) {
            leafletMap.getContainer().style.cursor = ''
          }
        }
        // Disparar evento para actualizar el botón
        const event = new CustomEvent('tiempo-medio-changed', { detail: { active: false } })
        window.dispatchEvent(event)
      } else {
        // Entrar en modo tiempo medio
        setTiempoMedioMode(true)
        setAddingMarker(false)
        setCustomMarker(null)
        setPuntoA(null)
        setPuntoB(null)
        setRuta(null)
        setTiempoMedio(null)
        setCargandoRuta(false)
        clearRutaHaciaPin()
        const map = mapRef.current
        if (map) {
          const leafletMap = map
          if (leafletMap) {
            leafletMap.getContainer().style.cursor = 'crosshair'
          }
        }
        // Disparar evento para actualizar el botón
        const event = new CustomEvent('tiempo-medio-changed', { detail: { active: true } })
        window.dispatchEvent(event)
      }
    }

    const handleClearTiempoMedio = () => {
      setPuntoA(null)
      setPuntoB(null)
      setRuta(null)
      setTiempoMedio(null)
      setCargandoRuta(false)
      setTiempoMedioMode(false)
      const map = mapRef.current
      if (map) {
        const leafletMap = map
        if (leafletMap) {
          leafletMap.getContainer().style.cursor = ''
        }
      }
      // Disparar eventos para actualizar los botones
      const event1 = new CustomEvent('tiempo-medio-changed', { detail: { active: false } })
      const event2 = new CustomEvent('tiempo-medio-cleared')
      window.dispatchEvent(event1)
      window.dispatchEvent(event2)
    }

    const handleGenerarRutasAleatorias = () => {
      generarRutasAleatorias()
    }

    const handleLimpiarRutasAleatorias = () => {
      limpiarRutasAleatorias()
    }

    const handleActivarVehiculos = () => {
      // Usar a ref para acessar o estado atualizado
      const rutasAtuais = rutasAleatoriasRef.current
      
      if (rutasAtuais.length === 0) {
        alert('Primero debe generar rutas aleatorias')
        return
      }

      if (rutasAtuais.length < 10) {
        alert(`Necesita 10 rutas. Actualmente hay ${rutasAtuais.length} rutas.`)
        return
      }

      // Limpiar veículos anteriores
      setVehiculos([])
      
      const nuevosVehiculos = []
      const rutasUsadas = new Set()

      // 5 viaturas de polícia
      for (let i = 0; i < 5; i++) {
        let rutaIndex = Math.floor(Math.random() * rutasAtuais.length)
        while (rutasUsadas.has(rutaIndex)) {
          rutaIndex = Math.floor(Math.random() * rutasAtuais.length)
        }
        rutasUsadas.add(rutaIndex)
        
        const ruta = rutasAtuais[rutaIndex]
        if (!ruta.puntoA || !ruta.coordinates || ruta.coordinates.length === 0) {
          console.error(`Error: Ruta ${rutaIndex} no tiene punto A o coordenadas válidas`)
          continue
        }
        
        nuevosVehiculos.push({
          id: `policia-${i}`,
          tipo: 'policia',
          rutaId: rutaIndex,
          posicionInicial: ruta.puntoA,
          puntoB: ruta.puntoB,
          coordenadas: ruta.coordinates,
          activo: true,
          motorista: generarNombreMotorista('policia', i),
          status: Math.random() > 0.5 ? 'Em ocorrência' : 'Patrulhando'
        })
      }

      // 3 ambulâncias
      for (let i = 0; i < 3; i++) {
        let rutaIndex = Math.floor(Math.random() * rutasAtuais.length)
        while (rutasUsadas.has(rutaIndex)) {
          rutaIndex = Math.floor(Math.random() * rutasAtuais.length)
        }
        rutasUsadas.add(rutaIndex)
        
        const ruta = rutasAtuais[rutaIndex]
        nuevosVehiculos.push({
          id: `ambulancia-${i}`,
          tipo: 'ambulancia',
          rutaId: rutaIndex,
          posicionInicial: ruta.puntoA,
          puntoB: ruta.puntoB,
          coordenadas: ruta.coordinates,
          activo: true,
          motorista: generarNombreMotorista('ambulancia', i),
          status: Math.random() > 0.5 ? 'Em ocorrência' : 'Patrulhando'
        })
      }

      // 2 bombeiros
      for (let i = 0; i < 2; i++) {
        let rutaIndex = Math.floor(Math.random() * rutasAtuais.length)
        while (rutasUsadas.has(rutaIndex)) {
          rutaIndex = Math.floor(Math.random() * rutasAtuais.length)
        }
        rutasUsadas.add(rutaIndex)
        
        const ruta = rutasAtuais[rutaIndex]
        nuevosVehiculos.push({
          id: `bombeiros-${i}`,
          tipo: 'bombeiros',
          rutaId: rutaIndex,
          posicionInicial: ruta.puntoA,
          puntoB: ruta.puntoB,
          coordenadas: ruta.coordinates,
          activo: true,
          motorista: generarNombreMotorista('bombeiros', i),
          status: Math.random() > 0.5 ? 'Em ocorrência' : 'Patrulhando'
        })
      }

      // Validar que todos os veículos foram criados
      if (nuevosVehiculos.length !== 10) {
        console.error(`Erro: Esperado 10 veículos, mas apenas ${nuevosVehiculos.length} foram criados`)
      }
      
      // Validar que cada vehículo tiene punto A y coordenadas
      nuevosVehiculos.forEach((vehiculo, index) => {
        if (!vehiculo.posicionInicial || !vehiculo.coordenadas || vehiculo.coordenadas.length === 0) {
          console.error(`Error: Vehículo ${index} (${vehiculo.id}) no tiene posición inicial o coordenadas válidas`)
        }
      })
      
      console.log(`✅ ${nuevosVehiculos.length} veículos criados:`, {
        policia: nuevosVehiculos.filter(v => v.tipo === 'policia').length,
        ambulancia: nuevosVehiculos.filter(v => v.tipo === 'ambulancia').length,
        bombeiros: nuevosVehiculos.filter(v => v.tipo === 'bombeiros').length
      })
      
      setVehiculos(nuevosVehiculos)
      setVehiculosActivos(true)
      
      // Disparar evento para notificar que los veículos fueron activados
      const event = new CustomEvent('vehiculos-activados')
      window.dispatchEvent(event)
    }

    const handleDesactivarVehiculos = () => {
      desactivarVehiculos()
    }

    const handleCargarRutasSalvas = () => {
      cargarRutasSalvas()
    }

    const handleLimpiarRutasSalvas = () => {
      limpiarRutasSalvas()
    }

    const handleActivarVehiculosConRutasSalvas = () => {
      activarVehiculosConRutasSalvas()
    }

    const handleDesactivarVehiculosConRutasSalvas = () => {
      desactivarVehiculosConRutasSalvas()
    }
    
    // Agregar listeners para los eventos personalizados
    window.addEventListener('add-marker', handleAddMarker)
    window.addEventListener('remove-marker', handleRemoveMarker)
    window.addEventListener('toggle-tiempo-medio', handleToggleTiempoMedio)
    window.addEventListener('clear-tiempo-medio', handleClearTiempoMedio)
    window.addEventListener('generar-rutas-aleatorias', handleGenerarRutasAleatorias)
    window.addEventListener('limpiar-rutas-aleatorias', handleLimpiarRutasAleatorias)
    window.addEventListener('cargar-rutas-salvas', handleCargarRutasSalvas)
    window.addEventListener('limpiar-rutas-salvas', handleLimpiarRutasSalvas)
    window.addEventListener('activar-vehiculos', handleActivarVehiculos)
    window.addEventListener('desactivar-vehiculos', handleDesactivarVehiculos)
    window.addEventListener('activar-vehiculos-con-rutas-salvas', handleActivarVehiculosConRutasSalvas)
    window.addEventListener('desactivar-vehiculos-con-rutas-salvas', handleDesactivarVehiculosConRutasSalvas)
    
    // Limpiar listeners cuando el componente se desmonte
    return () => {
      window.removeEventListener('add-marker', handleAddMarker)
      window.removeEventListener('remove-marker', handleRemoveMarker)
      window.removeEventListener('toggle-tiempo-medio', handleToggleTiempoMedio)
      window.removeEventListener('clear-tiempo-medio', handleClearTiempoMedio)
      window.removeEventListener('generar-rutas-aleatorias', handleGenerarRutasAleatorias)
      window.removeEventListener('limpiar-rutas-aleatorias', handleLimpiarRutasAleatorias)
      window.removeEventListener('cargar-rutas-salvas', handleCargarRutasSalvas)
      window.removeEventListener('limpiar-rutas-salvas', handleLimpiarRutasSalvas)
      window.removeEventListener('activar-vehiculos', handleActivarVehiculos)
      window.removeEventListener('desactivar-vehiculos', handleDesactivarVehiculos)
      window.removeEventListener('activar-vehiculos-con-rutas-salvas', handleActivarVehiculosConRutasSalvas)
      window.removeEventListener('desactivar-vehiculos-con-rutas-salvas', handleDesactivarVehiculosConRutasSalvas)
    }
  }, [tiempoMedioMode, clearRutaHaciaPin])

  // Efecto para manejar clics en el mapa cuando está en modo de adición
  useEffect(() => {
    if (!addingMarker && !tiempoMedioMode) return

    const map = mapRef.current
    if (!map) return

          const leafletMap = map
    if (!leafletMap || !leafletMap.getContainer) return
    
    const handleMapClick = (e) => {
      // Prevenir que el click se propague a los marcadores
      if (e.originalEvent) {
        const target = e.originalEvent.target as HTMLElement | null
        if (target?.closest) {
          const onParishOverlay =
            target.closest('.parroquia-label') ||
            target.closest('.leaflet-overlay-pane')

          if (!onParishOverlay) {
            if (
              target.closest('.leaflet-marker-icon') ||
              target.closest('.leaflet-popup') ||
              target.closest('.leaflet-tooltip') ||
              target.closest('.leaflet-marker-pane')
            ) {
              return
            }
          }
        }
      }
      
      const { lat, lng } = e.latlng
      
      if (tiempoMedioMode) {
        // Modo tiempo medio: agregar punto A o B
        if (!puntoA) {
          setPuntoA([lat, lng])
        } else if (!puntoB) {
          setPuntoB([lat, lng])
          setCargandoRuta(true)
          // Obtener la ruta real
          obtenerRuta(puntoA[0], puntoA[1], lat, lng).then(routeData => {
            setCargandoRuta(false)
            if (routeData) {
              setRuta(routeData.coordinates)
              const tiempo = calcularTiempoMedio(routeData.distancia)
              setTiempoMedio({ tiempo, distancia: routeData.distancia, duracion: routeData.duracion })
            } else {
              // Si falla la API, usar cálculo en línea recta como fallback
              const distancia = calcularDistancia(puntoA[0], puntoA[1], lat, lng)
              const tiempo = calcularTiempoMedio(distancia)
              setTiempoMedio({ tiempo, distancia })
              // Mostrar línea recta solo si falla la API
              setRuta([puntoA, [lat, lng]])
            }
            // Disparar evento para notificar que el tiempo medio fue calculado
            const event = new CustomEvent('tiempo-medio-calculated')
            window.dispatchEvent(event)
          }).catch(error => {
            setCargandoRuta(false)
            console.error('Error al obtener la ruta:', error)
            // En caso de error, usar fallback
            const distancia = calcularDistancia(puntoA[0], puntoA[1], lat, lng)
            const tiempo = calcularTiempoMedio(distancia)
            setTiempoMedio({ tiempo, distancia })
            setRuta([puntoA, [lat, lng]])
            const event = new CustomEvent('tiempo-medio-calculated')
            window.dispatchEvent(event)
          })
          // Salir del modo
          setTiempoMedioMode(false)
          if (leafletMap.getContainer()) {
            leafletMap.getContainer().style.cursor = ''
          }
          // Disparar evento para actualizar el botón
          const event = new CustomEvent('tiempo-medio-changed', { detail: { active: false } })
          window.dispatchEvent(event)
        }
      } else if (addingMarker) {
        // Modo agregar pin normal
        setCustomMarker([lat, lng])
        setAddingMarker(false)
        if (leafletMap.getContainer()) {
          leafletMap.getContainer().style.cursor = ''
        }
        // Disparar evento para notificar que el marcador fue agregado
        const event = new CustomEvent('marker-added')
        window.dispatchEvent(event)
      }
    }

    // Agregar el listener de click
    let timeoutId = null
    if (leafletMap && leafletMap.getContainer()) {
      leafletMap.on('click', handleMapClick)
    } else {
      timeoutId = setTimeout(() => {
        if (leafletMap && leafletMap.on) {
          leafletMap.on('click', handleMapClick)
        }
      }, 100)
    }

    return () => {
      if (timeoutId) {
        clearTimeout(timeoutId)
      }
      if (leafletMap && leafletMap.off) {
        leafletMap.off('click', handleMapClick)
      }
      if (leafletMap && leafletMap.getContainer() && !tiempoMedioMode && !addingMarker) {
        leafletMap.getContainer().style.cursor = ''
      }
    }
  }, [addingMarker, tiempoMedioMode, puntoA, puntoB])

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
        const filterType = id.replace('-checkbox', '')
        if (checked) {
          // Adicionar apenas se não estiver já na lista
          if (!updatedFilters.includes(filterType)) {
            updatedFilters.push(filterType)
          }
        } else {
          // Remover o filtro
          updatedFilters = updatedFilters.filter(f => f !== filterType)
        }
      }
      
      // Atualizar estado dos filtros
      setFilters(updatedFilters)
      
      // Disparar evento para atualizar o estado no componente pai
      const event = new CustomEvent('filters-changed', { detail: { filters: updatedFilters } })
      window.dispatchEvent(event)
    }

    const zoomRange = getCheckbox('zoom-range')
    const todosCheckbox = getCheckbox('todos-checkbox')
    const saludCheckbox = getCheckbox('salud-checkbox')
    const seguridadCheckbox = getCheckbox('seguridad-checkbox')
    const bomberosCheckbox = getCheckbox('bomberos-checkbox')
    const gobiernoCheckbox = getCheckbox('gobierno-checkbox')
    const parroquiasCheckbox = getCheckbox('parroquias-checkbox')

    const handleParroquiasToggle = () => {
      const cb = getCheckbox('parroquias-checkbox')
      setShowParroquias(cb ? cb.checked : true)
    }

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

    if (parroquiasCheckbox) {
      setShowParroquias(parroquiasCheckbox.checked)
      parroquiasCheckbox.addEventListener('change', handleParroquiasToggle)
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
      if (parroquiasCheckbox) {
        parroquiasCheckbox.removeEventListener('change', handleParroquiasToggle)
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
    const todosCheckbox = getCheckbox('todos-checkbox')
    const saludCheckbox = getCheckbox('salud-checkbox')
    const seguridadCheckbox = getCheckbox('seguridad-checkbox')
    const bomberosCheckbox = getCheckbox('bomberos-checkbox')
    const gobiernoCheckbox = getCheckbox('gobierno-checkbox')

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
    const zoomRange = getCheckbox('zoom-range')
    if (zoomRange) {
      zoomRange.value = String(zoom)
    }
  }, [zoom])

  const getMarkers = (): MapMarker[] => {
    let markers: MapMarker[] = []
    if (filters.includes('salud')) {
      markers = markers.concat(hospitales.map(item => ({ ...item, type: 'salud' as const })))
    }
    if (filters.includes('seguridad')) {
      markers = markers.concat(seguridad.map(item => ({ ...item, type: 'seguridad' as const })))
    }
    if (filters.includes('bomberos')) {
      markers = markers.concat(bomberos.map(item => ({ ...item, type: 'bomberos' as const })))
    }
    if (filters.includes('gobierno')) {
      markers = markers.concat(gobierno.map(item => ({ ...item, type: 'gobierno' as const })))
    }
    return markers
  }

  if (!mounted) {
    return <div id="map-wrapper-placeholder" className="map-wrapper" />
  }

  return (
    <div
      id="map-wrapper"
      key="map-wrapper"
      className={[
        'map-wrapper',
        currentMapStyle === 'dark' ? 'map-wrapper-dark' : '',
        addingMarker || tiempoMedioMode ? 'map-placing-pin' : '',
      ]
        .filter(Boolean)
        .join(' ')}
    >
      {locationError && (
        <div className="map-banner map-banner-warning">
          {locationError}
        </div>
      )}
      {!locationError && locationStatus === 'locating' && (
        <div className="map-banner map-banner-pin map-banner-pulse">
          Obteniendo tu ubicación…
        </div>
      )}
      {!locationError && userOutsideBounds && (
        <div className="map-banner map-banner-warning">
          Tu ubicación está fuera del área de Cabimas
        </div>
      )}
      {cargandoRutaHaciaPin && destinoNavegacion && (
        <div className="map-banner map-banner-warning">
          Calculando rutas hacia {destinoNavegacion.nombre}...
        </div>
      )}
      {infoRutaHaciaPinActiva && destinoNavegacion && !cargandoRutaHaciaPin && (
        <div className="map-banner map-banner-success">
          {infoRutaHaciaPinActiva.label} hacia {destinoNavegacion.nombre}: {infoRutaHaciaPinActiva.tiempo} ({infoRutaHaciaPinActiva.distancia.toFixed(2)} km)
        </div>
      )}
      {opcionesRutaHaciaPin.length > 0 && destinoNavegacion && !cargandoRutaHaciaPin && (
        <div className="route-selector-panel">
          <p className="route-selector-title">Rutas hacia {destinoNavegacion.nombre}</p>
          <div className="route-selector-options">
            {opcionesRutaHaciaPin.map((option, index) => (
              <button
                key={option.id}
                type="button"
                className={`route-selector-option${indiceRutaHaciaPin === index ? ' is-active' : ''}`}
                onClick={() => selectRutaHaciaPin(index)}
              >
                <span className="route-selector-option-label">{option.label}</span>
                <span className="route-selector-option-meta">
                  {option.tiempo} · {option.distancia.toFixed(2)} km
                </span>
              </button>
            ))}
          </div>
          <button type="button" className="route-selector-clear" onClick={clearRutaHaciaPin}>
            Ocultar rutas
          </button>
        </div>
      )}
      {addingMarker && (
        <div className="map-banner map-banner-pin map-banner-pulse">
          👆 Haz clic en el mapa para agregar el pin
        </div>
      )}
      {tiempoMedioMode && (
        <div className="map-banner map-banner-success map-banner-pulse">
          {!puntoA ? '👆 Haz clic para marcar el Punto A' : '👆 Haz clic para marcar el Punto B'}
        </div>
      )}
      {cargandoRuta && (
        <div className="map-banner map-banner-warning">
          ⏳ Calculando ruta...
        </div>
      )}
      {cargandoRutasAleatorias && (
        <div className="map-banner map-banner-purple">
          ⏳ Generando 10 rutas aleatorias...
        </div>
      )}
      {cargandoRutasSalvas && (
        <div className="map-banner map-banner-teal">
          ⏳ Cargando rutas guardadas...
        </div>
      )}
      {tiempoMedio && !cargandoRuta && (
        <div className="map-banner map-banner-success">
          ⏱️ Tiempo medio: {tiempoMedio.tiempo} ({tiempoMedio.distancia.toFixed(2)} km)
        </div>
      )}
      <MapContainer 
        key="map-container-unique"
        center={center} 
        zoom={zoom} 
        minZoom={minZoom} 
        maxZoom={MAP_MAX_ZOOM} 
        maxBounds={maxBounds} 
        style={{ height: '100%', width: '100%' }}
        ref={mapRef}
      >
        <MapInstanceSync mapRef={mapRef} mapInstanceRef={mapInstanceRef} />
        <TileLayer
          key={currentMapStyle}
          url={getCurrentMapStyle().url}
          attribution={getCurrentMapStyle().attribution}
          className={getCurrentMapStyle().className}
          minZoom={minZoom}
          maxZoom={MAP_MAX_ZOOM}
        />
        <ParroquiasLayer
          visible={showParroquias}
          clickThrough={addingMarker || tiempoMedioMode}
        />
        {getMarkers().map((item) => {
          const markerKey = getMarkerKey(item)
          return (
            <MarkerWithTooltip
              key={markerKey}
              item={item}
              isMobile={isMobile}
              canNavigate={canNavigateFromLocation}
              isActiveDestination={destinoNavegacion?.key === markerKey}
              isLoadingRoute={cargandoRutaHaciaPin && destinoNavegacion?.key === markerKey}
              routeOptions={destinoNavegacion?.key === markerKey ? opcionesRutaHaciaPin : []}
              selectedRouteIndex={indiceRutaHaciaPin}
              onNavigate={() =>
                navigateToPin({
                  key: markerKey,
                  nombre: item.nombre,
                  lat: item.lat,
                  lng: item.lng,
                })
              }
              onClearRoute={clearRutaHaciaPin}
              onSelectRoute={selectRutaHaciaPin}
            />
          )
        })}
        {userLocation && (
          <>
            <Circle
              center={[userLocation.lat, userLocation.lng]}
              radius={accuracyRadius}
              pathOptions={{
                color: '#2563eb',
                fillColor: '#3b82f6',
                fillOpacity: 0.16,
                weight: 1,
              }}
              interactive={false}
            />
            <Marker
              position={[userLocation.lat, userLocation.lng]}
              icon={userLocationIcon}
              zIndexOffset={2000}
            >
              <Popup>
                <strong>Tu ubicación</strong>
                <p>
                  Coordenadas: {userLocation.lat.toFixed(6)}, {userLocation.lng.toFixed(6)}
                </p>
                <p>Precisión: {Math.round(userLocation.accuracy)} m</p>
                {!isInsideMapBounds(userLocation.lat, userLocation.lng) && (
                  <p>Estás fuera del área del mapa de Cabimas.</p>
                )}
              </Popup>
            </Marker>
          </>
        )}
        {customMarker && (
          <Marker
            position={customMarker}
            draggable={true}
            icon={L.divIcon({
              html: `
                <div style="
                  background: linear-gradient(135deg, #ef4444 0%, #dc2626 100%);
                  width: 40px;
                  height: 40px;
                  border-radius: 50%;
                  display: flex;
                  align-items: center;
                  justify-content: center;
                  border: 3px solid white;
                  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3), 0 2px 4px rgba(0, 0, 0, 0.2);
                ">
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" style="filter: drop-shadow(0 1px 2px rgba(0,0,0,0.3));">
                    ${getIconSVGPath('pin')}
                  </svg>
                </div>
              `,
              className: 'custom-marker',
              iconSize: [40, 40],
              iconAnchor: [20, 20]
            })}
            eventHandlers={{
              dragend: handleDragEnd,
            }}
          >
            <Popup>
              <p>Coordenadas: {customMarker[0].toFixed(6)}, {customMarker[1].toFixed(6)}</p>
              <p>Este es un marcador personalizado. Puedes arrastrarlo para cambiar su posición.</p>
              {canNavigateFromLocation && (
                <div className="entity-navigation">
                  <RouteNavigationControls
                    isLoading={cargandoRutaHaciaPin && destinoNavegacion?.key === 'custom-pin'}
                    isActive={destinoNavegacion?.key === 'custom-pin'}
                    routeOptions={
                      destinoNavegacion?.key === 'custom-pin' ? opcionesRutaHaciaPin : []
                    }
                    selectedRouteIndex={indiceRutaHaciaPin}
                    onNavigate={() =>
                      navigateToPin({
                        key: 'custom-pin',
                        nombre: 'Pin personalizado',
                        lat: customMarker[0],
                        lng: customMarker[1],
                      })
                    }
                    onClearRoute={clearRutaHaciaPin}
                    onSelectRoute={selectRutaHaciaPin}
                  />
                </div>
              )}
              <button
                type="button"
                className="pin-delete-button"
                onMouseDown={(e) => e.stopPropagation()}
                onClick={(e) => {
                  e.preventDefault()
                  e.stopPropagation()
                  setCustomMarker(null)
                  setAddingMarker(false)
                  window.dispatchEvent(new CustomEvent('marker-removed'))
                }}
              >
                Eliminar pin
              </button>
            </Popup>
          </Marker>
        )}
        {puntoA && (
          <Marker
            position={puntoA}
            icon={L.divIcon({
              html: `
                <div style="
                  background: linear-gradient(135deg, #10b981 0%, #059669 100%);
                  width: 40px;
                  height: 40px;
                  border-radius: 50%;
                  display: flex;
                  align-items: center;
                  justify-content: center;
                  font-weight: 700;
                  font-size: 18px;
                  color: white;
                  border: 3px solid white;
                  box-shadow: 0 4px 12px rgba(16, 185, 129, 0.4), 0 2px 4px rgba(0, 0, 0, 0.2);
                  text-shadow: 0 1px 2px rgba(0,0,0,0.2);
                ">A</div>
              `,
              className: 'tiempo-medio-marker',
              iconSize: [40, 40],
              iconAnchor: [20, 20]
            })}
          >
            <Popup>
              <strong>Punto A</strong>
              <p>Coordenadas: {puntoA[0].toFixed(6)}, {puntoA[1].toFixed(6)}</p>
            </Popup>
          </Marker>
        )}
        {puntoB && (
          <Marker
            position={puntoB}
            icon={L.divIcon({
              html: `
                <div style="
                  background: linear-gradient(135deg, #ef4444 0%, #dc2626 100%);
                  width: 40px;
                  height: 40px;
                  border-radius: 50%;
                  display: flex;
                  align-items: center;
                  justify-content: center;
                  font-weight: 700;
                  font-size: 18px;
                  color: white;
                  border: 3px solid white;
                  box-shadow: 0 4px 12px rgba(239, 68, 68, 0.4), 0 2px 4px rgba(0, 0, 0, 0.2);
                  text-shadow: 0 1px 2px rgba(0,0,0,0.2);
                ">B</div>
              `,
              className: 'tiempo-medio-marker',
              iconSize: [40, 40],
              iconAnchor: [20, 20]
            })}
          >
            <Popup>
              <strong>Punto B</strong>
              <p>Coordenadas: {puntoB[0].toFixed(6)}, {puntoB[1].toFixed(6)}</p>
              {tiempoMedio && (
                <div>
                  <p><strong>Tiempo medio:</strong> {tiempoMedio.tiempo}</p>
                  <p><strong>Distancia:</strong> {tiempoMedio.distancia.toFixed(2)} km</p>
                </div>
              )}
            </Popup>
          </Marker>
        )}
        {ruta && ruta.length > 0 && (
          <Polyline
            positions={ruta}
            color="#007bff"
            weight={5}
            opacity={0.9}
            lineCap="round"
            lineJoin="round"
            smoothFactor={1}
          />
        )}
        {rutaHaciaPinActiva && rutaHaciaPinActiva.length > 0 && (
          <Polyline
            positions={rutaHaciaPinActiva}
            color="#10b981"
            weight={5}
            opacity={0.9}
            lineCap="round"
            lineJoin="round"
            smoothFactor={1}
          />
        )}
        {rutasAleatorias.map((rutaAleatoria) => (
          <div key={rutaAleatoria.id}>
            <Polyline
              positions={rutaAleatoria.coordinates}
              color={rutaAleatoria.color}
              weight={4}
              opacity={0.7}
              lineCap="round"
              lineJoin="round"
              smoothFactor={1}
            />
            <Marker
              position={rutaAleatoria.puntoA}
              icon={L.divIcon({
                html: `
                  <div style="
                    background: linear-gradient(135deg, ${rutaAleatoria.color} 0%, ${rutaAleatoria.color}dd 100%);
                    color: white;
                    width: 32px;
                    height: 32px;
                    border-radius: 50%;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    font-weight: 700;
                    font-size: 13px;
                    border: 3px solid white;
                    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3), 0 2px 4px rgba(0, 0, 0, 0.2);
                    text-shadow: 0 1px 2px rgba(0,0,0,0.2);
                  ">A${rutaAleatoria.id + 1}</div>
                `,
                className: 'ruta-aleatoria-marker',
                iconSize: [32, 32],
                iconAnchor: [16, 16]
              })}
            >
              <Popup>
                <strong>Punto A - Ruta {rutaAleatoria.id + 1}</strong>
                <p><strong>Lugar:</strong> {rutaAleatoria.nombreA || 'Desconocido'}</p>
                <p>Coordenadas: {rutaAleatoria.puntoA[0].toFixed(6)}, {rutaAleatoria.puntoA[1].toFixed(6)}</p>
                <p><strong>Tiempo:</strong> {rutaAleatoria.tiempo}</p>
                <p><strong>Distancia:</strong> {rutaAleatoria.distancia.toFixed(2)} km</p>
              </Popup>
            </Marker>
            <Marker
              position={rutaAleatoria.puntoB}
              icon={L.divIcon({
                html: `
                  <div style="
                    background: linear-gradient(135deg, ${rutaAleatoria.color} 0%, ${rutaAleatoria.color}dd 100%);
                    color: white;
                    width: 32px;
                    height: 32px;
                    border-radius: 50%;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    font-weight: 700;
                    font-size: 13px;
                    border: 3px solid white;
                    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3), 0 2px 4px rgba(0, 0, 0, 0.2);
                    text-shadow: 0 1px 2px rgba(0,0,0,0.2);
                  ">B${rutaAleatoria.id + 1}</div>
                `,
                className: 'ruta-aleatoria-marker',
                iconSize: [32, 32],
                iconAnchor: [16, 16]
              })}
            >
              <Popup>
                <strong>Punto B - Ruta {rutaAleatoria.id + 1}</strong>
                <p><strong>Lugar:</strong> {rutaAleatoria.nombreB || 'Desconocido'}</p>
                <p>Coordenadas: {rutaAleatoria.puntoB[0].toFixed(6)}, {rutaAleatoria.puntoB[1].toFixed(6)}</p>
                <p><strong>Tiempo:</strong> {rutaAleatoria.tiempo}</p>
                <p><strong>Distancia:</strong> {rutaAleatoria.distancia.toFixed(2)} km</p>
              </Popup>
            </Marker>
          </div>
        ))}
        {/* Rotas salvas visíveis apenas se foram carregadas manualmente (não automaticamente) */}
        {rutasSalvas.length > 0 && rutasSalvasCargadasManualmente && rutasSalvas.map((rutaSalva) => (
          <div key={`salva-${rutaSalva.id}`}>
            <Polyline
              positions={rutaSalva.coordinates}
              color={rutaSalva.color}
              weight={4}
              opacity={0.8}
              lineCap="round"
              lineJoin="round"
              smoothFactor={1}
            />
            <Marker
              position={rutaSalva.puntoA}
              icon={L.divIcon({
                html: `
                  <div style="
                    background: linear-gradient(135deg, ${rutaSalva.color} 0%, ${rutaSalva.color}dd 100%);
                    color: white;
                    width: 34px;
                    height: 34px;
                    border-radius: 50%;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    font-weight: 700;
                    font-size: 14px;
                    border: 3px solid white;
                    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3), 0 2px 4px rgba(0, 0, 0, 0.2);
                    text-shadow: 0 1px 2px rgba(0,0,0,0.2);
                  ">A${rutaSalva.id + 1}</div>
                `,
                className: 'ruta-salva-marker',
                iconSize: [34, 34],
                iconAnchor: [17, 17]
              })}
            >
              <Popup>
                <strong>Punto A - Ruta Guardada {rutaSalva.id + 1}</strong>
                <p><strong>Lugar:</strong> {rutaSalva.nombreA || 'Desconocido'}</p>
                <p>Coordenadas: {rutaSalva.puntoA[0].toFixed(6)}, {rutaSalva.puntoA[1].toFixed(6)}</p>
                <p><strong>Tiempo:</strong> {rutaSalva.tiempo}</p>
                <p><strong>Distancia:</strong> {rutaSalva.distancia.toFixed(2)} km</p>
              </Popup>
            </Marker>
            <Marker
              position={rutaSalva.puntoB}
              icon={L.divIcon({
                html: `
                  <div style="
                    background: linear-gradient(135deg, ${rutaSalva.color} 0%, ${rutaSalva.color}dd 100%);
                    color: white;
                    width: 34px;
                    height: 34px;
                    border-radius: 50%;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    font-weight: 700;
                    font-size: 14px;
                    border: 3px solid white;
                    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3), 0 2px 4px rgba(0, 0, 0, 0.2);
                    text-shadow: 0 1px 2px rgba(0,0,0,0.2);
                  ">B${rutaSalva.id + 1}</div>
                `,
                className: 'ruta-salva-marker',
                iconSize: [34, 34],
                iconAnchor: [17, 17]
              })}
            >
              <Popup>
                <strong>Punto B - Ruta Guardada {rutaSalva.id + 1}</strong>
                <p><strong>Lugar:</strong> {rutaSalva.nombreB || 'Desconocido'}</p>
                <p>Coordenadas: {rutaSalva.puntoB[0].toFixed(6)}, {rutaSalva.puntoB[1].toFixed(6)}</p>
                <p><strong>Tiempo:</strong> {rutaSalva.tiempo}</p>
                <p><strong>Distancia:</strong> {rutaSalva.distancia.toFixed(2)} km</p>
              </Popup>
            </Marker>
          </div>
        ))}
        {vehiculos.map((vehiculo) => {
          const mostrarRuta = rutasVisiblesAnimados.has(vehiculo.id)
          return (
            <VehiculoAnimado
              key={vehiculo.id}
              vehiculo={vehiculo}
              onLlegada={handleVehiculoLlegada}
              mostrarRuta={mostrarRuta}
              onToggleRuta={toggleRutaVehiculoAnimado}
              isMobile={isMobile}
            />
          )
        })}
        {vehiculosConRutasSalvas.map((vehiculo) => {
          const mostrarRuta = rutasVisibles.has(vehiculo.id)
          return (
            <VehiculoConRutaSalva
              key={vehiculo.id}
              vehiculo={vehiculo}
              onLlegada={handleVehiculoLlegada}
              mostrarRuta={mostrarRuta}
              onToggleRuta={toggleRutaVehiculo}
              isMobile={isMobile}
            />
          )
        })}
        <MapUpdater zoom={zoom} targetZoom={targetZoom} setZoom={setZoom} setTargetZoom={setTargetZoom} updatingZoom={updatingZoom} setUpdatingZoom={setUpdatingZoom} minZoom={minZoom} />
      </MapContainer>

      <MapLegend
        activeFilters={filters}
        visible={getMarkers().length > 0 && !hideLegend}
      />
    </div>
  )
}

export default Mapa