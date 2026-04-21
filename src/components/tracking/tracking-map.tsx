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

    const easting = k0 * N * (
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

// ── Popup HTML compacto ───────────────────────────────────────────────────────
function buildPopupHtml(
    index: number,
    total: number,
    tracking: Tracking,
    lat: number,
    lng: number,
    utm: ReturnType<typeof latLonToUtm>,
    quadKey: string,
    isLast: boolean,
): string {
    const badge = isLast
        ? `<span style="background:#f59e0b;color:#fff;font-size:9px;font-weight:700;padding:1px 6px;border-radius:9999px;text-transform:uppercase;letter-spacing:.4px">Último</span>`
        : ''

    return `
    <div style="font-family:system-ui,-apple-system,sans-serif;width:230px;font-size:12px;color:#111827">

      <!-- Header -->
      <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:8px;padding-bottom:6px;border-bottom:1px solid #f3f4f6">
        <span style="font-weight:700;font-size:12px">Punto ${index} <span style="font-weight:400;color:#6b7280">/ ${total}</span></span>
        ${badge}
      </div>

      <!-- Fecha/hora -->
      <div style="display:flex;gap:12px;margin-bottom:8px">
        <div>
          <div style="font-size:9px;font-weight:600;color:#9ca3af;text-transform:uppercase;letter-spacing:.4px;margin-bottom:1px">Fecha</div>
          <div style="color:#374151">${formatDateShort(tracking.tracked_at)}</div>
        </div>
        <div>
          <div style="font-size:9px;font-weight:600;color:#9ca3af;text-transform:uppercase;letter-spacing:.4px;margin-bottom:1px">Hora</div>
          <div style="color:#374151">${formatTime(tracking.tracked_at)}</div>
        </div>
      </div>

      <!-- Coords WGS84 -->
      <div style="background:#f9fafb;border-radius:6px;padding:7px 8px;margin-bottom:6px">
        <div style="font-size:9px;font-weight:700;color:#6b7280;text-transform:uppercase;letter-spacing:.4px;margin-bottom:4px">Geográficas (WGS84)</div>
        <div style="display:grid;grid-template-columns:1fr 1fr;gap:2px;font-family:monospace;font-size:11px;color:#111827">
          <div><span style="color:#9ca3af">Lat </span>${lat.toFixed(6)}°</div>
          <div><span style="color:#9ca3af">Lon </span>${lng.toFixed(6)}°</div>
        </div>
      </div>

      <!-- UTM + QuadKey -->
      <div style="display:grid;grid-template-columns:1fr 1fr;gap:6px">
        <div style="background:#f9fafb;border-radius:6px;padding:7px 8px">
          <div style="font-size:9px;font-weight:700;color:#6b7280;text-transform:uppercase;letter-spacing:.4px;margin-bottom:4px">UTM ${utm.zone}</div>
          <div style="font-family:monospace;font-size:10px;color:#111827;line-height:1.6">
            <div><span style="color:#9ca3af">E </span>${utm.easting.toLocaleString()}</div>
            <div><span style="color:#9ca3af">N </span>${utm.northing.toLocaleString()}</div>
          </div>
        </div>
        <div style="background:#f9fafb;border-radius:6px;padding:7px 8px">
          <div style="font-size:9px;font-weight:700;color:#6b7280;text-transform:uppercase;letter-spacing:.4px;margin-bottom:4px">Quad z15</div>
          <div style="font-family:monospace;font-size:9px;color:#374151;word-break:break-all;line-height:1.5">${quadKey}</div>
        </div>
      </div>
    </div>`
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
    isLive?: boolean
}

export function TrackingMap({
    trackings,
    selectedTracking,
    showTrajectory,
    showAllVessels,
    allVessels,
    onTrackingClick,
    height,
    isLoading = false,
    isLive = false,
}: TrackingMapProps) {
    const [mapStatus, setMapStatus] = useState("Inicializando mapa...")
    const [isReady, setIsReady] = useState(false)
    const mapRef         = useRef<HTMLDivElement>(null)
    const mapInstanceRef = useRef<import('leaflet').Map | null>(null)
    // Map<trackingId, Marker> — solo los marcadores actualmente en pantalla
    const markersMapRef    = useRef<Map<number, import('leaflet').Marker>>(new Map())
    // Map<trackingId, seqNum> — número local (1..N visibles) de cada marcador
    const seqNumMapRef     = useRef<Map<number, number>>(new Map())
    // LayerGroup para markers de tracking (sin cluster — la decimación lo reemplaza)
    const trackingLayerRef = useRef<import('leaflet').LayerGroup | null>(null)
    const trajectoryRef    = useRef<import('leaflet').Polyline | null>(null)
    const resizeObserverRef = useRef<ResizeObserver | null>(null)
    const leafletRef       = useRef<LeafletType | null>(null)
    // Timer del debounce de renderizado
    const renderTimerRef   = useRef<ReturnType<typeof setTimeout> | null>(null)
    // Ref estable al renderVisibleMarkers actual (para usarlo desde el event listener del mapa)
    const renderFnRef      = useRef<() => void>(() => { /* noop inicial */ })
    // Refs auxiliares para el efecto de selección
    const lastTrackingIdRef   = useRef<number | null>(null)
    const sortedTrackingsRef  = useRef<Tracking[]>([])
    const prevSelectedIdRef   = useRef<number | null>(null)
    // Ref estable para leer selectedTracking desde Effect 1 sin añadirlo como dep
    const selectedTrackingRef = useRef<Tracking | null>(null)
    useEffect(() => { selectedTrackingRef.current = selectedTracking }, [selectedTracking])

    // ── Inicializar mapa una sola vez ─────────────────────────────────────────
    useEffect(() => {
        let cancelled = false

        const initMap = async () => {
            if (!mapRef.current) return
            setMapStatus("Cargando Leaflet...")

            const L = (await import("leaflet")).default
            if (cancelled) return

            // Importar markercluster solo por CSS (ya no lo usamos para markers de tracking)
            await import('leaflet.markercluster/dist/MarkerCluster.css')
            await import('leaflet.markercluster/dist/MarkerCluster.Default.css')

            leafletRef.current = L

            // Inyectar CSS de animación para el marcador "último punto"
            if (!document.getElementById('tm-styles')) {
                const s = document.createElement('style')
                s.id = 'tm-styles'
                s.textContent = `
                  @keyframes tm-pulse{0%{transform:scale(1);opacity:.7}70%{transform:scale(2.6);opacity:0}100%{transform:scale(2.6);opacity:0}}
                  .tm-last-ring{animation:tm-pulse 2s cubic-bezier(.455,.03,.515,.955) infinite}
                `
                document.head.appendChild(s)
            }

            if (mapInstanceRef.current) {
                mapInstanceRef.current.remove()
                mapInstanceRef.current = null
            }

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

            // LayerGroup para todos los marcadores de tracking (la decimación controla
            // cuántos hay en pantalla — no necesitamos cluster)
            trackingLayerRef.current = L.layerGroup().addTo(map)

            // Listener de movimiento/zoom → re-renderiza marcadores con debounce
            const debouncedRender = () => {
                if (renderTimerRef.current) clearTimeout(renderTimerRef.current)
                renderTimerRef.current = setTimeout(() => renderFnRef.current(), 120)
            }
            map.on('zoomend moveend', debouncedRender)

            setIsReady(true)
            setMapStatus("Mapa listo — selecciona una embarcación")

            setTimeout(() => map.invalidateSize(), 100)
            setTimeout(() => map.invalidateSize(), 400)
            setTimeout(() => map.invalidateSize(), 800)

            if (mapRef.current) {
                const ro = new ResizeObserver(() => map.invalidateSize())
                ro.observe(mapRef.current)
                resizeObserverRef.current = ro
            }
        }

        initMap().catch(err => {
            console.error('Error inicializando mapa:', err)
            setMapStatus('Error al cargar el mapa')
        })

        return () => {
            cancelled = true
            if (renderTimerRef.current) clearTimeout(renderTimerRef.current)
            resizeObserverRef.current?.disconnect()
            resizeObserverRef.current = null
            if (mapInstanceRef.current) {
                mapInstanceRef.current.remove()
                mapInstanceRef.current = null
            }
            trackingLayerRef.current = null
            leafletRef.current = null
            setIsReady(false)
        }
    }, [])

    // ── Icono de punto de tracking con número secuencial ────────────────────
    // isSelected > isLast > normal
    const createTrackingIcon = useCallback((isSelected: boolean, isLast: boolean, seqNum: number) => {
        const L      = leafletRef.current!
        const digits = String(seqNum).length
        // Tamaño base crece ligeramente con los dígitos para legibilidad
        const base   = digits <= 2 ? 18 : digits <= 3 ? 20 : 22
        const size   = isSelected ? base + 4 : isLast ? base + 2 : base
        const fs     = digits <= 1 ? 10 : digits === 2 ? 9 : digits === 3 ? 8 : 7

        const numStyle = `display:flex;align-items:center;justify-content:center;
            font-family:system-ui;font-size:${fs}px;font-weight:700;color:white;line-height:1;`

        let html: string
        if (isSelected) {
            html = `<div style="
                width:${size}px;height:${size}px;
                background:#ef4444;
                border:2.5px solid white;
                border-radius:50%;
                box-shadow:0 0 0 3px rgba(239,68,68,.30), 0 2px 6px rgba(0,0,0,.35);
                ${numStyle}
            ">${seqNum}</div>`
        } else if (isLast) {
            html = `<div style="position:relative;width:${size}px;height:${size}px">
                <div class="tm-last-ring" style="
                    position:absolute;inset:0;
                    background:#f59e0b;
                    border-radius:50%;
                "></div>
                <div style="
                    position:absolute;inset:0;
                    background:#f59e0b;
                    border:2px solid white;
                    border-radius:50%;
                    box-shadow:0 2px 6px rgba(0,0,0,.35);
                    ${numStyle}
                ">${seqNum}</div>
            </div>`
        } else {
            html = `<div style="
                width:${size}px;height:${size}px;
                background:#3b82f6;
                border:1.5px solid white;
                border-radius:50%;
                box-shadow:0 1px 4px rgba(0,0,0,.3);
                ${numStyle}
            ">${seqNum}</div>`
        }

        return L.divIcon({
            html,
            className: '',
            iconSize:   [size, size],
            iconAnchor: [size / 2, size / 2],
            popupAnchor: [0, -(size / 2) - 2],
        })
    }, [])

    // ── Icono para otras embarcaciones ────────────────────────────────────────
    const createVesselIcon = useCallback((vessel: VesselPosition) => {
        void vessel
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
            iconSize:   [22, 22],
            iconAnchor: [11, 11],
            popupAnchor: [0, -13],
        })
    }, [])

    // ── Decimación por zoom ───────────────────────────────────────────────────
    // Retorna cada cuántos puntos del dataset se muestra uno en pantalla.
    // A más zoom → más resolución; a menos zoom → menos puntos (más rápido).
    const getDecimationStep = (zoom: number): number => {
        if (zoom >= 17) return 1
        if (zoom >= 15) return 2
        if (zoom >= 13) return 5
        if (zoom >= 11) return 15
        if (zoom >= 9)  return 40
        if (zoom >= 7)  return 100
        return 300
    }
    const MAX_VISIBLE = 700   // cap duro: nunca más de 700 markers en DOM

    // ── Render dinámico por viewport ─────────────────────────────────────────
    // Se llama en cada zoomend/moveend (con debounce) y cuando cambian los datos.
    // Limpia los marcadores anteriores y crea SOLO los puntos visibles+decimados,
    // numerados 1..N — el usuario ve dónde empieza y dónde termina en su zoom.
    const renderVisibleMarkers = useCallback(() => {
        const L     = leafletRef.current
        const map   = mapInstanceRef.current
        const layer = trackingLayerRef.current
        if (!L || !map || !layer) return

        const sorted = sortedTrackingsRef.current
        if (sorted.length === 0) return

        const zoom   = map.getZoom()
        const bounds = map.getBounds().pad(0.2)  // padding 20% alrededor del viewport
        const step   = getDecimationStep(zoom)

        // 1. Decimar el dataset global según el zoom actual
        const decimated: Tracking[] = []
        for (let i = 0; i < sorted.length; i += step) decimated.push(sorted[i])
        // Siempre incluir el último punto (posición más reciente)
        const globalLast = sorted[sorted.length - 1]
        if (decimated[decimated.length - 1]?.id !== globalLast.id) decimated.push(globalLast)

        // 2. Filtrar a los que están dentro del viewport actual
        const visible = decimated.filter(t => {
            const lat = Number(t.latitude)
            const lng = Number(t.longitude)
            return !isNaN(lat) && !isNaN(lng) && bounds.contains(L.latLng(lat, lng))
        })

        // 3. Limitar al cap duro
        const toRender = visible.slice(0, MAX_VISIBLE)

        // 4. Limpiar capa y refs
        layer.clearLayers()
        markersMapRef.current.clear()
        seqNumMapRef.current.clear()

        const lastId = lastTrackingIdRef.current

        // 5. Crear marcadores con números 1..N (visibles en pantalla)
        toRender.forEach((tracking, idx) => {
            const lat    = Number(tracking.latitude)
            const lng    = Number(tracking.longitude)
            const seqNum = idx + 1
            const isLast     = tracking.id === lastId
            const isSelected = selectedTrackingRef.current?.id === tracking.id

            const utm     = latLonToUtm(lat, lng)
            const quadKey = latLonToQuadKey(lat, lng, 15)

            const marker = L.marker([lat, lng], {
                icon: createTrackingIcon(isSelected, isLast, seqNum),
            })

            marker.bindPopup(
                buildPopupHtml(seqNum, toRender.length, tracking, lat, lng, utm, quadKey, isLast),
                { maxWidth: 260, className: 'tracking-popup' }
            )

            marker.on('click', () => onTrackingClick(tracking))
            markersMapRef.current.set(tracking.id, marker)
            seqNumMapRef.current.set(tracking.id, seqNum)
            layer.addLayer(marker)
        })

        const total = sorted.length
        const shown = toRender.length
        setMapStatus(
            shown === total
                ? `${total} punto${total !== 1 ? 's' : ''}`
                : `${shown} de ${total} puntos (zoom para ver más)`
        )
    }, [createTrackingIcon, onTrackingClick])

    // Mantener renderFnRef siempre apuntando a la versión más reciente del callback
    // (el event listener del mapa lo llama sin capturar deps del closure)
    useEffect(() => { renderFnRef.current = renderVisibleMarkers }, [renderVisibleMarkers])

    // ── Effect 1: redibuja TODO cuando cambian los datos ─────────────────────
    // Solo gestiona: dataset ordenado, trayectoria, otras embarcaciones, fitBounds.
    // Los MARCADORES los genera renderVisibleMarkers (disparado por zoomend/moveend
    // tras fitBounds, o explícitamente al final del effect).
    useEffect(() => {
        if (!isReady || !mapInstanceRef.current || !leafletRef.current) return

        const L   = leafletRef.current
        const map = mapInstanceRef.current

        // Limpiar capa de markers y trayectoria anterior
        if (trackingLayerRef.current) trackingLayerRef.current.clearLayers()
        markersMapRef.current.clear()
        seqNumMapRef.current.clear()
        trajectoryRef.current?.remove()
        trajectoryRef.current = null
        lastTrackingIdRef.current  = null
        sortedTrackingsRef.current = []

        if (trackings.length === 0) {
            setMapStatus("Sin puntos de tracking para el período seleccionado")
            return
        }

        const sorted = [...trackings].sort(
            (a, b) => new Date(a.tracked_at).getTime() - new Date(b.tracked_at).getTime()
        )
        sortedTrackingsRef.current = sorted
        lastTrackingIdRef.current  = sorted[sorted.length - 1].id

        // Trayectoria (polilínea ligera — no afecta el rendimiento)
        if (showTrajectory && sorted.length > 1) {
            const coords = sorted
                .map(t => [Number(t.latitude), Number(t.longitude)] as [number, number])
                .filter(([la, lo]) => !isNaN(la) && !isNaN(lo))

            if (coords.length > 1) {
                trajectoryRef.current = L.polyline(coords, {
                    color: '#3b82f6',
                    weight: 2.5,
                    opacity: 0.7,
                    dashArray: '6, 8',
                }).addTo(map)
            }
        }

        // Otras embarcaciones (capa estática — sin cluster)
        if (showAllVessels) {
            allVessels.forEach(vessel => {
                const lat = parseFloat(vessel.latitude || '0')
                const lng = parseFloat(vessel.longitude || '0')
                if (!isNaN(lat) && !isNaN(lng) && lat !== 0 && lng !== 0) {
                    const marker = L.marker([lat, lng], { icon: createVesselIcon(vessel) })
                    marker.bindPopup(`
                        <div style="font-size:12px;line-height:1.6;font-family:system-ui">
                            <strong>${vessel.name}</strong>
                            ${vessel.imo ? `<div><b>IMO:</b> ${vessel.imo}</div>` : ''}
                            ${vessel.last_position_at ? `<div style="color:#6b7280;font-size:11px">${formatDate(vessel.last_position_at)}</div>` : ''}
                        </div>
                    `)
                    marker.addTo(map)
                    markersMapRef.current.set(-vessel.id, marker)
                }
            })
        }

        // fitBounds — centra y ajusta el zoom. Cuando termina la animación se
        // dispara zoomend → debouncedRender → renderVisibleMarkers automáticamente.
        if (isLive) {
            const last = sorted[sorted.length - 1]
            const lat  = Number(last.latitude)
            const lng  = Number(last.longitude)
            if (!isNaN(lat) && !isNaN(lng)) map.setView([lat, lng], 16)
            renderFnRef.current()   // en live no hay zoomend → llamar directo
        } else {
            const validCoords = sorted
                .filter(t => !isNaN(Number(t.latitude)) && !isNaN(Number(t.longitude)))
                .map(t => [Number(t.latitude), Number(t.longitude)] as [number, number])
            if (validCoords.length > 0) {
                map.fitBounds(L.latLngBounds(validCoords).pad(0.15))
                // fitBounds dispara zoomend → renderVisibleMarkers (via debounce)
                // Llamamos también directo para el caso en que el bounds no cambie zoom
                map.once('zoomend', () => renderFnRef.current())
            }
        }

        prevSelectedIdRef.current = selectedTrackingRef.current?.id ?? null

    }, [isReady, trackings, showTrajectory, showAllVessels, allVessels, isLive,
        createVesselIcon, renderVisibleMarkers])

    // ── Effect 2: solo cambia el icono seleccionado y hace panTo ─────────────
    // NO llama fitBounds → el zoom del usuario se preserva
    useEffect(() => {
        if (!isReady || !leafletRef.current || !mapInstanceRef.current) return
        const map = mapInstanceRef.current

        // Restaurar icono del punto anteriormente seleccionado
        if (prevSelectedIdRef.current !== null) {
            const prevMarker  = markersMapRef.current.get(prevSelectedIdRef.current)
            if (prevMarker) {
                const wasLast    = prevSelectedIdRef.current === lastTrackingIdRef.current
                const prevSeqNum = seqNumMapRef.current.get(prevSelectedIdRef.current) ?? 1
                prevMarker.setIcon(createTrackingIcon(false, wasLast, prevSeqNum))
            }
        }

        // Aplicar icono al nuevo punto seleccionado
        if (selectedTracking) {
            const lat = Number(selectedTracking.latitude)
            const lng = Number(selectedTracking.longitude)

            const marker = markersMapRef.current.get(selectedTracking.id)

            if (marker) {
                // El marcador ya está en pantalla: solo cambiar icono
                const seqNum = seqNumMapRef.current.get(selectedTracking.id) ?? 1
                marker.setIcon(createTrackingIcon(true, false, seqNum))
                if (!isNaN(lat) && !isNaN(lng)) {
                    map.panTo([lat, lng], { animate: true, duration: 0.4 })
                    if (marker.getPane()) marker.openPopup()
                }
            } else if (!isNaN(lat) && !isNaN(lng)) {
                // El marcador no está en pantalla (fuera del viewport actual o decimado)
                // → panTo para llevarlo al viewport; zoomend disparará renderVisibleMarkers
                map.panTo([lat, lng], { animate: true, duration: 0.4 })
                map.once('moveend', () => renderFnRef.current())
            }
        }

        prevSelectedIdRef.current = selectedTracking?.id ?? null

    }, [isReady, selectedTracking, isLive, createTrackingIcon])

    return (
        <div
            style={height != null ? { position: 'relative', height } : { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0 }}
            className={`isolate overflow-hidden bg-slate-100 ${height != null ? 'rounded-lg' : ''}`}
        >
            <div ref={mapRef} style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0 }} />

            {/* Overlay de carga — solo carga inicial, no live refresh */}
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
                        <div className="w-2.5 h-2.5 bg-blue-500 rounded-full border border-white shadow shrink-0" />
                        Punto de tracking
                    </div>
                    <div className="flex items-center gap-2 text-xs text-gray-600">
                        <div className="w-3.5 h-3.5 bg-amber-400 rounded-full border-2 border-white shadow shrink-0" />
                        Último punto
                    </div>
                    <div className="flex items-center gap-2 text-xs text-gray-600">
                        <div className="w-4 h-4 bg-red-500 rounded-full border-2 border-white shadow shrink-0" />
                        Seleccionado
                    </div>
                    {showTrajectory && (
                        <div className="flex items-center gap-2 text-xs text-gray-600">
                            <div className="w-6 border-t-2 border-blue-400 border-dashed shrink-0" />
                            Trayectoria
                        </div>
                    )}
                    {showAllVessels && (
                        <div className="flex items-center gap-2 text-xs text-gray-600">
                            <div className="w-3 h-3 bg-emerald-500 rounded-full border border-white shadow shrink-0" />
                            Otras embarcaciones
                        </div>
                    )}
                </div>
            </div>
        </div>
    )
}
