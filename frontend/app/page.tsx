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
      setIsMobile(window.innerWidth <= 768)
    }

    checkMobile()
    window.addEventListener('resize', checkMobile)

    return () => window.removeEventListener('resize', checkMobile)
  }, [])

  useEffect(() => {
    const handleMarkerAdded = () => {
      setHasMarker(true)
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
          style={{
            position: 'fixed',
            top: '20px',
            right: '20px',
            zIndex: 1001,
            background: 'var(--bg-primary)',
            border: '1px solid var(--border-color)',
            borderRadius: '8px',
            width: '48px',
            height: '48px',
            cursor: 'pointer',
            boxShadow: 'var(--shadow-md)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: 'var(--text-primary)',
            transition: 'all 0.2s ease',
          }}
          aria-label={isMobileMenuOpen ? 'Cerrar menú' : 'Abrir menú'}
        >
          {isMobileMenuOpen ? <FiX size={24} /> : <FiMenu size={24} />}
        </button>
      )}

      {isMobile && isMobileMenuOpen && (
        <div
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: 'rgba(0, 0, 0, 0.5)',
            zIndex: 998,
          }}
          onClick={closeMobileMenu}
        />
      )}

      <main
        style={{
          display: 'flex',
          height: '100vh',
          overflow: 'hidden',
          position: 'relative',
        }}
      >
        <div
          style={{
            transition: isMobile ? 'transform 0.3s cubic-bezier(0.25, 0.46, 0.45, 0.94)' : 'none',
            transform: isMobile && !isMobileMenuOpen ? 'translateX(-100%)' : 'translateX(0)',
            position: isMobile ? 'fixed' : 'relative',
            top: isMobile ? 0 : 'auto',
            left: isMobile ? 0 : 'auto',
            zIndex: isMobile ? 999 : 'auto',
            height: isMobile ? '100vh' : 'auto',
            width: isMobile ? '85vw' : '280px',
            maxWidth: isMobile ? '320px' : 'none',
          }}
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

        <div
          style={{
            flex: 1,
            position: 'relative',
            overflow: 'hidden',
          }}
        >
          <Mapa hideLegend={isMobile && isMobileMenuOpen} />
        </div>
      </main>
    </>
  )
}
