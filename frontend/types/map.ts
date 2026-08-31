export type FilterCategory = 'salud' | 'seguridad' | 'bomberos' | 'gobierno'

export type MapStyle = 'local' | 'streets' | 'satellite' | 'terrain' | 'dark'

/** Teselas locales solo cubren 13–16; los mapas online permiten 2 niveles más de alejamiento. */
export const MAP_MAX_ZOOM = 16
export const MAP_MIN_ZOOM_LOCAL = 13
export const MAP_MIN_ZOOM_ONLINE = 11

export function getMapMinZoom(style: MapStyle): number {
  return style === 'local' ? MAP_MIN_ZOOM_LOCAL : MAP_MIN_ZOOM_ONLINE
}

/** Centro y límites de navegación del mapa (Cabimas). Coordenadas [lat, lng]. */
export const MAP_CENTER: [number, number] = [10.4, -71.45]
export const MAP_BOUNDS_SW: [number, number] = [10.3, -71.55]
export const MAP_BOUNDS_NE: [number, number] = [10.5, -70.85]

export function isInsideMapBounds(lat: number, lng: number): boolean {
  return (
    lat >= MAP_BOUNDS_SW[0] &&
    lat <= MAP_BOUNDS_NE[0] &&
    lng >= MAP_BOUNDS_SW[1] &&
    lng <= MAP_BOUNDS_NE[1]
  )
}

export type IconType = 'home' | 'shield' | 'fire' | 'building' | 'pin'

export interface SocialNetworkLink {
  nombre: string
  url: string
}

export interface MapEntity {
  nombre: string
  lat: number
  lng: number
  servicios: string[]
  horarios: string
  paginaWeb?: string
  redesSociales?: SocialNetworkLink[]
}

export interface SavedRoute {
  id?: string | number
  nombre?: string
  coordenadas?: [number, number][]
  [key: string]: unknown
}
