export type FilterCategory = 'salud' | 'seguridad' | 'bomberos' | 'gobierno'

export type MapStyle = 'local' | 'streets' | 'satellite' | 'terrain' | 'dark'

export type IconType = 'home' | 'shield' | 'fire' | 'building' | 'pin'

export interface MapEntity {
  nombre: string
  lat: number
  lng: number
  servicios: string[]
  horarios: string
}

export interface SavedRoute {
  id?: string | number
  nombre?: string
  coordenadas?: [number, number][]
  [key: string]: unknown
}
