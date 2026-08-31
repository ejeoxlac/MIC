'use client'

import { useCallback, useEffect, useRef, useState, type RefObject } from 'react'
import type { Map as LeafletMap } from 'leaflet'
import { isInsideMapBounds, MAP_MAX_ZOOM } from '../types/map'
import '../types/events'

export type LocationStatus = 'idle' | 'locating' | 'tracking'

export interface UserLocationFix {
  lat: number
  lng: number
  accuracy: number
}

const WATCH_OPTIONS: PositionOptions = {
  enableHighAccuracy: true,
  maximumAge: 2000,
  timeout: 20000,
}

function geolocationErrorMessage(error: GeolocationPositionError): string {
  switch (error.code) {
    case error.PERMISSION_DENIED:
      return 'Permiso de ubicación denegado. Actívalo en el navegador para ver tu posición.'
    case error.POSITION_UNAVAILABLE:
      return 'No se pudo obtener tu ubicación. Revisa el GPS o la conexión.'
    case error.TIMEOUT:
      return 'Tiempo de espera agotado al obtener tu ubicación.'
    default:
      return 'No se pudo obtener tu ubicación.'
  }
}

export function useUserLocation(mapRef: RefObject<LeafletMap | null>) {
  const watchIdRef = useRef<number | null>(null)
  const hasCenteredRef = useRef(false)
  const locationRef = useRef<UserLocationFix | null>(null)
  const [status, setStatus] = useState<LocationStatus>('idle')
  const [location, setLocation] = useState<UserLocationFix | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [outsideBounds, setOutsideBounds] = useState(false)

  const stopTracking = useCallback(() => {
    if (watchIdRef.current != null && navigator.geolocation) {
      navigator.geolocation.clearWatch(watchIdRef.current)
    }
    watchIdRef.current = null
    hasCenteredRef.current = false
    locationRef.current = null
    setStatus('idle')
    setLocation(null)
    setError(null)
    setOutsideBounds(false)
    window.dispatchEvent(new CustomEvent('mi-ubicacion-changed', { detail: { active: false } }))
  }, [])

  const flyToLocation = useCallback(
    (fix: UserLocationFix) => {
      const map = mapRef.current
      if (!map || !isInsideMapBounds(fix.lat, fix.lng)) return
      const targetZoom = Math.min(MAP_MAX_ZOOM, Math.max(map.getZoom(), 15))
      map.flyTo([fix.lat, fix.lng], targetZoom, { duration: 0.75 })
    },
    [mapRef]
  )

  const startTracking = useCallback(() => {
    if (!navigator.geolocation) {
      setError('Tu navegador no soporta geolocalización.')
      setStatus('idle')
      window.dispatchEvent(new CustomEvent('mi-ubicacion-changed', { detail: { active: false } }))
      return
    }

    if (!window.isSecureContext) {
      setError('La ubicación requiere HTTPS o localhost.')
      setStatus('idle')
      window.dispatchEvent(new CustomEvent('mi-ubicacion-changed', { detail: { active: false } }))
      return
    }

    setError(null)
    setOutsideBounds(false)
    setStatus('locating')
    hasCenteredRef.current = false
    window.dispatchEvent(new CustomEvent('mi-ubicacion-changed', { detail: { active: true } }))

    watchIdRef.current = navigator.geolocation.watchPosition(
      (position) => {
        const { latitude, longitude, accuracy } = position.coords
        const fix: UserLocationFix = {
          lat: latitude,
          lng: longitude,
          accuracy: Number.isFinite(accuracy) && accuracy > 0 ? accuracy : 30,
        }
        const inside = isInsideMapBounds(fix.lat, fix.lng)
        locationRef.current = fix
        setLocation(fix)
        setOutsideBounds(!inside)
        setStatus('tracking')
        setError(null)
        if (!hasCenteredRef.current && inside && mapRef.current) {
          hasCenteredRef.current = true
          flyToLocation(fix)
        }
      },
      (geoError) => {
        if (geoError.code === geoError.PERMISSION_DENIED) {
          if (watchIdRef.current != null) {
            navigator.geolocation.clearWatch(watchIdRef.current)
            watchIdRef.current = null
          }
          hasCenteredRef.current = false
          locationRef.current = null
          setStatus('idle')
          setLocation(null)
          setOutsideBounds(false)
          setError(geolocationErrorMessage(geoError))
          window.dispatchEvent(new CustomEvent('mi-ubicacion-changed', { detail: { active: false } }))
          return
        }

        if (!locationRef.current) {
          setError(geolocationErrorMessage(geoError))
        }
      },
      WATCH_OPTIONS
    )
  }, [flyToLocation])

  useEffect(() => {
    const handleToggle = () => {
      if (watchIdRef.current != null) {
        stopTracking()
      } else {
        startTracking()
      }
    }

    const handleRecenter = () => {
      const fix = locationRef.current
      if (fix) {
        flyToLocation(fix)
      }
    }

    window.addEventListener('toggle-mi-ubicacion', handleToggle)
    window.addEventListener('recenter-mi-ubicacion', handleRecenter)

    return () => {
      window.removeEventListener('toggle-mi-ubicacion', handleToggle)
      window.removeEventListener('recenter-mi-ubicacion', handleRecenter)
      if (watchIdRef.current != null && navigator.geolocation) {
        navigator.geolocation.clearWatch(watchIdRef.current)
        watchIdRef.current = null
      }
    }
  }, [startTracking, stopTracking, flyToLocation])

  return { status, location, error, outsideBounds }
}
