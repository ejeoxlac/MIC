'use client'

import { useState, useEffect, type ReactNode } from 'react'
import styles from './css/Sidebar.module.css'
import {
  FiSearch,
  FiFilter,
  FiMapPin,
  FiNavigation,
  FiShuffle,
  FiFolder,
  FiX,
  FiPlus,
  FiClock,
  FiTrash2,
  FiTruck,
  FiStopCircle,
  FiMoon,
  FiSun,
  FiEye,
  FiEyeOff,
  FiChevronDown,
  FiChevronUp,
  FiCrosshair,
} from 'react-icons/fi'
import {
  HiOutlineBuildingOffice2,
  HiOutlineShieldCheck,
  HiOutlineFire,
  HiOutlineHome,
} from 'react-icons/hi2'
import type { FilterCategory, MapStyle } from '../types/map'
import { getMapMinZoom, MAP_MAX_ZOOM } from '../types/map'

type ButtonVariant =
  | 'primary'
  | 'danger'
  | 'success'
  | 'secondary'
  | 'purple'
  | 'info'
  | 'teal'
  | 'warning'

interface ActionButtonProps {
  onClick: () => void
  children: ReactNode
  variant?: ButtonVariant
  icon?: ReactNode
  active?: boolean
  size?: 'small' | 'medium'
  fullWidth?: boolean
}

const ActionButton = ({
  onClick,
  children,
  variant = 'primary',
  icon,
  active = false,
  size = 'medium',
  fullWidth = true,
}: ActionButtonProps) => {
  const variantClass = active ? `${variant}-active` : variant
  const sizeClass = size === 'small' ? styles.small : styles.medium
  return (
    <button
      onClick={onClick}
      className={`${styles.button} ${styles[variantClass]} ${sizeClass} ${fullWidth ? styles.fullWidth : ''}`}
    >
      {icon && <span className={styles.buttonIcon}>{icon}</span>}
      {children}
    </button>
  )
}

interface SectionProps {
  title?: string
  children: ReactNode
  icon?: ReactNode
}

const Section = ({ title, children, icon }: SectionProps) => (
  <div className={styles.section}>
    {title && (
      <h3 className={styles.sectionTitle}>
        {icon && <span className={styles.sectionIcon}>{icon}</span>}
        {title}
      </h3>
    )}
    <div className={styles.sectionContent}>{children}</div>
  </div>
)

interface CheckboxProps {
  id: string
  label: string
  checked?: boolean
  onChange?: () => void
  icon?: ReactNode
}

const Checkbox = ({ id, label, checked, onChange, icon }: CheckboxProps) => {
  const handleClick = (e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()
    const input = document.getElementById(id) as HTMLInputElement | null
    if (input) {
      input.checked = !input.checked
      input.dispatchEvent(new Event('change', { bubbles: true, cancelable: true }))
    }
    onChange?.()
  }

  return (
    <label className={styles.checkboxLabel} onClick={handleClick}>
      <input
        type="checkbox"
        id={id}
        {...(checked !== undefined
          ? { checked, readOnly: true }
          : { defaultChecked: id === 'parroquias-checkbox' })}
        onChange={() => {}}
        className={styles.checkbox}
      />
      <span className={styles.checkboxCustom}></span>
      {icon && <span className={styles.checkboxIcon}>{icon}</span>}
      <span className={styles.checkboxText}>{label}</span>
    </label>
  )
}

export interface SidebarProps {
  hasMarker: boolean
  ubicacionActiva: boolean
  tiempoMedioActive: boolean
  hasTiempoMedio: boolean
  hasRutasAleatorias: boolean
  hasRutasSalvas: boolean
  tramosRutasSalvasVisibles: boolean
  vehiculosActivos: boolean
  vehiculosConRutasSalvasActivos: boolean
  filters?: FilterCategory[]
  onAddMarker: () => void
  onRemoveMarker: () => void
  onToggleUbicacion: () => void
  onRecenterUbicacion: () => void
  onToggleTiempoMedio: () => void
  onClearTiempoMedio: () => void
  onGenerarRutasAleatorias: () => void
  onLimpiarRutasAleatorias: () => void
  onCargarRutasSalvas: () => void
  onLimpiarRutasSalvas: () => void
  onToggleTramosRutasSalvas: () => void
  onToggleVehiculos: () => void
  onToggleVehiculosConRutasSalvas: () => void
  onFilterChange?: (filterId: FilterCategory | 'todos') => void
  onMapStyleChange?: (style: MapStyle) => void
  isMobile?: boolean
  currentMapStyle?: MapStyle
  onClose?: () => void
}

export default function Sidebar({
  hasMarker,
  ubicacionActiva,
  tiempoMedioActive,
  hasTiempoMedio,
  hasRutasAleatorias,
  hasRutasSalvas,
  tramosRutasSalvasVisibles,
  vehiculosActivos,
  vehiculosConRutasSalvasActivos,
  filters = [],
  onAddMarker,
  onRemoveMarker,
  onToggleUbicacion,
  onRecenterUbicacion,
  onToggleTiempoMedio,
  onClearTiempoMedio,
  onGenerarRutasAleatorias,
  onLimpiarRutasAleatorias,
  onCargarRutasSalvas,
  onLimpiarRutasSalvas,
  onToggleTramosRutasSalvas,
  onToggleVehiculos,
  onToggleVehiculosConRutasSalvas,
  onFilterChange,
  onMapStyleChange,
  isMobile = false,
  currentMapStyle = 'local',
  onClose,
}: SidebarProps) {
  const [addingMode, setAddingMode] = useState(false)
  const [darkMode, setDarkMode] = useState(false)
  const [selectedMapStyle, setSelectedMapStyle] = useState<MapStyle>(currentMapStyle)
  const [mapStyleCollapsed, setMapStyleCollapsed] = useState(true)

  useEffect(() => {
    const savedMode = localStorage.getItem('darkMode')
    const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches
    const initialMode = savedMode ? savedMode === 'true' : prefersDark
    setDarkMode(initialMode)

    if (initialMode) {
      document.body.classList.add('dark-mode')
    }
  }, [])

  useEffect(() => {
    setSelectedMapStyle(currentMapStyle)
  }, [currentMapStyle])

  const toggleDarkMode = () => {
    const newMode = !darkMode
    setDarkMode(newMode)
    localStorage.setItem('darkMode', newMode.toString())

    if (newMode) {
      document.body.classList.add('dark-mode')
    } else {
      document.body.classList.remove('dark-mode')
    }
  }

  const handleFilterToggle = (filterId: FilterCategory | 'todos') => {
    const checkboxId = filterId === 'todos' ? 'todos-checkbox' : `${filterId}-checkbox`
    const checkbox = document.getElementById(checkboxId) as HTMLInputElement | null
    if (checkbox) {
      checkbox.checked = !checkbox.checked
      checkbox.dispatchEvent(new Event('change', { bubbles: true, cancelable: true }))
    }
    onFilterChange?.(filterId)
  }

  const handleMapStyleChange = (newStyle: MapStyle) => {
    setSelectedMapStyle(newStyle)
    window.dispatchEvent(
      new CustomEvent('map-style-changed', { detail: { style: newStyle } })
    )
    onMapStyleChange?.(newStyle)
  }

  const minZoom = getMapMinZoom(selectedMapStyle)

  const handleAddMarkerClick = () => {
    if (hasMarker) {
      onRemoveMarker()
      setAddingMode(false)
    } else if (addingMode) {
      onRemoveMarker()
      setAddingMode(false)
    } else {
      onAddMarker()
      setAddingMode(true)
    }
  }

  useEffect(() => {
    const handleMarkerAdded = () => {
      setAddingMode(false)
    }
    window.addEventListener('marker-added', handleMarkerAdded)
    return () => {
      window.removeEventListener('marker-added', handleMarkerAdded)
    }
  }, [])

  return (
    <aside
      className={`${styles.sidebar} ${darkMode ? styles.darkMode : ''} ${isMobile ? styles.mobileSidebar : ''}`}
    >
      <div className={styles.sidebarHeader}>
        <div className={styles.headerRow}>
          <div>
            <h1 className={styles.title}>Mapa Interactivo</h1>
            <p className={styles.subtitle}>Cabimas</p>
          </div>
          <div className={styles.headerActions}>
            <button
              onClick={toggleDarkMode}
              className={styles.themeToggle}
              aria-label="Alternar modo oscuro"
            >
              {darkMode ? <FiSun /> : <FiMoon />}
            </button>
            {onClose && (
              <button
                onClick={onClose}
                className={styles.closeButton}
                aria-label="Cerrar menú"
              >
                <FiX />
              </button>
            )}
          </div>
        </div>
      </div>

      <div className={styles.sidebarContent}>
        <Section title="Zoom" icon={<FiSearch />}>
          <div className={styles.zoomContainer}>
            <input
              type="range"
              id="zoom-range"
              min={minZoom}
              max={MAP_MAX_ZOOM}
              defaultValue="14"
              className={styles.zoomSlider}
            />
            <div className={styles.zoomLabels}>
              <span>{minZoom}</span>
              <span>{MAP_MAX_ZOOM}</span>
            </div>
          </div>
        </Section>

        <Section title="Filtros" icon={<FiFilter />}>
          <div className={styles.filtersList}>
            <Checkbox
              id="todos-checkbox"
              label="Todos los pines"
              checked={filters.length === 4}
              onChange={() => handleFilterToggle('todos')}
            />
            <Checkbox
              id="salud-checkbox"
              label="Salud"
              checked={filters.includes('salud')}
              onChange={() => handleFilterToggle('salud')}
              icon={<HiOutlineHome />}
            />
            <Checkbox
              id="seguridad-checkbox"
              label="Seguridad"
              checked={filters.includes('seguridad')}
              onChange={() => handleFilterToggle('seguridad')}
              icon={<HiOutlineShieldCheck />}
            />
            <Checkbox
              id="bomberos-checkbox"
              label="Bomberos"
              checked={filters.includes('bomberos')}
              onChange={() => handleFilterToggle('bomberos')}
              icon={<HiOutlineFire />}
            />
            <Checkbox
              id="gobierno-checkbox"
              label="Gobierno"
              checked={filters.includes('gobierno')}
              onChange={() => handleFilterToggle('gobierno')}
              icon={<HiOutlineBuildingOffice2 />}
            />
            <Checkbox id="parroquias-checkbox" label="Límites de parroquias" onChange={() => {}} />
          </div>
        </Section>

        <Section title="Marcadores" icon={<FiMapPin />}>
          <ActionButton
            onClick={handleAddMarkerClick}
            variant={addingMode || hasMarker ? 'danger' : 'primary'}
            icon={addingMode || hasMarker ? <FiX /> : <FiPlus />}
          >
            {hasMarker ? 'Remover Pin' : addingMode ? 'Cancelar' : 'Agregar Pin'}
          </ActionButton>
          <ActionButton
            onClick={onToggleUbicacion}
            variant={ubicacionActiva ? 'danger' : 'info'}
            icon={ubicacionActiva ? <FiX /> : <FiCrosshair />}
          >
            {ubicacionActiva ? 'Dejar de seguir' : 'Mi ubicación'}
          </ActionButton>
          {ubicacionActiva && (
            <ActionButton
              onClick={onRecenterUbicacion}
              variant="secondary"
              icon={<FiNavigation />}
              size="small"
            >
              Centrar en mí
            </ActionButton>
          )}
        </Section>

        <Section title="Rutas" icon={<FiNavigation />}>
          <ActionButton
            onClick={onToggleTiempoMedio}
            variant={tiempoMedioActive ? 'danger' : 'success'}
            icon={tiempoMedioActive ? <FiX /> : <FiClock />}
          >
            {tiempoMedioActive ? 'Cancelar' : 'Tiempo Medio'}
          </ActionButton>
          {hasTiempoMedio && !tiempoMedioActive && (
            <ActionButton
              onClick={onClearTiempoMedio}
              variant="secondary"
              icon={<FiTrash2 />}
              size="small"
            >
              Limpiar Ruta
            </ActionButton>
          )}
        </Section>

        <Section title="Rutas Aleatorias" icon={<FiShuffle />}>
          <ActionButton onClick={onGenerarRutasAleatorias} variant="purple" icon={<FiShuffle />}>
            Generar 10 Rutas
          </ActionButton>
          {hasRutasAleatorias && (
            <ActionButton
              onClick={onLimpiarRutasAleatorias}
              variant="secondary"
              icon={<FiTrash2 />}
              size="small"
            >
              Limpiar Rutas
            </ActionButton>
          )}
          {hasRutasAleatorias && (
            <ActionButton
              onClick={onToggleVehiculos}
              variant={vehiculosActivos ? 'danger' : 'info'}
              icon={vehiculosActivos ? <FiStopCircle /> : <FiTruck />}
              size="small"
            >
              {vehiculosActivos ? 'Desactivar' : 'Activar'} Veículos
            </ActionButton>
          )}
        </Section>

        <Section title="Rutas Guardadas" icon={<FiFolder />}>
          <ActionButton onClick={onCargarRutasSalvas} variant="teal" icon={<FiFolder />}>
            Cargar Rutas
          </ActionButton>
          {hasRutasSalvas && (
            <>
              <ActionButton
                onClick={onToggleTramosRutasSalvas}
                variant="info"
                icon={tramosRutasSalvasVisibles ? <FiEyeOff /> : <FiEye />}
                size="small"
              >
                {tramosRutasSalvasVisibles ? 'Ocultar tramos' : 'Ver tramos'}
              </ActionButton>
              <ActionButton
                onClick={onLimpiarRutasSalvas}
                variant="secondary"
                icon={<FiTrash2 />}
                size="small"
              >
                Limpiar Rutas
              </ActionButton>
              <ActionButton
                onClick={onToggleVehiculosConRutasSalvas}
                variant={vehiculosConRutasSalvasActivos ? 'danger' : 'warning'}
                icon={vehiculosConRutasSalvasActivos ? <FiStopCircle /> : <FiTruck />}
                size="small"
              >
                {vehiculosConRutasSalvasActivos ? 'Ocultar' : 'Mostrar'} Vehículos
              </ActionButton>
            </>
          )}
        </Section>

        <div className={`${styles.section} ${styles.mapStyleContainer}`}>
          <h3
            className={`${styles.sectionTitle} ${styles.collapsibleTitle}`}
            onClick={() => setMapStyleCollapsed(!mapStyleCollapsed)}
            style={{
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span className={styles.sectionIcon}>
                <FiMapPin />
              </span>
              <span>Estilo de Mapa</span>
            </div>
            {mapStyleCollapsed ? <FiChevronDown /> : <FiChevronUp />}
          </h3>

          {!mapStyleCollapsed && (
            <div className={styles.sectionContent}>
              <div className={styles.mapStyleOptions}>
                <Checkbox
                  id="local-checkbox"
                  label="💾 Local (offline)"
                  checked={selectedMapStyle === 'local'}
                  onChange={() => handleMapStyleChange('local')}
                />
                <Checkbox
                  id="streets-checkbox"
                  label="🗺️ OSM"
                  checked={selectedMapStyle === 'streets'}
                  onChange={() => handleMapStyleChange('streets')}
                />
                <Checkbox
                  id="satellite-checkbox"
                  label="🛰️ Satélite"
                  checked={selectedMapStyle === 'satellite'}
                  onChange={() => handleMapStyleChange('satellite')}
                />
                <Checkbox
                  id="terrain-checkbox"
                  label="🏔️ Terreno"
                  checked={selectedMapStyle === 'terrain'}
                  onChange={() => handleMapStyleChange('terrain')}
                />
                <Checkbox
                  id="dark-checkbox"
                  label="🌙 Oscuro"
                  checked={selectedMapStyle === 'dark'}
                  onChange={() => handleMapStyleChange('dark')}
                />
              </div>
            </div>
          )}
        </div>
      </div>

      <div className={styles.sidebarFooter}>
        <a
          href="https://github.com/ejeoxlac/MIC"
          target="_blank"
          rel="noopener noreferrer"
          className={styles.githubLink}
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="18"
            height="18"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M9 19c-5 1.5-5-2.5-7-3m14 6v-3.87a3.37 3.37 0 0 0-.94-2.61c3.14-.35 6.44-1.54 6.44-7A5.44 5.44 0 0 0 20 4.77 5.07 5.07 0 0 0 19.91 1S18.73.65 16 2.48a13.38 13.38 0 0 0-7 0C6.27.65 5.09 1 5.09 1A5.07 5.07 0 0 0 5 4.77a5.44 5.44 0 0 0-1.5 3.78c0 5.42 3.3 6.61 6.44 7A3.37 3.37 0 0 0 9 18.13V22"></path>
          </svg>
          Ver código en GitHub
        </a>
        <div className={styles.footerInfo}>
          <p className={styles.footerText}>Mapa Interactivo de Cabimas</p>
          <p className={styles.footerAuthor}>
            Desarrollado por: <strong>Bill Anthony Niño Riera</strong>
          </p>
        </div>
      </div>
    </aside>
  )
}
