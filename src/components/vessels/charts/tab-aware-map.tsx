"use client"

import { useEffect, useState, useRef } from "react"
import type { VesselPosition } from "@/types/models/dashboardStats"

interface TabAwareMapProps {
    data: VesselPosition[]
    height?: number
}

export function TabAwareMap({ data, height = 400 }: TabAwareMapProps) {
    const [isClient, setIsClient] = useState(false)
    const [mapStatus, setMapStatus] = useState("Esperando tab visible...")
    const [mapReady, setMapReady] = useState(false)
    const mapRef = useRef<HTMLDivElement>(null)
    const mapInstanceRef = useRef<L.Map | null>(null)
    const initTimeoutRef = useRef<NodeJS.Timeout | null>(null)

    // Detectar cuando el componente se hace visible
    useEffect(() => {
        setIsClient(true)

        const checkVisibility = () => {
            if (mapRef.current) {
                const rect = mapRef.current.getBoundingClientRect()
                const isVisible = rect.width > 0 && rect.height > 0 &&
                    rect.top >= 0 && rect.left >= 0 &&
                    rect.bottom <= window.innerHeight &&
                    rect.right <= window.innerWidth

                if (isVisible && !mapReady) {
                    console.log('Tab de mapa detectado como visible, inicializando...')
                    setMapStatus("Tab visible, inicializando mapa...")
                    initializeMap()
                } else if (isVisible && mapInstanceRef.current) {
                    // Tab ya visible pero mapa ya existe, solo redimensionar
                    mapInstanceRef.current.invalidateSize(true)
                    setMapStatus("✅ Mapa redimensionado")
                }
            }
        }

        // Verificar visibilidad cada vez que cambie el DOM
        const observer = new MutationObserver(() => {
            clearTimeout(initTimeoutRef.current!)
            initTimeoutRef.current = setTimeout(checkVisibility, 100)
        })

        // Observar cambios en el documento
        observer.observe(document.body, {
            childList: true,
            subtree: true,
            attributes: true,
            attributeFilter: ['class', 'style']
        })

        // Verificar inmediatamente
        setTimeout(checkVisibility, 500)

        return () => {
            observer.disconnect()
            if (initTimeoutRef.current) {
                clearTimeout(initTimeoutRef.current)
            }
        }
    }, [mapReady])

    const initializeMap = async () => {
        if (!isClient || !mapRef.current || mapReady) return

        try {
            setMapStatus("Cargando Leaflet...")
            const L = (await import("leaflet")).default

            // Limpiar mapa anterior si existe
            if (mapInstanceRef.current) {
                mapInstanceRef.current.remove()
                mapInstanceRef.current = null
            }

            setMapStatus("Configurando mapa...")

            // Configurar iconos
            delete (L.Icon.Default.prototype as any)._getIconUrl
            L.Icon.Default.mergeOptions({
                iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
                iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
                shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
            })

            // Crear iconos personalizados
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
                            width: 28px;
                            height: 28px;
                            background-color: ${getTypeColor()};
                            border: 3px solid white;
                            border-radius: 50%;
                            box-shadow: 0 2px 8px rgba(0,0,0,0.25);
                            display: flex;
                            align-items: center;
                            justify-content: center;
                            cursor: pointer;
                        ">
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2">
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
                                width: 10px;
                                height: 10px;
                                background-color: ${getStatusColor()};
                                border: 2px solid white;
                                border-radius: 50%;
                            "></div>
                        </div>
                    `,
                    className: 'vessel-tab-icon',
                    iconSize: [28, 28],
                    iconAnchor: [14, 14],
                    popupAnchor: [0, -14]
                })
            }

            // Asegurar que el contenedor tenga el tamaño correcto
            const container = mapRef.current
            container.style.width = '100%'
            container.style.height = `${height}px`

            // Crear mapa
            const map = L.map(container, {
                preferCanvas: false,
                zoomControl: true,
                attributionControl: true
            }).setView([0, 0], 2)

            // Agregar tiles
            setMapStatus("Cargando tiles...")
            const tileLayer = L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
                attribution: '© OpenStreetMap contributors',
                maxZoom: 18,
                keepBuffer: 4,
                updateWhenZooming: false,
                updateWhenIdle: true
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

            if (validVessels.length > 0) {
                const markers = validVessels.map(vessel => {
                    const lat = parseFloat(vessel.latitude)
                    const lng = parseFloat(vessel.longitude)

                    return L.marker([lat, lng], {
                        icon: createVesselIcon(vessel.type, vessel.status)
                    })
                        .bindPopup(`
                        <div style="min-width: 200px;">
                            <h4 style="margin: 0 0 8px 0; font-weight: bold;">${vessel.name}</h4>
                            <p style="margin: 2px 0;"><strong>IMO:</strong> ${vessel.imo}</p>
                            <p style="margin: 2px 0;"><strong>Tipo:</strong> ${vessel.type}</p>
                            <p style="margin: 2px 0;"><strong>Estado:</strong> ${vessel.status}</p>
                            <p style="margin: 2px 0;"><strong>Coordenadas:</strong> ${lat.toFixed(4)}, ${lng.toFixed(4)}</p>
                        </div>
                    `)
                        .addTo(map)
                })

                // Ajustar vista
                const group = L.featureGroup(markers)
                map.fitBounds(group.getBounds(), { padding: [20, 20] })
            } else {
                map.setView([20, 0], 2)
            }

            mapInstanceRef.current = map
            setMapReady(true)
            setMapStatus(`✅ ${validVessels.length} unidades cargadas`)

            // Redimensionados finales
            setTimeout(() => map.invalidateSize(true), 100)
            setTimeout(() => map.invalidateSize(true), 300)
            setTimeout(() => map.invalidateSize(true), 600)

        } catch (error) {
            console.error('Error inicializando mapa:', error)
            setMapStatus(`❌ Error: ${error instanceof Error ? error.message : 'Error desconocido'}`)
        }
    }

    if (!isClient) {
        return (
            <div style={{ height }} className="bg-gray-100 rounded flex items-center justify-center">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
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

            {/* Estado */}
            <div className="absolute top-4 left-4 bg-white/90 backdrop-blur-sm px-3 py-2 rounded-lg shadow-lg border z-[1000]">
                <div className="text-xs font-medium text-gray-700">
                    {mapStatus}
                </div>
            </div>

            {/* Botón manual */}
            <div className="absolute top-4 right-4 z-[1000]">
                <button
                    onClick={initializeMap}
                    className="bg-white/90 hover:bg-white backdrop-blur-sm px-3 py-2 rounded-lg shadow-lg border text-xs font-medium text-gray-700 hover:text-gray-900 transition-colors"
                >
                    🔄 Reinicializar
                </button>
            </div>
        </div>
    )
}
