'use client'

import type { ReactNode } from 'react'
import { FiMenu, FiX } from 'react-icons/fi'
import styles from './css/MobileMenu.module.css'

interface MobileMenuProps {
  isOpen: boolean
  onToggle: () => void
  children: ReactNode
}

export default function MobileMenu({ isOpen, onToggle, children }: MobileMenuProps) {
  return (
    <>
      <button
        className={styles.hamburgerButton}
        onClick={onToggle}
        aria-label={isOpen ? 'Cerrar menú' : 'Abrir menú'}
      >
        {isOpen ? <FiX size={24} /> : <FiMenu size={24} />}
      </button>

      {isOpen && (
        <div className={styles.overlay} onClick={onToggle} aria-hidden="true" />
      )}

      {isOpen && <div className={styles.mobilePanel}>{children}</div>}
    </>
  )
}
