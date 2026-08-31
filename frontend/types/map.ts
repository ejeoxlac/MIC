export type FilterCategory = 'salud' | 'seguridad' | 'bomberos' | 'gobierno'

export type MapStyle = 'local' | 'streets' | 'satellite' | 'terrain' | 'dark'

/** Teselas locales solo cubren 13–16; los mapas online permiten 2 niveles más de alejamiento. */
export const MAP_MAX_ZOOM = 16
export const MAP_MIN_ZOOM_LOCAL = 13
export const MAP_MIN_ZOOM_ONLINE = 11

export function getMapMinZoom(style: MapStyle): number {
  return style === 'local' ? MAP_MIN_ZOOM_LOCAL : MAP_MIN_ZOOM_ONLINE
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
