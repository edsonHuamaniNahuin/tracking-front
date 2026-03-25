"use client"

import { useEffect, useState, useRef, useCallback } from "react"
import type { Tracking } from "@/types/tracking"
import type { VesselPosition } from "@/types/models/dashboardStats"
import { formatDateShort, formatTime, formatDate } from "@/utils/date"

// Tipo para la instancia de Leaflet importada dinámicamente
type LeafletType = typeof import('leaflet')

// ── Helpers de coordenadas ────────────────────────────────────────────────────

function latLonToUtm(lat: number, lon: number) {
    const a   = 6378137.0
    const f   = 1 / 298.257223563
    const b   = a * (1 - f)
    const e2  = 1 - (b / a) ** 2
    const ep2 = e2 / (1 - e2)
    const k0  = 0.9996

    const zone = Math.floor((lon + 180) / 6) + 1
    const phi  = (lat * Math.PI) / 180
    const lam  = (lon * Math.PI) / 180
    const lam0 = (((zone - 1) * 6 - 180 + 3) * Math.PI) / 180

    const N = a / Math.sqrt(1 - e2 * Math.sin(phi) ** 2)
    const T = Math.tan(phi) ** 2
    const C = ep2 * Math.cos(phi) ** 2
    const A = Math.cos(phi) * (lam - lam0)

    const M = a * (
          (1 - e2 / 4 - 3 * e2 ** 2 / 64  - 5  * e2 ** 3 / 256)  * phi
        - (3 * e2 / 8 + 3 * e2 ** 2 / 32  + 45 * e2 ** 3 / 1024) * Math.sin(2 * phi)
        + (15 * e2 ** 2 / 256 + 45 * e2 ** 3 / 1024)              * Math.sin(4 * phi)
        - (35 * e2 ** 3 / 3072)                                    * Math.sin(6 * phi)
    )

    let easting = k0 * N * (
        A
        + (1 - T + C) * A ** 3 / 6
        + (5 - 18 * T + T ** 2 + 72 * C - 58 * ep2) * A ** 5 / 120
    ) + 500000

    let northing = k0 * (
        M + N * Math.tan(phi) * (
            A ** 2 / 2
            + (5  - T  + 9  * C + 4  * C ** 2) * A ** 4 / 24
            + (61 - 58 * T + T ** 2 + 600 * C - 330 * ep2) * A ** 6 / 720
        )
    )
    if (lat < 0) northing += 10_000_000

    const letters     = 'CDEFGHJKLMNPQRSTUVWX'
    const letterIndex = Math.max(0, Math.min(19, Math.floor((lat + 80) / 8)))

    return {
        zone:     `${zone}${letters[letterIndex]}`,
        easting:  Math.round(easting),
        northing: Math.round(northing),
    }
}

function latLonToQuadKey(lat: number, lon: number, zoom = 15): string {
    lat = Math.max(-85.05112878, Math.min(85.05112878, lat))
    const tiles  = 1 << zoom
    const x      = Math.floor((lon + 180) / 360 * tiles)
    const sinLat = Math.sin((lat * Math.PI) / 180)
    const y      = Math.floor((0.5 - Math.log((1 + sinLat) / (1 - sinLat)) / (4 * Math.PI)) * tiles)
    const tx     = Math.max(0, Math.min(tiles - 1, x))
    const ty     = Math.max(0, Math.min(tiles - 1, y))

    let key = ''
    for (let i = zoom; i > 0; i--) {
        let digit = 0
        const mask = 1 << (i - 1)
        if ((tx & mask) !== 0) digit += 1
        if ((ty & mask) !== 0) digit += 2
        key += digit
    }
    return key
}


interface TrackingMapProps {
    trackings: Tracking[]
    selectedTracking: Tracking | null
    showTrajectory: boolean
    showAllVessels: boolean
    allVessels: VesselPosition[]
    onTrackingClick: (tracking: Tracking) => void
    height?: number
    isLoading?: boolean
}

export function TrackingMap({
    trackings,
    selectedTracking,
    showTrajectory,
    showAllVessels,
    allVessels,
    onTrackingClick,
    height = 600,
    isLoading = false
}: TrackingMapProps) {
    const [mapStatus, setMapStatus] = useState("Inicializando mapa...")
    const [isReady, setIsReady] = useState(false)
    const mapRef = useRef<HTMLDivElement>(null)
    const mapInstanceRef = useRef<import('leaflet').Map | null>(null)
    const markersRef = useRef<import('leaflet').Marker[]>([])
    const trajectoryRef = useRef<import('leaflet').Polyline | null>(null)
    const resizeObserverRef = useRef<ResizeObserver | null>(null)
    // Guardamos la instancia de L para usarla en helpers sin re-importar
    const leafletRef = useRef<LeafletType | null>(null)

    // â”€â”€ Inicializar mapa una sola vez â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
    useEffect(() => {
        let cancelled = false

        const initMap = async () => {
            if (!mapRef.current) return
            setMapStatus("Cargando Leaflet...")

            const L = (await import("leaflet")).default
            if (cancelled) return

            leafletRef.current = L

            // Limpiar instancia previa si la hubiera (HMR, re-montaje)
            if (mapInstanceRef.current) {
                mapInstanceRef.current.remove()
                mapInstanceRef.current = null
            }

            // Fix para iconos por defecto de Leaflet con bundlers
            delete (L.Icon.Default.prototype as unknown as Record<string, unknown>)._getIconUrl
            L.Icon.Default.mergeOptions({
                iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png',
                iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png',
                shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png',
            })

            const map = L.map(mapRef.current, {
                zoomControl: true,
                scrollWheelZoom: true,
                doubleClickZoom: true,
                dragging: true,
                attributionControl: true,
            }).setView([20, 0], 3)

            L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
                attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
                maxZoom: 19,
                keepBuffer: 6,
                updateWhenZooming: false,
                updateWhenIdle: true,
            }).addTo(map)

            mapInstanceRef.current = map
            setIsReady(true)
            setMapStatus("Mapa listo — selecciona una embarcación")

            // Asegurar tamaño correcto tras montaje
            setTimeout(() => map.invalidateSize(), 150)

            // Observar cambios de tamaño del contenedor para recalcular tiles
            if (mapRef.current) {
                const ro = new ResizeObserver(() => {
                    map.invalidateSize()
                })
                ro.observe(mapRef.current)
                resizeObserverRef.current = ro
            }
        }

        initMap().catch(err => {
            console.error('Error inicializando mapa:', err)
            setMapStatus(`âŒ Error al cargar el mapa`)
        })

        return () => {
            cancelled = true
            resizeObserverRef.current?.disconnect()
            resizeObserverRef.current = null
            if (mapInstanceRef.current) {
                mapInstanceRef.current.remove()
                mapInstanceRef.current = null
            }
            leafletRef.current = null
            setIsReady(false)
        }
    }, [])  // Solo al montar/desmontar

    // â”€â”€ Crear icono para punto de tracking â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
    const createTrackingIcon = useCallback((isSelected: boolean) => {
        const L = leafletRef.current!
        const size = isSelected ? 20 : 12
        const color = isSelected ? '#ef4444' : '#3b82f6'
        const border = isSelected ? '3px' : '2px'

        return L.divIcon({
            html: `<div style="
                width:${size}px;height:${size}px;
                background:${color};
                border:${border} solid white;
                border-radius:50%;
                box-shadow:0 2px 6px rgba(0,0,0,.35);
                ${isSelected ? 'outline:3px solid rgba(239,68,68,.35);' : ''}
            "></div>`,
            className: '',
            iconSize: [size, size],
            iconAnchor: [size / 2, size / 2],
            popupAnchor: [0, -(size / 2) - 2],
        })
    }, [])

    // â”€â”€ Crear icono para embarcaciÃ³n (Ãºltima posiciÃ³n) â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
    const createVesselIcon = useCallback((_vessel: VesselPosition) => {
        const L = leafletRef.current!
        return L.divIcon({
            html: `<div style="
                width:22px;height:22px;
                background:#10b981;
                border:2px solid white;
                border-radius:50%;
                box-shadow:0 2px 6px rgba(0,0,0,.25);
                display:flex;align-items:center;justify-content:center;
            ">
                <svg width="11" height="11" viewBox="0 0 24 24" fill="none"
                     stroke="white" stroke-width="2.5" stroke-linecap="round">
                    <path d="M2 21c.6.5 1.2 1 2.5 1 2.5 0 2.5-2 5-2s2.5 2 5 2 2.5-2 5-2c1.3 0 1.9-.5 2.5-1"/>
                    <path d="M19 13V7a2 2 0 0 0-2-2H7a2 2 0 0 0-2 2v6"/>
                    <path d="M19.38 20A11.6 11.6 0 0 0 21 14l-9-4-9 4c0 2.9.94 5.34 2.81 7.76"/>
                    <path d="M12 10v4"/><path d="M12 2v3"/>
                </svg>
            </div>`,
            className: '',
            iconSize: [22, 22],
            iconAnchor: [11, 11],
            popupAnchor: [0, -13],
        })
    }, [])

    // â”€â”€ Actualizar puntos/trayectoria cuando cambien los datos â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
    useEffect(() => {
        if (!isReady || !mapInstanceRef.current || !leafletRef.current) return

        const L = leafletRef.current
        const map = mapInstanceRef.current

        // Limpiar capa anterior
        markersRef.current.forEach(m => m.remove())
        markersRef.current = []
        trajectoryRef.current?.remove()
        trajectoryRef.current = null

        if (trackings.length === 0) {
            setMapStatus("Sin puntos de tracking para el período seleccionado")
            return
        }

        setMapStatus(`Cargando ${trackings.length} puntos...`)

        // Ordenar por fecha ascendente para que la trayectoria sea coherente
        const sorted = [...trackings].sort(
            (a, b) => new Date(a.tracked_at).getTime() - new Date(b.tracked_at).getTime()
        )

        // â”€â”€ Marcadores de tracking â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
        sorted.forEach((tracking, index) => {
            const lat = Number(tracking.latitude)
            const lng = Number(tracking.longitude)
            if (isNaN(lat) || isNaN(lng)) return

            const isSelected = selectedTracking?.id === tracking.id
            const marker = L.marker([lat, lng], { icon: createTrackingIcon(isSelected) })

            const utm      = latLonToUtm(lat, lng)
            const quadKey  = latLonToQuadKey(lat, lng, 15)

            marker.bindPopup(`
                <div style="min-width:230px;font-size:13px;line-height:1.7">
                    <strong style="display:block;margin-bottom:6px">
                        Punto #${index + 1} de ${sorted.length}
                    </strong>
                    <div><b>Fecha:</b> ${formatDateShort(tracking.tracked_at)}</div>
                    <div><b>Hora:</b> ${formatTime(tracking.tracked_at)}</div>
                    <hr style="margin:6px 0;border-color:#e5e7eb"/>
                    <div style="font-size:11px;color:#6b7280;margin-bottom:2px;font-weight:600;text-transform:uppercase;letter-spacing:.5px">Geográficas (WGS84)</div>
                    <div><b>Lat:</b> ${lat.toFixed(6)}°</div>
                    <div><b>Lon:</b> ${lng.toFixed(6)}°</div>
                    <hr style="margin:6px 0;border-color:#e5e7eb"/>
                    <div style="font-size:11px;color:#6b7280;margin-bottom:2px;font-weight:600;text-transform:uppercase;letter-spacing:.5px">UTM WGS84</div>
                    <div><b>Zona:</b> ${utm.zone}</div>
                    <div><b>E:</b> ${utm.easting.toLocaleString()} m</div>
                    <div><b>N:</b> ${utm.northing.toLocaleString()} m</div>
                    <hr style="margin:6px 0;border-color:#e5e7eb"/>
                    <div style="font-size:11px;color:#6b7280;margin-bottom:2px;font-weight:600;text-transform:uppercase;letter-spacing:.5px">Quad Tile (zoom 15)</div>
                    <div style="font-family:monospace;word-break:break-all;font-size:12px">${quadKey}</div>
                </div>
            `)

            marker.on('click', () => onTrackingClick(tracking))
            marker.addTo(map)
            markersRef.current.push(marker)
        })

        // â”€â”€ Trayectoria â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
        if (showTrajectory && sorted.length > 1) {
            const coords = sorted
                .map(t => [Number(t.latitude), Number(t.longitude)] as [number, number])
                .filter(([la, lo]) => !isNaN(la) && !isNaN(lo))

            if (coords.length > 1) {
                trajectoryRef.current = L.polyline(coords, {
                    color: '#3b82f6',
                    weight: 2.5,
                    opacity: 0.75,
                    dashArray: '6, 8',
                }).addTo(map)
            }
        }

        // â”€â”€ Otras embarcaciones (Ãºltima posiciÃ³n conocida) â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
        if (showAllVessels) {
            allVessels.forEach(vessel => {
                const lat = parseFloat(vessel.latitude || '0')
                const lng = parseFloat(vessel.longitude || '0')

                if (!isNaN(lat) && !isNaN(lng) && lat !== 0 && lng !== 0) {
                    const marker = L.marker([lat, lng], { icon: createVesselIcon(vessel) })
                    marker.bindPopup(`
                        <div style="font-size:13px;line-height:1.6">
                            <strong>${vessel.name}</strong>
                            ${vessel.imo ? `<div><b>IMO:</b> ${vessel.imo}</div>` : ''}
                            ${vessel.last_position_at ? `<div><b>Último reporte:</b> ${formatDate(vessel.last_position_at)}</div>` : ''}
                        </div>
                    `)
                    marker.addTo(map)
                    markersRef.current.push(marker)
                }
            })
        }

        // â”€â”€ Ajustar zoom a los marcadores â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
        if (markersRef.current.length > 0) {
            const group = L.featureGroup(markersRef.current)
            map.fitBounds(group.getBounds().pad(0.15))
        }

        setMapStatus(`${trackings.length} puntos mostrados${showTrajectory ? ' con trayectoria' : ''}`)

    }, [isReady, trackings, selectedTracking, showTrajectory, showAllVessels, allVessels,
        createTrackingIcon, createVesselIcon, onTrackingClick])

    return (
        <div style={height ? { height } : undefined} className={`relative overflow-hidden bg-slate-100 ${height ? 'rounded-lg' : 'absolute inset-0'}`}>
            <div ref={mapRef} className="w-full h-full" />

            {/* Overlay de carga */}
            {isLoading && (
                <div className="absolute inset-0 bg-white/60 flex items-center justify-center z-[1001]">
                    <div className="flex items-center gap-2 bg-white px-4 py-2 rounded-lg shadow">
                        <div className="animate-spin h-4 w-4 border-2 border-blue-500 border-t-transparent rounded-full" />
                        <span className="text-sm font-medium">Cargando datos...</span>
                    </div>
                </div>
            )}

            {/* Estado del mapa */}
            <div className="absolute top-3 left-3 bg-white/95 backdrop-blur-sm px-3 py-1.5 rounded-lg shadow border z-[1000] max-w-xs">
                <p className="text-xs font-medium text-gray-600 truncate">{mapStatus}</p>
            </div>

            {/* Leyenda */}
            <div className="absolute bottom-6 right-3 bg-white/95 backdrop-blur-sm p-3 rounded-lg shadow border z-[1000]">
                <p className="text-xs font-semibold mb-2 text-gray-700">Leyenda</p>
                <div className="space-y-1.5">
                    <div className="flex items-center gap-2 text-xs text-gray-600">
                        <div className="w-3 h-3 bg-blue-500 rounded-full border border-white shadow" />
                        Punto de tracking
                    </div>
                    <div className="flex items-center gap-2 text-xs text-gray-600">
                        <div className="w-4 h-4 bg-red-500 rounded-full border-2 border-white shadow" />
                        Seleccionado
                    </div>
                    {showTrajectory && (
                        <div className="flex items-center gap-2 text-xs text-gray-600">
                            <div className="w-6 border-t-2 border-blue-400 border-dashed" />
                            Trayectoria
                        </div>
                    )}
                    {showAllVessels && (
                        <div className="flex items-center gap-2 text-xs text-gray-600">
                            <div className="w-3 h-3 bg-emerald-500 rounded-full border border-white shadow" />
                            Otras embarcaciones
                        </div>
                    )}
                </div>
            </div>
        </div>
    )
}
