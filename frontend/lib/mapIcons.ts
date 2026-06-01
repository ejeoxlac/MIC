import type { FilterCategory, IconType } from '../types/map'

export const ENTITY_LEGEND: Record<
  FilterCategory,
  { label: string; color: string; icon: IconType }
> = {
  salud: { label: '🏥 Salud', color: '#3b82f6', icon: 'home' },
  seguridad: { label: '🚔 Seguridad', color: '#2563eb', icon: 'shield' },
  bomberos: { label: '🚒 Bomberos', color: '#ef4444', icon: 'fire' },
  gobierno: { label: '🏛️ Gobierno', color: '#8b5cf6', icon: 'building' },
}

export function getIconSVGPath(iconType: IconType): string {
  const paths: Record<IconType, string> = {
    home: '<path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"></path><polyline points="9 22 9 12 15 12 15 22"></polyline>',
    shield: '<path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"></path>',
    fire: '<path d="M8.5 14.5A2.5 2.5 0 0 0 11 12c0-1.38-.5-2-1-3-1.072-2.143-.224-4.054 2-6 .5 2.5 2 4.9 4 6.5 2 1.6 3 3.5 3 5.5a7 7 0 1 1-14 0c0-1.153.433-2.294 1-3a2.5 2.5 0 0 0 2.5 2.5z"></path>',
    building:
      '<path d="M3 21h18"></path><path d="M5 21V7l8-4v18"></path><path d="M19 21V11l-6-4"></path><line x1="9" y1="9" x2="9" y2="9"></line><line x1="9" y1="12" x2="9" y2="12"></line><line x1="9" y1="15" x2="9" y2="15"></line><line x1="9" y1="18" x2="9" y2="18"></line>',
    pin: '<path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"></path><circle cx="12" cy="10" r="3"></circle>',
  }
  return paths[iconType] || paths.pin
}
