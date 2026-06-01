'use client'

import type { FilterCategory } from '../types/map'
import { ENTITY_LEGEND, getIconSVGPath } from '../lib/mapIcons'
import styles from './css/MapLegend.module.css'

interface MapLegendProps {
  activeFilters: FilterCategory[]
  visible?: boolean
}

export default function MapLegend({ activeFilters, visible = true }: MapLegendProps) {
  if (!visible || activeFilters.length === 0) return null

  return (
    <div className={styles.legend} role="region" aria-label="Leyenda de tipos de entidades">
      <p className={styles.title}>Tipos de Entidades:</p>
      {activeFilters.map((key) => {
        const { label, color, icon } = ENTITY_LEGEND[key]
        return (
          <div key={key} className={styles.row}>
            <div
              className={styles.iconCircle}
              style={{
                background: `linear-gradient(135deg, ${color} 0%, ${color}dd 100%)`,
              }}
            >
              <svg
                width="10"
                height="10"
                viewBox="0 0 24 24"
                fill="none"
                stroke="white"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                aria-hidden="true"
                // eslint-disable-next-line react/no-danger
                dangerouslySetInnerHTML={{ __html: getIconSVGPath(icon) }}
              />
            </div>
            <span className={styles.chip} style={{ backgroundColor: color }}>
              {label}
            </span>
          </div>
        )
      })}
    </div>
  )
}
