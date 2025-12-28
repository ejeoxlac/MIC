'use client'

import { useState, useEffect } from 'react'
import styles from './Sidebar.module.css'
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
  FiSun
} from 'react-icons/fi'
import { 
  HiOutlineBuildingOffice2,
  HiOutlineShieldCheck,
  HiOutlineFire,
  HiOutlineHome
} from 'react-icons/hi2'

// Componente de botão reutilizável
const ActionButton = ({ 
  onClick, 
  children, 
  variant = 'primary', 
  icon, 
  active = false,
  size = 'medium',
  fullWidth = true 
}) => {
  const variantClass = active ? `${variant}-active` : variant
  const sizeClass = size === 'small' ? styles.small : styles.medium
  return (
    <button
      onClick={onClick}
      className={`${styles.button} ${styles[variantClass]} ${sizeClass} ${fullWidth ? styles.fullWidth : ''}`}
    >
      {icon && <span className={styles.buttonIcon}>{typeof icon === 'string' ? icon : icon}</span>}
      {children}
    </button>
  )
}

// Componente de seção
const Section = ({ title, children, icon }) => (
  <div className={styles.section}>
    {title && (
      <h3 className={styles.sectionTitle}>
        {icon && <span className={styles.sectionIcon}>{typeof icon === 'string' ? icon : icon}</span>}
        {title}
      </h3>
    )}
    <div className={styles.sectionContent}>
      {children}
    </div>
  </div>
)

// Componente de checkbox customizado
const Checkbox = ({ id, label, checked, onChange, icon }) => {
  const handleClick = (e) => {
    e.preventDefault()
    e.stopPropagation()
    // Disparar o evento change no input real
    const input = document.getElementById(id)
    if (input) {
      const newChecked = !input.checked
      input.checked = newChecked
      // Disparar evento change que o Mapa.js está escutando
      const changeEvent = new Event('change', { bubbles: true, cancelable: true })
      input.dispatchEvent(changeEvent)
    }
  }

  return (
    <label className={styles.checkboxLabel} onClick={handleClick}>
      <input
        type="checkbox"
        id={id}
        checked={checked}
        onChange={() => {}} // Handler vazio, o evento é disparado manualmente
        className={styles.checkbox}
        readOnly
      />
      <span className={styles.checkboxCustom}></span>
      {icon && <span className={styles.checkboxIcon}>{icon}</span>}
      <span className={styles.checkboxText}>{label}</span>
    </label>
  )
}

export default function Sidebar({
  hasMarker,
  tiempoMedioActive,
  hasTiempoMedio,
  hasRutasAleatorias,
  hasRutasSalvas,
  vehiculosActivos,
  vehiculosConRutasSalvasActivos,
  filters = [],
  onAddMarker,
  onRemoveMarker,
  onToggleTiempoMedio,
  onClearTiempoMedio,
  onGenerarRutasAleatorias,
  onLimpiarRutasAleatorias,
  onCargarRutasSalvas,
  onLimpiarRutasSalvas,
  onToggleVehiculos,
  onToggleVehiculosConRutasSalvas,
  onFilterChange
}) {
  const [addingMode, setAddingMode] = useState(false)
  const [darkMode, setDarkMode] = useState(false)
  
  useEffect(() => {
    // Verificar preferência salva ou padrão do sistema
    const savedMode = localStorage.getItem('darkMode')
    const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches
    const initialMode = savedMode ? savedMode === 'true' : prefersDark
    setDarkMode(initialMode)
    
    // Aplicar classe ao body
    if (initialMode) {
      document.body.classList.add('dark-mode')
    }
  }, [])
  
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
  
  const handleFilterToggle = (filterId) => {
    // Disparar evento diretamente no checkbox para garantir que o Mapa.js receba
    if (filterId === 'todos') {
      const checkbox = document.getElementById('todos-checkbox')
      if (checkbox) {
        const newChecked = !checkbox.checked
        checkbox.checked = newChecked
        // Disparar evento change que o Mapa.js está escutando
        const changeEvent = new Event('change', { bubbles: true, cancelable: true })
        checkbox.dispatchEvent(changeEvent)
      }
    } else {
      const checkbox = document.getElementById(`${filterId}-checkbox`)
      if (checkbox) {
        const newChecked = !checkbox.checked
        checkbox.checked = newChecked
        // Disparar evento change que o Mapa.js está escutando
        const changeEvent = new Event('change', { bubbles: true, cancelable: true })
        checkbox.dispatchEvent(changeEvent)
      }
    }
    
    // Também chamar o callback se existir
    if (onFilterChange) {
      onFilterChange(filterId)
    }
  }

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
    <aside className={`${styles.sidebar} ${darkMode ? styles.darkMode : ''}`}>
      <div className={styles.sidebarHeader}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', width: '100%' }}>
          <div>
            <h1 className={styles.title}>Mapa Interactivo</h1>
            <p className={styles.subtitle}>Cabimas</p>
          </div>
          <button
            onClick={toggleDarkMode}
            className={styles.themeToggle}
            aria-label="Alternar modo escuro"
          >
            {darkMode ? <FiSun /> : <FiMoon />}
          </button>
        </div>
      </div>

      <div className={styles.sidebarContent}>
        {/* Controles de Zoom */}
        <Section title="Zoom" icon={<FiSearch />}>
          <div className={styles.zoomContainer}>
            <input
              type="range"
              id="zoom-range"
              min="13"
              max="16"
              defaultValue="14"
              className={styles.zoomSlider}
            />
            <div className={styles.zoomLabels}>
              <span>13</span>
              <span>16</span>
            </div>
          </div>
        </Section>

        {/* Filtros */}
        <Section title="Filtros" icon={<FiFilter />}>
          <div className={styles.filtersList}>
            <Checkbox 
              id="todos-checkbox" 
              label="Todos los pines" 
              checked={filters ? filters.length === 4 : false}
              onChange={() => handleFilterToggle('todos')}
            />
            <Checkbox 
              id="salud-checkbox" 
              label="Salud" 
              checked={filters && filters.includes('salud')}
              onChange={() => handleFilterToggle('salud')}
              icon={<HiOutlineHome />}
            />
            <Checkbox 
              id="seguridad-checkbox" 
              label="Seguridad" 
              checked={filters && filters.includes('seguridad')}
              onChange={() => handleFilterToggle('seguridad')}
              icon={<HiOutlineShieldCheck />}
            />
            <Checkbox 
              id="bomberos-checkbox" 
              label="Bomberos" 
              checked={filters && filters.includes('bomberos')}
              onChange={() => handleFilterToggle('bomberos')}
              icon={<HiOutlineFire />}
            />
            <Checkbox 
              id="gobierno-checkbox" 
              label="Gobierno" 
              checked={filters && filters.includes('gobierno')}
              onChange={() => handleFilterToggle('gobierno')}
              icon={<HiOutlineBuildingOffice2 />}
            />
          </div>
        </Section>

        {/* Marcadores */}
        <Section title="Marcadores" icon={<FiMapPin />}>
          <ActionButton
            onClick={handleAddMarkerClick}
            variant={addingMode || hasMarker ? 'danger' : 'primary'}
            icon={addingMode || hasMarker ? <FiX /> : <FiPlus />}
          >
            {hasMarker ? 'Remover Pin' : addingMode ? 'Cancelar' : 'Agregar Pin'}
          </ActionButton>
        </Section>

        {/* Tiempo Medio */}
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

        {/* Rutas Aleatorias */}
        <Section title="Rutas Aleatorias" icon={<FiShuffle />}>
          <ActionButton
            onClick={onGenerarRutasAleatorias}
            variant="purple"
            icon={<FiShuffle />}
          >
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

        {/* Rutas Guardadas */}
        <Section title="Rutas Guardadas" icon={<FiFolder />}>
          <ActionButton
            onClick={onCargarRutasSalvas}
            variant="teal"
            icon={<FiFolder />}
          >
            Cargar Rutas
          </ActionButton>
          {hasRutasSalvas && (
            <>
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
                {vehiculosConRutasSalvasActivos ? 'Ocultar' : 'Mostrar'} Veículos
              </ActionButton>
            </>
          )}
        </Section>
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
