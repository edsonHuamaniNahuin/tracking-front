"use client"

import { useEffect, useRef } from "react"
import type { VesselTelemetry, RouteWaypoint } from "@/types/models/vesselTelemetry"
import { formatDateTime } from "@/utils/date"

type LeafletType = typeof import('leaflet')

interface TelemetryLiveMapProps {
    position: VesselTelemetry | null
    vesselName?: string
    route?: RouteWaypoint[]
    height?: number
}

/**
 * Mapa Leaflet que muestra la posición en vivo de una embarcación.
 * Actualiza el marcador sin re-inicializar el mapa cuando cambia `position`.
 * Dibuja la ruta óptima si se provee `route`.
 */
export function TelemetryLiveMap({
    position,
    vesselName = "Unidad",
    route,
    height = 420,
}: TelemetryLiveMapProps) {
    const mapRef = useRef<HTMLDivElement>(null)
    const mapInstance = useRef<import('leaflet').Map | null>(null)
    const markerRef = useRef<import('leaflet').Marker | null>(null)
    const routeRef = useRef<import('leaflet').Polyline | null>(null)
    const leafletRef = useRef<LeafletType | null>(null)

    // ── Inicializa el mapa una sola vez ──────────────────────────────────────
    useEffect(() => {
        let cancelled = false

        const init = async () => {
            if (!mapRef.current || mapInstance.current) return

            const L = (await import("leaflet")).default
            if (cancelled) return

            leafletRef.current = L

            delete (L.Icon.Default.prototype as unknown as Record<string, unknown>)._getIconUrl
            L.Icon.Default.mergeOptions({
                iconRetinaUrl:
                    'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png',
                iconUrl:
                    'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png',
                shadowUrl:
                    'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png',
            })

            const map = L.map(mapRef.current, {
                zoomControl: true,
                scrollWheelZoom: true,
                dragging: true,
            }).setView([20, 0], 3)

            L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
                attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
                maxZoom: 19,
            }).addTo(map)

            mapInstance.current = map
        }

        init()
        return () => {
            cancelled = true
        }
    }, [])

    // ── Actualiza posición del barco cuando cambian los datos ─────────────────
    useEffect(() => {
        const L = leafletRef.current
        const map = mapInstance.current
        if (!L || !map || !position) return

        const latlng: [number, number] = [position.lat, position.lng]

        if (markerRef.current) {
            markerRef.current.setLatLng(latlng)
        } else {
            // Ícono personalizado de barco (azul)
            const shipIcon = L.divIcon({
                className: '',
                html: `<div style="
          width:32px;height:32px;border-radius:50%;
          background:#2563eb;border:3px solid white;
          box-shadow:0 2px 8px rgba(0,0,0,0.4);
          display:flex;align-items:center;justify-content:center;
          font-size:16px;
        ">⚓</div>`,
                iconSize: [32, 32],
                iconAnchor: [16, 16],
                popupAnchor: [0, -20],
            })

            markerRef.current = L.marker(latlng, { icon: shipIcon })
                .addTo(map)
        }

        // Popup con datos de telemetría
        const popupContent = `
      <div style="min-width:160px;font-size:13px">
        <strong>${vesselName}</strong><br/>
        <span>🧭 ${position.course != null ? `${position.course.toFixed(0)}°` : '—'}</span><br/>
        <span>⚡ ${position.speed.toFixed(1)} kn</span><br/>
        ${position.fuel_level != null ? `<span>⛽ ${position.fuel_level.toFixed(1)}%</span><br/>` : ''}
        ${position.rpm != null ? `<span>🔄 ${position.rpm} RPM</span><br/>` : ''}
        <span style="color:#888;font-size:11px">${formatDateTime(position.recorded_at)}</span>
      </div>
    `
        markerRef.current.bindPopup(popupContent)

        map.setView(latlng, Math.max(map.getZoom(), 8), { animate: true })
    }, [position, vesselName])

    // ── Dibuja/actualiza la ruta óptima ──────────────────────────────────────
    useEffect(() => {
        const L = leafletRef.current
        const map = mapInstance.current
        if (!L || !map) return

        if (routeRef.current) {
            routeRef.current.remove()
            routeRef.current = null
        }

        if (route && route.length >= 2) {
            const latlngs = route.map(wp => [wp.lat, wp.lng] as [number, number])
            routeRef.current = L.polyline(latlngs, {
                color: '#f59e0b',
                weight: 3,
                opacity: 0.85,
                dashArray: '8 6',
            }).addTo(map)

            // Marcador de destino
            const destIcon = L.divIcon({
                className: '',
                html: `<div style="
          width:26px;height:26px;border-radius:50%;
          background:#f59e0b;border:3px solid white;
          box-shadow:0 2px 8px rgba(0,0,0,0.4);
          display:flex;align-items:center;justify-content:center;
          font-size:13px;
        ">🏁</div>`,
                iconSize: [26, 26],
                iconAnchor: [13, 13],
            })
            L.marker(latlngs[latlngs.length - 1], { icon: destIcon }).addTo(map)

            map.fitBounds(routeRef.current.getBounds(), { padding: [40, 40] })
        }
    }, [route])

    return (
        <div
            ref={mapRef}
            style={{ height, width: '100%', borderRadius: '0.5rem', overflow: 'hidden' }}
        />
    )
}
