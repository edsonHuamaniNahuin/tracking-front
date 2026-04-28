"use client"

import { useEffect, useState, useRef } from "react"
import type { VesselPosition } from "@/types/models/dashboardStats"
import { formatDate } from "@/utils/date"

interface FixedZoomMapProps {
    data: VesselPosition[]
    height?: number
}

export function FixedZoomMap({ data, height = 400 }: FixedZoomMapProps) {
    const [isClient, setIsClient] = useState(false)
    const [mapStatus, setMapStatus] = useState("Inicializando...")
    const [tilesLoaded, setTilesLoaded] = useState(0)
    const [totalTiles, setTotalTiles] = useState(0)
    const mapRef = useRef<HTMLDivElement>(null)
    const mapInstanceRef = useRef<L.Map | null>(null)

    useEffect(() => {
        setIsClient(true)
    }, [])

    useEffect(() => {
        if (!isClient || !mapRef.current) return

        const initMap = async () => {
            try {
                setMapStatus("Cargando Leaflet...")
                const L = (await import("leaflet")).default

                // Limpiar mapa anterior
                if (mapInstanceRef.current) {
                    mapInstanceRef.current.remove()
                    mapInstanceRef.current = null
                }

                // Configurar iconos
                delete (L.Icon.Default.prototype as any)._getIconUrl
                L.Icon.Default.mergeOptions({
                    iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
                    iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
                    shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
                })

                // Crear icono de barco personalizado
                const createVesselIcon = (type: string, status: string) => {
                    const getTypeColor = () => {
                        switch (type) {
                            case "Carguero": return "#3b82f6"
                            case "Petrolero": return "#06b6d4"
                            case "Pasajeros": return "#6366f1"
                            case "Pesquero": return "#10b981"
                            case "Remolcador": return "#8b5cf6"
                            default: return "#6b7280"
                        }
                    }

                    const getStatusColor = () => {
                        switch (status) {
                            case "Activa": return "#10b981"
                            case "En Mantenimiento": return "#f59e0b"
                            case "Inactiva": return "#6b7280"
                            case "Con Alertas": return "#ef4444"
                            default: return "#6b7280"
                        }
                    }

                    return L.divIcon({
                        html: `
                            <div style="
                                position: relative;
                                width: 30px;
                                height: 30px;
                                background-color: ${getTypeColor()};
                                border: 3px solid white;
                                border-radius: 50%;
                                box-shadow: 0 3px 10px rgba(0,0,0,0.3);
                                display: flex;
                                align-items: center;
                                justify-content: center;
                                cursor: pointer;
                                transition: all 0.2s ease;
                            ">
                                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2">
                                    <path d="M2 21c.6.5 1.2 1 2.5 1 2.5 0 2.5-2 5-2s2.5 2 5 2 2.5-2 5-2c1.3 0 1.9-.5 2.5-1"/>
                                    <path d="M19.38 20A11.6 11.6 0 0 0 21 14l-9-4-9 4c0 2.9.94 5.34 2.81 7.76"/>
                                    <path d="M19 13V7a2 2 0 0 0-2-2H7a2 2 0 0 0-2 2v6"/>
                                    <path d="M12 10v4"/>
                                    <path d="M12 2v3"/>
                                </svg>
                                <div style="
                                    position: absolute;
                                    top: -3px;
                                    right: -3px;
                                    width: 12px;
                                    height: 12px;
                                    background-color: ${getStatusColor()};
                                    border: 2px solid white;
                                    border-radius: 50%;
                                    box-shadow: 0 1px 4px rgba(0,0,0,0.4);
                                "></div>
                            </div>
                        `,
                        className: 'vessel-fixed-icon',
                        iconSize: [30, 30],
                        iconAnchor: [15, 15],
                        popupAnchor: [0, -15]
                    })
                }

                setMapStatus("Configurando mapa con zoom fijo...")

                // Crear mapa con zoom fijo en nivel 3 (vista mundial)
                const map = L.map(mapRef.current!, {
                    zoomControl: false,        // Deshabilitar controles de zoom
                    scrollWheelZoom: false,    // Deshabilitar zoom con rueda del mouse
                    doubleClickZoom: false,    // Deshabilitar zoom con doble click
                    touchZoom: false,          // Deshabilitar zoom táctil
                    boxZoom: false,           // Deshabilitar zoom con caja
                    keyboard: false,          // Deshabilitar zoom con teclado
                    dragging: true,           // Mantener arrastre para navegar
                    attributionControl: true
                }).setView([20, 0], 3)        // Zoom nivel 3 - vista mundial

                setMapStatus("Precargando tiles...")

                // Configurar tiles con precarga optimizada
                const tileLayer = L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
                    attribution: '© OpenStreetMap contributors',
                    maxZoom: 3,              // Limitar zoom máximo
                    minZoom: 3,              // Limitar zoom mínimo
                    zoomOffset: 0,
                    tileSize: 256,
                    keepBuffer: 8,           // Mantener más tiles en buffer
                    updateWhenZooming: false,
                    updateWhenIdle: true
                })

                // Contador de tiles para mostrar progreso
                let loadedTiles = 0
                let expectedTiles = 0

                tileLayer.on('loading', () => {
                    expectedTiles = Object.keys((tileLayer as any)._tiles).length
                    setTotalTiles(expectedTiles)
                    setMapStatus(`Cargando tiles: 0/${expectedTiles}`)
                })

                tileLayer.on('tileload', () => {
                    loadedTiles++
                    setTilesLoaded(loadedTiles)
                    setMapStatus(`Cargando tiles: ${loadedTiles}/${expectedTiles}`)
                })

                tileLayer.on('load', () => {
                    setMapStatus("✅ Todos los tiles cargados")
                    setTimeout(() => {
                        setMapStatus("🔒 Zoom fijo - Solo arrastrar para navegar")
                    }, 2000)
                })

                tileLayer.addTo(map)

                // Procesar embarcaciones
                setMapStatus("Agregando embarcaciones...")
                const vessels = Array.isArray(data) ? data : []
                const validVessels = vessels.filter(vessel => {
                    const lat = parseFloat(vessel.latitude || '0')
                    const lng = parseFloat(vessel.longitude || '0')
                    return !isNaN(lat) && !isNaN(lng) &&
                        lat >= -90 && lat <= 90 &&
                        lng >= -180 && lng <= 180 &&
                        lat !== 0 && lng !== 0
                })

                console.log(`Agregando ${validVessels.length} embarcaciones`)

                if (validVessels.length > 0) {
                    validVessels.forEach(vessel => {
                        const lat = parseFloat(vessel.latitude)
                        const lng = parseFloat(vessel.longitude)

                        L.marker([lat, lng], {
                            icon: createVesselIcon(vessel.type, vessel.status)
                        })
                            .bindPopup(`
                            <div style="min-width: 200px;">
                                <h4 style="margin: 0 0 8px 0; font-weight: bold;">${vessel.name}</h4>
                                <p style="margin: 2px 0;"><strong>IMO:</strong> ${vessel.imo}</p>
                                <p style="margin: 2px 0;"><strong>Tipo:</strong> ${vessel.type}</p>
                                <p style="margin: 2px 0;"><strong>Estado:</strong> ${vessel.status}</p>
                                <p style="margin: 2px 0;"><strong>Coordenadas:</strong> ${lat.toFixed(4)}, ${lng.toFixed(4)}</p>
                                <p style="margin: 2px 0;"><strong>Última posición:</strong> ${formatDate(vessel.last_position_at)}</p>
                            </div>
                        `)
                            .addTo(map)
                    })
                }

                // Centrar el mapa para mostrar todas las embarcaciones sin cambiar zoom
                if (validVessels.length > 0) {
                    const lats = validVessels.map(v => parseFloat(v.latitude))
                    const lngs = validVessels.map(v => parseFloat(v.longitude))

                    const centerLat = (Math.max(...lats) + Math.min(...lats)) / 2
                    const centerLng = (Math.max(...lngs) + Math.min(...lngs)) / 2

                    // Mantener zoom 3 pero centrar en las embarcaciones
                    map.setView([centerLat, centerLng], 3)
                }

                mapInstanceRef.current = map

                // Forzar redimensionado final
                setTimeout(() => {
                    if (mapInstanceRef.current) {
                        mapInstanceRef.current.invalidateSize(true)
                    }
                }, 200)

            } catch (error) {
                console.error('Error inicializando mapa:', error)
                setMapStatus(`❌ Error: ${error instanceof Error ? error.message : 'Error desconocido'}`)
            }
        }

        initMap()

        return () => {
            if (mapInstanceRef.current) {
                mapInstanceRef.current.remove()
                mapInstanceRef.current = null
            }
        }
    }, [isClient, data])

    if (!isClient) {
        return (
            <div style={{ height }} className="bg-gray-100 rounded flex items-center justify-center">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900 mx-auto mb-2"></div>
                    <p className="text-sm text-gray-600">Cargando mapa...</p>
                </div>
            </div>
        )
    }

    return (
        <div style={{ height }} className="relative rounded-lg overflow-hidden border">
            <div
                ref={mapRef}
                className="w-full h-full"
                style={{
                    minHeight: height,
                    maxHeight: height,
                    width: '100%'
                }}
            />

            {/* Estado con progreso de tiles */}
            <div className="absolute top-4 left-4 bg-white/95 backdrop-blur-sm px-3 py-2 rounded-lg shadow-lg border z-[1000]">
                <div className="text-xs font-medium text-gray-700">
                    {mapStatus}
                </div>
                {totalTiles > 0 && (
                    <div className="w-32 bg-gray-200 rounded-full h-1.5 mt-2">
                        <div
                            className="bg-blue-500 h-1.5 rounded-full transition-all duration-300"
                            style={{ width: `${(tilesLoaded / totalTiles) * 100}%` }}
                        ></div>
                    </div>
                )}
            </div>

            {/* Información de navegación */}
            <div className="absolute top-4 right-4 bg-white/95 backdrop-blur-sm px-3 py-2 rounded-lg shadow-lg border z-[1000]">
                <div className="text-xs font-medium text-gray-700">
                    🔒 Zoom bloqueado
                </div>
                <div className="text-xs text-gray-500 mt-1">
                    Arrastra para navegar
                </div>
            </div>

            {/* Info de embarcaciones */}
            <div className="absolute bottom-4 left-4 bg-white/95 backdrop-blur-sm px-3 py-2 rounded-lg shadow-lg border z-[1000]">
                <div className="text-xs text-gray-600">
                    📍 {Array.isArray(data) ? data.length : 0} unidades
                </div>
                <div className="text-xs text-blue-600 mt-1">
                    ✓ Vista mundial optimizada
                </div>
            </div>
        </div>
    )
}
