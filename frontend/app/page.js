'use client'

import dynamic from 'next/dynamic'
import { useState } from 'react'

const Mapa = dynamic(() => import('../components/Mapa'), { ssr: false })

// Componente de botón para agregar pines
const AddMarkerButton = ({ onAddMarker, onRemoveMarker, hasMarker }) => {
  const [clicked, setClicked] = useState(false)
  
  const handleClick = () => {
    if (clicked) {
      onRemoveMarker()
      setClicked(false)
    } else {
      onAddMarker()
      setClicked(true)
    }
  }
  
  return (
    <button
      onClick={handleClick}
      style={{
        padding: '10px 15px',
        backgroundColor: clicked ? '#e74c3c' : '#0077b6',
        color: 'white',
        border: 'none',
        borderRadius: '5px',
        cursor: 'pointer',
        fontWeight: 'bold',
        transition: 'all 0.3s ease',
        boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
      }}
    >
      {clicked ? 'Cancelar' : 'Agregar Pin'}
    </button>
  )
}

export default function Home() {
  const [hasMarker, setHasMarker] = useState(false)
  
  const handleAddMarker = () => {
    // Disparar un evento personalizado
    const event = new CustomEvent('add-marker')
    window.dispatchEvent(event)
    setHasMarker(true)
  }
  
  const handleRemoveMarker = () => {
    // Disparar un evento personalizado
    const event = new CustomEvent('remove-marker')
    window.dispatchEvent(event)
    setHasMarker(false)
  }
  
  return (
    <main style={{ display: 'flex', height: '100vh' }}>
      <div style={{ width: '200px', backgroundColor: '#f8f9fa', padding: '20px', display: 'flex', flexDirection: 'column', gap: '20px' }}>
        <h1 style={{ color: '#0077b6', fontSize: '24px', margin: '0' }}>Mapa Interactivo de Cabimas</h1>
        <div id="zoom-controls" style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
          <label htmlFor="zoom-range" style={{ fontWeight: 'bold', color: '#333' }}>Zoom:</label>
          <input type="range" id="zoom-range" min="13" max="16" defaultValue="14" style={{ width: '100%' }} />
        </div>
        <div id="filter-options" style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
          <label style={{ fontWeight: 'bold', color: '#333' }}>Filtros:</label>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            <label style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <input type="checkbox" id="todos-checkbox" /> Todos los pines
            </label>
            <label style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <input type="checkbox" id="salud-checkbox" /> Salud
            </label>
            <label style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <input type="checkbox" id="seguridad-checkbox" /> Seguridad
            </label>
            <label style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <input type="checkbox" id="bomberos-checkbox" /> Bomberos
            </label>
            <label style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <input type="checkbox" id="gobierno-checkbox" /> Gobierno
            </label>
          </div>
        </div>
        <AddMarkerButton 
          onAddMarker={handleAddMarker} 
          onRemoveMarker={handleRemoveMarker} 
          hasMarker={hasMarker}
        />
        <div style={{ marginTop: 'auto', paddingTop: '20px', borderTop: '1px solid #ddd' }}>
          <a 
            href="https://github.com/ejeoxlac/MIC" 
            target="_blank" 
            rel="noopener noreferrer"
            style={{ 
              display: 'flex', 
              alignItems: 'center', 
              gap: '8px', 
              color: '#0077b6', 
              textDecoration: 'none',
              fontWeight: 'bold',
              marginBottom: '10px'
            }}
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M9 19c-5 1.5-5-2.5-7-3m14 6v-3.87a3.37 3.37 0 0 0-.94-2.61c3.14-.35 6.44-1.54 6.44-7A5.44 5.44 0 0 0 20 4.77 5.07 5.07 0 0 0 19.91 1S18.73.65 16 2.48a13.38 13.38 0 0 0-7 0C6.27.65 5.09 1 5.09 1A5.07 5.07 0 0 0 5 4.77a5.44 5.44 0 0 0-1.5 3.78c0 5.42 3.3 6.61 6.44 7A3.37 3.37 0 0 0 9 18.13V22"></path>
            </svg>
            Ver código en GitHub
          </a>
          <div style={{ fontSize: '12px', color: '#666' }}>
            <p>Mapa Interactivo de Cabimas</p>
            <p>Desarrollado por: Bill Anthony Niño Riera</p>
          </div>
        </div>
      </div>
      <div style={{ flex: 1, position: 'relative' }}>
        <Mapa />
      </div>
    </main>
  )
}