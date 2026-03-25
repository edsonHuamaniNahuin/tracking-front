"use client"

import { useEffect, useState, useRef } from "react"
import { MapPin, Ship, Navigation, ZoomIn, ZoomOut } from "lucide-react"
import { Button } from "@/components/ui/button"
import type { VesselPosition } from "@/types/models/dashboardStats"
import { formatDate } from "@/utils/date"

interface LeafletMapProps {
    data: VesselPosition[]
    height?: number
    isLoading?: boolean
}

export function LeafletMap({ data, height = 400, isLoading = false }: LeafletMapProps) {
    const [isClient, setIsClient] = useState(false)
    const [mapInitialized, setMapInitialized] = useState(false)
    const mapRef = useRef<HTMLDivElement>(null)
    const mapInstanceRef = useRef<L.Map | null>(null)
    const markersRef = useRef<L.Marker[]>([])

    useEffect(() => {
        setIsClient(true)
    }, [])

    useEffect(() => {
        if (!isClient || !mapRef.current) return

        // Limpiar mapa anterior si existe
        if (mapInstanceRef.current) {
            mapInstanceRef.current.remove()
            mapInstanceRef.current = null
        }        // Importar dinámicamente para evitar problemas de SSR
        const initMap = async () => {
            try {
                const L = (await import("leaflet")).default

                // Configurar iconos por defecto de Leaflet
                L.Icon.Default.mergeOptions({
                    iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
                    iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
                    shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
                })

                // Crear mapa centrado en el Caribe/Golfo de México
                const map = L.map(mapRef.current!, {
                    zoomControl: false,
                    attributionControl: true,
                    scrollWheelZoom: true,
                    doubleClickZoom: true,
                    dragging: true
                }).setView([20.0, -75.0], 6)

                // Forzar invalidate size después de crear el mapa
                setTimeout(() => {
                    map.invalidateSize()
                }, 100)                // Agregar capas de tiles con mejor configuración
                const osmLayer = L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
                    attribution: '© OpenStreetMap contributors',
                    maxZoom: 18,
                    tileSize: 256,
                    zoomOffset: 0,
                    crossOrigin: true
                })

                // Esperar a que las tiles se carguen antes de continuar
                osmLayer.on('load', () => {
                    console.log('Tiles cargadas correctamente')
                })

                // Agregar la capa por defecto
                osmLayer.addTo(map)                // Crear iconos personalizados más simples
                const createVesselIcon = (type: string, status: string) => {
                    const getColor = () => {
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

                    // Usar icono estándar de Leaflet pero con color personalizado
                    return L.divIcon({
                        html: `
                            <div style="
                                width: 25px;
                                height: 25px;
                                background-color: ${getColor()};
                                border: 3px solid white;
                                border-radius: 50%;
                                box-shadow: 0 2px 6px rgba(0,0,0,0.3);
                                position: relative;
                            ">
                                <div style="
                                    position: absolute;
                                    top: -5px;
                                    right: -5px;
                                    width: 12px;
                                    height: 12px;
                                    background-color: ${getStatusColor()};
                                    border: 2px solid white;
                                    border-radius: 50%;
                                    box-shadow: 0 1px 3px rgba(0,0,0,0.4);
                                "></div>
                            </div>
                        `,
                        className: 'vessel-marker-simple',
                        iconSize: [25, 25],
                        iconAnchor: [12, 12],
                        popupAnchor: [0, -12]
                    })
                }

                // Limpiar marcadores anteriores
                markersRef.current = []                // Agregar marcadores para cada embarcación
                const safeData = Array.isArray(data) ? data : []
                console.log('Datos de embarcaciones recibidos:', safeData.length, safeData)

                if (safeData.length > 0) {
                    let markersAdded = 0
                    safeData.forEach((vessel, index) => {
                        const lat = parseFloat(vessel.latitude)
                        const lng = parseFloat(vessel.longitude)

                        console.log(`Procesando embarcación ${index + 1}:`, vessel.name, `(${lat}, ${lng})`)

                        // Validar coordenadas
                        if (!isNaN(lat) && !isNaN(lng) && lat >= -90 && lat <= 90 && lng >= -180 && lng <= 180) {
                            const marker = L.marker([lat, lng], {
                                icon: createVesselIcon(vessel.type, vessel.status)
                            })
                                .addTo(map)
                                .bindPopup(`
                                <div class="vessel-popup">
                                    <h3 class="font-semibold text-sm mb-2">${vessel.name}</h3>
                                    <div class="space-y-1">
                                        <p class="text-xs"><strong>IMO:</strong> ${vessel.imo}</p>
                                        <p class="text-xs"><strong>Tipo:</strong> ${vessel.type}</p>
                                        <p class="text-xs"><strong>Estado:</strong> <span class="inline-block w-2 h-2 rounded-full" style="background-color: ${vessel.status === 'Activa' ? '#10b981' : vessel.status === 'En Mantenimiento' ? '#f59e0b' : vessel.status === 'Con Alertas' ? '#ef4444' : '#6b7280'}"></span> ${vessel.status}</p>
                                        <p class="text-xs"><strong>Coordenadas:</strong> ${lat.toFixed(4)}, ${lng.toFixed(4)}</p>
                                        <p class="text-xs"><strong>Última posición:</strong> ${formatDate(vessel.last_position_at)}</p>
                                    </div>
                                </div>
                            `, {
                                    maxWidth: 250
                                })

                            markersRef.current.push(marker)
                            markersAdded++
                        } else {
                            console.warn(`Coordenadas inválidas para ${vessel.name}:`, lat, lng)
                        }
                    })

                    console.log(`Total de marcadores agregados: ${markersAdded}`)

                    // Ajustar vista del mapa para mostrar todos los marcadores
                    if (markersRef.current.length > 0) {
                        const group = L.featureGroup(markersRef.current)
                        map.fitBounds(group.getBounds().pad(0.1))
                        console.log('Vista ajustada para mostrar todos los marcadores')
                    }
                } else {
                    // Si no hay datos reales, mostrar posiciones simuladas para demo
                    const simulatedPositions = [
                        { lat: 23.5, lng: -78.2, name: "Embarcación Demo 1", type: "Carguero", status: "Activa" },
                        { lat: 19.8, lng: -75.5, name: "Embarcación Demo 2", type: "Petrolero", status: "En Mantenimiento" },
                        { lat: 21.3, lng: -80.1, name: "Embarcación Demo 3", type: "Pesquero", status: "Activa" },
                        { lat: 18.2, lng: -77.8, name: "Embarcación Demo 4", type: "Pasajeros", status: "Con Alertas" },
                        { lat: 22.1, lng: -82.4, name: "Embarcación Demo 5", type: "Remolcador", status: "Activa" }
                    ]

                    simulatedPositions.forEach((vessel, index) => {
                        const marker = L.marker([vessel.lat, vessel.lng], {
                            icon: createVesselIcon(vessel.type, vessel.status)
                        })
                            .addTo(map)
                            .bindPopup(`
                            <div class="vessel-popup">
                                <h3 class="font-semibold text-sm mb-2">${vessel.name}</h3>
                                <div class="space-y-1">
                                    <p class="text-xs"><strong>IMO:</strong> DEMO${index + 1}</p>
                                    <p class="text-xs"><strong>Tipo:</strong> ${vessel.type}</p>
                                    <p class="text-xs"><strong>Estado:</strong> <span class="inline-block w-2 h-2 rounded-full" style="background-color: ${vessel.status === 'Activa' ? '#10b981' : vessel.status === 'En Mantenimiento' ? '#f59e0b' : vessel.status === 'Con Alertas' ? '#ef4444' : '#6b7280'}"></span> ${vessel.status}</p>
                                    <p class="text-xs"><strong>Coordenadas:</strong> ${vessel.lat.toFixed(4)}, ${vessel.lng.toFixed(4)}</p>
                                    <p class="text-xs text-yellow-600"><strong>⚠️ Datos simulados para demostración</strong></p>
                                </div>
                            </div>
                        `, {
                                maxWidth: 250
                            })

                        markersRef.current.push(marker)
                    })
                } mapInstanceRef.current = map
                setMapInitialized(true)

                // Forzar actualización del mapa después de que se monte completamente
                setTimeout(() => {
                    if (mapInstanceRef.current) {
                        mapInstanceRef.current.invalidateSize()
                        console.log('Mapa actualizado después del montaje')
                    }
                }, 500)
            } catch (error) {
                console.error('Error initializing map:', error)
            }
        }

        initMap()

        // Cleanup al desmontar
        return () => {
            if (mapInstanceRef.current) {
                mapInstanceRef.current.remove()
                mapInstanceRef.current = null
            }
        }
    }, [isClient, data])

    // Funciones de control del mapa
    const zoomIn = () => {
        if (mapInstanceRef.current) {
            mapInstanceRef.current.zoomIn()
        }
    }

    const zoomOut = () => {
        if (mapInstanceRef.current) {
            mapInstanceRef.current.zoomOut()
        }
    }

    const fitBounds = async () => {
        if (mapInstanceRef.current && markersRef.current.length > 0) {
            const L = (await import("leaflet")).default
            const group = L.featureGroup(markersRef.current)
            mapInstanceRef.current.fitBounds(group.getBounds().pad(0.1))
        }
    }

    if (isLoading) {
        return (
            <div className="flex items-center justify-center" style={{ height }}>
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
            </div>
        )
    }

    // Validar que data sea un array válido
    const safeData = Array.isArray(data) ? data : []

    // Solo renderizar en el cliente
    if (!isClient) {
        return (
            <div className="flex items-center justify-center" style={{ height }}>
                <div className="animate-pulse">
                    <MapPin className="h-8 w-8 text-gray-400" />
                </div>
            </div>
        )
    }

    return (
        <div style={{ height }} className="relative rounded-lg overflow-hidden border">
            {/* Contenedor del mapa */}
            <div ref={mapRef} className="w-full h-full" />

            {/* Controles personalizados */}
            {mapInitialized && (
                <div className="absolute top-4 right-4 flex flex-col gap-2 z-[1000]">
                    <Button
                        size="sm"
                        variant="outline"
                        onClick={zoomIn}
                        className="bg-background/95 backdrop-blur-sm hover:bg-background"
                        title="Acercar"
                    >
                        <ZoomIn className="h-4 w-4" />
                    </Button>
                    <Button
                        size="sm"
                        variant="outline"
                        onClick={zoomOut}
                        className="bg-background/95 backdrop-blur-sm hover:bg-background"
                        title="Alejar"
                    >
                        <ZoomOut className="h-4 w-4" />
                    </Button>
                    <Button
                        size="sm"
                        variant="outline"
                        onClick={fitBounds}
                        className="bg-background/95 backdrop-blur-sm hover:bg-background"
                        title="Ajustar vista a todas las embarcaciones"
                    >
                        <Navigation className="h-4 w-4" />
                    </Button>
                </div>
            )}

            {/* Información adicional */}
            <div className="absolute top-4 left-4 bg-background/95 backdrop-blur-sm p-3 rounded-lg shadow-lg border z-[1000]">
                <div className="text-sm font-medium flex items-center">
                    <Ship className="h-4 w-4 mr-1" />
                    Flota Activa
                </div>
                <div className="text-xs text-muted-foreground">
                    {safeData.length > 0 ? `${safeData.length} embarcaciones` : "5 embarcaciones de demostración"}
                </div>
                {safeData.length === 0 && (
                    <div className="text-xs text-yellow-600 mt-1">
                        🚧 Mostrando posiciones simuladas
                    </div>
                )}
            </div>

            {/* Leyenda */}
            <div className="absolute bottom-4 right-4 bg-background/95 backdrop-blur-sm p-3 rounded-lg shadow-lg border z-[1000] max-w-xs">
                <div className="text-sm font-medium mb-2">Leyenda</div>
                <div className="space-y-1">
                    <div className="flex items-center text-xs">
                        <div className="w-3 h-3 bg-blue-500 rounded-full mr-2"></div>
                        <span>Carguero</span>
                    </div>
                    <div className="flex items-center text-xs">
                        <div className="w-3 h-3 bg-cyan-500 rounded-full mr-2"></div>
                        <span>Petrolero</span>
                    </div>
                    <div className="flex items-center text-xs">
                        <div className="w-3 h-3 bg-green-500 rounded-full mr-2"></div>
                        <span>Pesquero</span>
                    </div>
                    <div className="flex items-center text-xs">
                        <div className="w-3 h-3 bg-indigo-500 rounded-full mr-2"></div>
                        <span>Pasajeros</span>
                    </div>
                </div>
                <div className="text-xs text-muted-foreground mt-2">
                    • Verde: Activa • Amarillo: Mantenimiento • Rojo: Alerta
                </div>
            </div>
        </div>
    )
}
