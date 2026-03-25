"use client"

import { useEffect, useState, useRef } from "react"
import type { VesselPosition } from "@/types/models/dashboardStats"
import { formatDate } from "@/utils/date"

interface FixedMapProps {
    data: VesselPosition[]
    height?: number
}

export function FixedMap({ data, height = 400 }: FixedMapProps) {
    const [isClient, setIsClient] = useState(false)
    const [mapStatus, setMapStatus] = useState("Inicializando...")
    const [isVisible, setIsVisible] = useState(false)
    const mapRef = useRef<HTMLDivElement>(null)
    const mapInstanceRef = useRef<any>(null)
    const intersectionObserverRef = useRef<IntersectionObserver | null>(null)

    useEffect(() => {
        setIsClient(true)

        // Observer para detectar cuando el componente se hace visible
        if (mapRef.current) {
            intersectionObserverRef.current = new IntersectionObserver(
                (entries) => {
                    const isIntersecting = entries[0].isIntersecting
                    setIsVisible(isIntersecting)

                    if (isIntersecting && mapInstanceRef.current) {
                        // El tab se hizo visible, forzar redimensionado
                        setTimeout(() => {
                            if (mapInstanceRef.current) {
                                mapInstanceRef.current.invalidateSize(true)
                                setMapStatus("🔄 Redimensionando para tab visible...")

                                setTimeout(() => {
                                    if (mapInstanceRef.current) {
                                        mapInstanceRef.current.invalidateSize(true)
                                        setMapStatus("✅ Mapa ajustado para tab")
                                    }
                                }, 300)
                            }
                        }, 100)
                    }
                },
                {
                    threshold: 0.1,
                    rootMargin: '10px'
                }
            )

            intersectionObserverRef.current.observe(mapRef.current)
        }

        return () => {
            if (intersectionObserverRef.current) {
                intersectionObserverRef.current.disconnect()
            }
        }
    }, [])

    useEffect(() => {
        if (!isClient || !mapRef.current || !isVisible) return

        // Limpiar mapa anterior
        if (mapInstanceRef.current) {
            mapInstanceRef.current.remove()
            mapInstanceRef.current = null
        }

        const initMap = async () => {
            try {
                setMapStatus("Cargando librerías...")
                const L = (await import("leaflet")).default

                setMapStatus("Configurando iconos...")
                // Crear iconos personalizados con ship icon
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

                    // Crear icono HTML con ship SVG
                    return L.divIcon({
                        html: `
                            <div class="vessel-icon-container" style="
                                position: relative;
                                width: 32px;
                                height: 32px;
                                background-color: ${getTypeColor()};
                                border: 3px solid white;
                                border-radius: 50%;
                                box-shadow: 0 2px 8px rgba(0,0,0,0.25);
                                display: flex;
                                align-items: center;
                                justify-content: center;
                                cursor: pointer;
                                transition: all 0.2s ease;
                            ">
                                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                                    <path d="M2 21c.6.5 1.2 1 2.5 1 2.5 0 2.5-2 5-2s2.5 2 5 2 2.5-2 5-2c1.3 0 1.9-.5 2.5-1"/>
                                    <path d="M19.38 20A11.6 11.6 0 0 0 21 14l-9-4-9 4c0 2.9.94 5.34 2.81 7.76"/>
                                    <path d="M19 13V7a2 2 0 0 0-2-2H7a2 2 0 0 0-2 2v6"/>
                                    <path d="M12 10v4"/>
                                    <path d="M12 2v3"/>
                                </svg>
                                <div class="status-indicator" style="
                                    position: absolute;
                                    top: -2px;
                                    right: -2px;
                                    width: 12px;
                                    height: 12px;
                                    background-color: ${getStatusColor()};
                                    border: 2px solid white;
                                    border-radius: 50%;
                                    box-shadow: 0 1px 3px rgba(0,0,0,0.3);
                                "></div>
                            </div>
                        `,
                        className: 'vessel-custom-icon',
                        iconSize: [32, 32],
                        iconAnchor: [16, 16],
                        popupAnchor: [0, -16]
                    })
                }

                setMapStatus("Creando mapa...")                // Crear mapa con configuración específica
                const map = L.map(mapRef.current!, {
                    preferCanvas: true,
                    zoomControl: true,
                    attributionControl: true
                }).setView([0, 0], 2)

                // Función para forzar redimensionado del mapa
                const resizeMap = () => {
                    if (mapRef.current && map) {
                        // Obtener dimensiones reales del contenedor
                        const container = mapRef.current
                        const rect = container.getBoundingClientRect()

                        // Forzar que el contenedor tenga las dimensiones correctas
                        container.style.width = '100%'
                        container.style.height = `${height}px`

                        // Invalidar y redimensionar el mapa
                        map.invalidateSize({
                            animate: false,
                            pan: false
                        })

                        // Forzar re-render de tiles
                        map.eachLayer((layer: any) => {
                            if (layer._url) { // Es un tile layer
                                layer.redraw()
                            }
                        })

                        console.log(`Mapa redimensionado: ${rect.width}x${rect.height}`)
                    }
                }

                // Eventos para redimensionar automáticamente
                map.on('zoomstart', () => {
                    setTimeout(resizeMap, 50)
                })

                map.on('zoomend', () => {
                    setTimeout(resizeMap, 100)
                })

                map.on('moveend', () => {
                    setTimeout(resizeMap, 50)
                })

                // Observer para detectar cambios de tamaño del contenedor
                const resizeObserver = new ResizeObserver(() => {
                    resizeMap()
                })

                if (mapRef.current) {
                    resizeObserver.observe(mapRef.current)
                }

                setMapStatus("Agregando tiles...")
                // Configurar tiles con parámetros optimizados
                const tileLayer = L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
                    attribution: '© OpenStreetMap contributors',
                    maxZoom: 18,
                    minZoom: 1,
                    tileSize: 256,
                    keepBuffer: 2,
                    updateWhenZooming: false,
                    updateWhenIdle: true
                })

                await new Promise((resolve) => {
                    tileLayer.on('load', resolve)
                    tileLayer.addTo(map)
                })

                setMapStatus("Procesando datos de embarcaciones...")
                console.log('Datos recibidos:', data?.length || 0, data)

                // Procesar datos de embarcaciones
                const vessels = Array.isArray(data) ? data : []
                const validVessels = []

                for (const vessel of vessels) {
                    const lat = parseFloat(vessel.latitude || '0')
                    const lng = parseFloat(vessel.longitude || '0')

                    console.log(`Embarcación ${vessel.name}: lat=${lat}, lng=${lng}`)

                    if (!isNaN(lat) && !isNaN(lng) &&
                        lat >= -90 && lat <= 90 &&
                        lng >= -180 && lng <= 180 &&
                        lat !== 0 && lng !== 0) {
                        validVessels.push({ ...vessel, lat, lng })
                    } else {
                        console.warn(`Coordenadas inválidas para ${vessel.name}:`, vessel.latitude, vessel.longitude)
                    }
                }

                console.log(`Embarcaciones válidas: ${validVessels.length}`)
                setMapStatus(`Agregando ${validVessels.length} marcadores...`)

                if (validVessels.length > 0) {
                    const markers = []

                    for (const vessel of validVessels) {
                        const marker = L.marker([vessel.lat, vessel.lng], {
                            icon: createVesselIcon(vessel.type, vessel.status)
                        })
                            .bindPopup(`
                                <div style="min-width: 200px;">
                                    <h4 style="margin: 0 0 8px 0; font-weight: bold;">${vessel.name}</h4>
                                    <p style="margin: 2px 0;"><strong>IMO:</strong> ${vessel.imo}</p>
                                    <p style="margin: 2px 0;"><strong>Tipo:</strong> ${vessel.type}</p>
                                    <p style="margin: 2px 0;"><strong>Estado:</strong> ${vessel.status}</p>
                                    <p style="margin: 2px 0;"><strong>Coordenadas:</strong> ${vessel.lat.toFixed(4)}, ${vessel.lng.toFixed(4)}</p>
                                    <p style="margin: 2px 0;"><strong>Última posición:</strong> ${formatDate(vessel.last_position_at)}</p>
                                </div>
                            `)
                            .addTo(map)

                        markers.push(marker)
                    }

                    // Ajustar vista del mapa
                    const group = L.featureGroup(markers)
                    map.fitBounds(group.getBounds(), { padding: [20, 20] })

                    setMapStatus(`✅ Mapa cargado: ${validVessels.length} embarcaciones`)
                } else {
                    // Si no hay datos válidos, centrar en una vista global
                    map.setView([20, 0], 2)
                    setMapStatus("⚠️ No hay datos de embarcaciones válidos")
                }

                mapInstanceRef.current = map

                // Forzar redimensionado después de un breve delay
                setTimeout(() => {
                    if (mapInstanceRef.current) {
                        mapInstanceRef.current.invalidateSize(true)
                        console.log('Mapa redimensionado')
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
    }, [isClient, data, height, isVisible])

    if (!isClient) {
        return (
            <div style={{ height }} className="bg-gray-100 rounded flex items-center justify-center">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900 mx-auto mb-2"></div>
                    <p className="text-sm text-gray-600">Cargando mapa...</p>
                </div>
            </div>
        )
    } return (
        <div style={{ height }} className="relative rounded-lg overflow-hidden border">
            <div
                ref={mapRef}
                className="w-full h-full"
                style={{
                    minHeight: height,
                    maxHeight: height,
                    width: '100%',
                    position: 'relative'
                }}
            />

            {/* Indicador de estado */}
            <div className="absolute top-4 left-4 bg-white/90 backdrop-blur-sm px-3 py-2 rounded-lg shadow-lg border z-[1000]">
                <div className="text-xs font-medium text-gray-700">
                    {mapStatus}
                </div>
            </div>

            {/* Botón para forzar redimensionado */}
            <div className="absolute top-4 right-4 z-[1000]">
                <button
                    onClick={() => {
                        if (mapInstanceRef.current) {
                            mapInstanceRef.current.invalidateSize(true)
                            mapInstanceRef.current.eachLayer((layer: L.Layer) => {
                                if ('redraw' in layer && typeof layer.redraw === 'function') {
                                    layer.redraw()
                                }
                            })
                            setMapStatus("🔄 Mapa actualizado manualmente")
                            setTimeout(() => setMapStatus("✅ Mapa funcionando correctamente"), 2000)
                        }
                    }}
                    className="bg-white/90 hover:bg-white backdrop-blur-sm px-3 py-2 rounded-lg shadow-lg border text-xs font-medium text-gray-700 hover:text-gray-900 transition-colors"
                    title="Forzar redimensionado del mapa"
                >
                    🔄 Actualizar
                </button>
            </div>

            {/* Información de datos */}
            <div className="absolute bottom-4 left-4 bg-white/90 backdrop-blur-sm px-3 py-2 rounded-lg shadow-lg border z-[1000]">
                <div className="text-xs text-gray-600">
                    Total embarcaciones: {Array.isArray(data) ? data.length : 0}
                </div>
                {Array.isArray(data) && data.length > 0 && (
                    <div className="text-xs text-green-600 mt-1">
                        ✓ Datos cargados desde API
                    </div>
                )}
            </div>
        </div>
    )
}
