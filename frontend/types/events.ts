import type { FilterCategory } from './map'
import type { MapStyle } from './map'

export interface MapStyleChangedDetail {
  style: MapStyle
}

export interface FiltersChangedDetail {
  filters: FilterCategory[]
}

export interface TiempoMedioChangedDetail {
  active: boolean
}

export interface RutasSalvasCargadasDetail {
  count?: number
}

declare global {
  interface WindowEventMap {
    'map-style-changed': CustomEvent<MapStyleChangedDetail>
    'filters-changed': CustomEvent<FiltersChangedDetail>
    'tiempo-medio-changed': CustomEvent<TiempoMedioChangedDetail>
    'rutas-salvas-cargadas': CustomEvent<RutasSalvasCargadasDetail>
    'marker-added': Event
    'add-marker': Event
    'remove-marker': Event
    'clear-tiempo-medio': Event
    'toggle-tiempo-medio': Event
    'generar-rutas-aleatorias': Event
    'limpiar-rutas-aleatorias': Event
    'cargar-rutas-salvas': Event
    'limpiar-rutas-salvas': Event
    'activar-vehiculos': Event
    'desactivar-vehiculos': Event
    'activar-vehiculos-con-rutas-salvas': Event
    'desactivar-vehiculos-con-rutas-salvas': Event
    'tiempo-medio-calculated': Event
    'tiempo-medio-cleared': Event
    'rutas-aleatorias-generadas': Event
    'rutas-aleatorias-limpiadas': Event
    'rutas-salvas-limpiadas': Event
    'vehiculos-activados': Event
    'vehiculos-desactivados': Event
    'vehiculos-con-rutas-salvas-activados': Event
    'vehiculos-con-rutas-salvas-desactivados': Event
  }
}

export {}
