'use client'

import dynamic from 'next/dynamic'
import { useState, useEffect } from 'react'
import { FiMenu, FiX } from 'react-icons/fi'
import Sidebar from '../components/Sidebar'
import type { FilterCategory, MapStyle } from '../types/map'
import '../types/events'

const Mapa = dynamic(() => import('../components/Mapa'), { ssr: false })

export default function Home() {
  const [hasMarker, setHasMarker] = useState(false)
  const [tiempoMedioActive, setTiempoMedioActive] = useState(false)
  const [hasTiempoMedio, setHasTiempoMedio] = useState(false)
  const [hasRutasAleatorias, setHasRutasAleatorias] = useState(false)
  const [hasRutasSalvas, setHasRutasSalvas] = useState(false)
  const [vehiculosActivos, setVehiculosActivos] = useState(false)
  const [vehiculosConRutasSalvasActivos, setVehiculosConRutasSalvasActivos] = useState(false)
  const [filters, setFilters] = useState<FilterCategory[]>([
    'salud',
    'seguridad',
    'bomberos',
    'gobierno',
  ])
  const [currentMapStyle, setCurrentMapStyle] = useState<MapStyle>('local')
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)
  const [isMobile, setIsMobile] = useState(false)

  const handleFilterChange = (filterId: FilterCategory | 'todos') => {
    if (filterId === 'todos') {
      const todosCheckbox = document.getElementById('todos-checkbox') as HTMLInputElement | null
      if (todosCheckbox) {
        todosCheckbox.checked = !todosCheckbox.checked
        todosCheckbox.dispatchEvent(new Event('change', { bubbles: true }))
      }
    } else {
      const checkbox = document.getElementById(`${filterId}-checkbox`) as HTMLInputElement | null
      if (checkbox) {
        checkbox.checked = !checkbox.checked
        checkbox.dispatchEvent(new Event('change', { bubbles: true }))
      }
    }
  }

  const handleAddMarker = () => {
    window.dispatchEvent(new CustomEvent('add-marker'))
  }

  const handleRemoveMarker = () => {
    window.dispatchEvent(new CustomEvent('remove-marker'))
    setHasMarker(false)
  }

  const handleClearTiempoMedio = () => {
    window.dispatchEvent(new CustomEvent('clear-tiempo-medio'))
    setHasTiempoMedio(false)
  }

  const toggleMobileMenu = () => {
    setIsMobileMenuOpen((open) => !open)
  }

  const closeMobileMenu = () => {
    setIsMobileMenuOpen(false)
  }

  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth <= 1024)
    }

    checkMobile()
    window.addEventListener('resize', checkMobile)

    return () => window.removeEventListener('resize', checkMobile)
  }, [])

  useEffect(() => {
    const handleMarkerAdded = () => {
      setHasMarker(true)
    }

    const handleMarkerRemoved = () => {
      setHasMarker(false)
    }

    const handleTiempoMedioChanged = (e: WindowEventMap['tiempo-medio-changed']) => {
      setTiempoMedioActive(e.detail.active)
    }

    const handleTiempoMedioCalculated = () => {
      setHasTiempoMedio(true)
    }

    const handleTiempoMedioCleared = () => {
      setHasTiempoMedio(false)
    }

    const handleRutasAleatoriasGeneradas = () => {
      setHasRutasAleatorias(true)
    }

    const handleRutasAleatoriasLimpiadas = () => {
      setHasRutasAleatorias(false)
      setVehiculosActivos(false)
    }

    const handleVehiculosActivados = () => {
      setVehiculosActivos(true)
    }

    const handleVehiculosDesactivados = () => {
      setVehiculosActivos(false)
    }

    const handleRutasSalvasCargadas = (e: WindowEventMap['rutas-salvas-cargadas']) => {
      setHasRutasSalvas(true)
      if (e.detail?.count) {
        console.log(`✅ ${e.detail.count} rutas guardadas cargadas`)
      }
    }

    const handleRutasSalvasLimpiadas = () => {
      setHasRutasSalvas(false)
      setVehiculosConRutasSalvasActivos(false)
    }

    const handleVehiculosConRutasSalvasActivados = () => {
      setVehiculosConRutasSalvasActivos(true)
    }

    const handleVehiculosConRutasSalvasDesactivados = () => {
      setVehiculosConRutasSalvasActivos(false)
    }

    const handleFiltersChanged = (e: WindowEventMap['filters-changed']) => {
      if (e.detail?.filters) {
        setFilters(e.detail.filters)
      }
    }

    window.addEventListener('marker-added', handleMarkerAdded)
    window.addEventListener('marker-removed', handleMarkerRemoved)
    window.addEventListener('tiempo-medio-changed', handleTiempoMedioChanged)
    window.addEventListener('tiempo-medio-calculated', handleTiempoMedioCalculated)
    window.addEventListener('tiempo-medio-cleared', handleTiempoMedioCleared)
    window.addEventListener('rutas-aleatorias-generadas', handleRutasAleatoriasGeneradas)
    window.addEventListener('rutas-aleatorias-limpiadas', handleRutasAleatoriasLimpiadas)
    window.addEventListener('rutas-salvas-cargadas', handleRutasSalvasCargadas)
    window.addEventListener('rutas-salvas-limpiadas', handleRutasSalvasLimpiadas)
    window.addEventListener('vehiculos-activados', handleVehiculosActivados)
    window.addEventListener('vehiculos-desactivados', handleVehiculosDesactivados)
    window.addEventListener(
      'vehiculos-con-rutas-salvas-activados',
      handleVehiculosConRutasSalvasActivados
    )
    window.addEventListener(
      'vehiculos-con-rutas-salvas-desactivados',
      handleVehiculosConRutasSalvasDesactivados
    )
    window.addEventListener('filters-changed', handleFiltersChanged)

    return () => {
      window.removeEventListener('marker-added', handleMarkerAdded)
      window.removeEventListener('marker-removed', handleMarkerRemoved)
      window.removeEventListener('tiempo-medio-changed', handleTiempoMedioChanged)
      window.removeEventListener('tiempo-medio-calculated', handleTiempoMedioCalculated)
      window.removeEventListener('tiempo-medio-cleared', handleTiempoMedioCleared)
      window.removeEventListener('rutas-aleatorias-generadas', handleRutasAleatoriasGeneradas)
      window.removeEventListener('rutas-aleatorias-limpiadas', handleRutasAleatoriasLimpiadas)
      window.removeEventListener('rutas-salvas-cargadas', handleRutasSalvasCargadas)
      window.removeEventListener('rutas-salvas-limpiadas', handleRutasSalvasLimpiadas)
      window.removeEventListener('vehiculos-activados', handleVehiculosActivados)
      window.removeEventListener('vehiculos-desactivados', handleVehiculosDesactivados)
      window.removeEventListener(
        'vehiculos-con-rutas-salvas-activados',
        handleVehiculosConRutasSalvasActivados
      )
      window.removeEventListener(
        'vehiculos-con-rutas-salvas-desactivados',
        handleVehiculosConRutasSalvasDesactivados
      )
      window.removeEventListener('filters-changed', handleFiltersChanged)
    }
  }, [])

  return (
    <>
      {isMobile && (
        <button
          className="hamburger-button"
          onClick={toggleMobileMenu}
          aria-label={isMobileMenuOpen ? 'Cerrar menú' : 'Abrir menú'}
        >
          {isMobileMenuOpen ? <FiX size={24} /> : <FiMenu size={24} />}
        </button>
      )}

      {isMobile && isMobileMenuOpen && (
        <div className="app-sidebar-overlay" onClick={closeMobileMenu} />
      )}

      <main className={`app-shell${isMobile && isMobileMenuOpen ? ' sidebar-open' : ''}`}>
        <div
          className={`app-sidebar-slot${isMobile ? ' is-drawer' : ''}${
            isMobile && !isMobileMenuOpen ? ' is-closed' : ''
          }`}
        >
          <Sidebar
            hasMarker={hasMarker}
            tiempoMedioActive={tiempoMedioActive}
            hasTiempoMedio={hasTiempoMedio}
            hasRutasAleatorias={hasRutasAleatorias}
            hasRutasSalvas={hasRutasSalvas}
            vehiculosActivos={vehiculosActivos}
            vehiculosConRutasSalvasActivos={vehiculosConRutasSalvasActivos}
            filters={filters}
            onAddMarker={() => {
              handleAddMarker()
              if (isMobile) closeMobileMenu()
            }}
            onRemoveMarker={() => {
              handleRemoveMarker()
              if (isMobile) closeMobileMenu()
            }}
            onToggleTiempoMedio={() => {
              window.dispatchEvent(new CustomEvent('toggle-tiempo-medio'))
              if (isMobile) closeMobileMenu()
            }}
            onClearTiempoMedio={() => {
              handleClearTiempoMedio()
              if (isMobile) closeMobileMenu()
            }}
            onGenerarRutasAleatorias={() => {
              window.dispatchEvent(new CustomEvent('generar-rutas-aleatorias'))
              if (isMobile) closeMobileMenu()
            }}
            onLimpiarRutasAleatorias={() => {
              window.dispatchEvent(new CustomEvent('limpiar-rutas-aleatorias'))
              if (isMobile) closeMobileMenu()
            }}
            onCargarRutasSalvas={() => {
              window.dispatchEvent(new CustomEvent('cargar-rutas-salvas'))
              if (isMobile) closeMobileMenu()
            }}
            onLimpiarRutasSalvas={() => {
              window.dispatchEvent(new CustomEvent('limpiar-rutas-salvas'))
              if (isMobile) closeMobileMenu()
            }}
            onToggleVehiculos={() => {
              if (vehiculosActivos) {
                window.dispatchEvent(new CustomEvent('desactivar-vehiculos'))
              } else {
                window.dispatchEvent(new CustomEvent('activar-vehiculos'))
              }
              if (isMobile) closeMobileMenu()
            }}
            onToggleVehiculosConRutasSalvas={() => {
              if (vehiculosConRutasSalvasActivos) {
                window.dispatchEvent(new CustomEvent('desactivar-vehiculos-con-rutas-salvas'))
              } else {
                window.dispatchEvent(new CustomEvent('activar-vehiculos-con-rutas-salvas'))
              }
              if (isMobile) closeMobileMenu()
            }}
            onFilterChange={handleFilterChange}
            currentMapStyle={currentMapStyle}
            onMapStyleChange={setCurrentMapStyle}
            isMobile={isMobile}
            onClose={isMobile ? closeMobileMenu : undefined}
          />
        </div>

        <div className="app-map-slot">
          <Mapa hideLegend={isMobile && isMobileMenuOpen} />
        </div>
      </main>
    </>
  )
}
