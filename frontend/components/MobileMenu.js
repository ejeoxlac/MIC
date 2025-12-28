'use client'

import { useState } from 'react'
import { FiMenu, FiX } from 'react-icons/fi'
import styles from './css/MobileMenu.module.css'

export default function MobileMenu({ 
  isOpen, 
  onToggle,
  children 
}) {
  return (
    <>
      {/* Botón hamburguesa */}
      <button
        className={styles.hamburgerButton}
        onClick={onToggle}
        aria-label={isOpen ? 'Cerrar menú' : 'Abrir menú'}
      >
        {isOpen ? <FiX size={24} /> : <FiMenu size={24} />}
      </button>

      {/* Overlay */}
      {isOpen && (
        <div 
          className={styles.overlay}
          onClick={onToggle}
          aria-hidden="true"
        />
      )}

      {/* Panel móvil - Solo renderiza cuando está abierto */}
      {isOpen && (
        <div className={styles.mobilePanel}>
          {children}
        </div>
      )}
    </>
  )
}