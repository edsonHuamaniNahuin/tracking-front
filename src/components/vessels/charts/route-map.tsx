"use client"

import { useEffect, useState, useRef } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Route, MapPin, Navigation, Trash2, Plus } from "lucide-react"
import type { VesselPosition } from "@/types/models/dashboardStats"

interface RoutePoint {
    lat: number
    lng: number
    name?: string
}

interface VesselRoute {
    id: string
    name: string
    points: RoutePoint[]
    color: string
    vesselId?: string
}

interface RouteMapProps {
    data: VesselPosition[]
    height?: number
    isLoading?: boolean
    onRouteCreate?: (route: VesselRoute) => void
    onRouteDelete?: (routeId: string) => void
}

export function RouteMap({
    data,
    height = 400,
    isLoading = false,
    onRouteCreate,
    onRouteDelete
}: RouteMapProps) {
    const [isClient, setIsClient] = useState(false)
    const [mapInitialized, setMapInitialized] = useState(false)
    const [isCreatingRoute, setIsCreatingRoute] = useState(false)
    const [currentRoute, setCurrentRoute] = useState<RoutePoint[]>([])
    const [routes, setRoutes] = useState<VesselRoute[]>([])

    const mapRef = useRef<HTMLDivElement>(null)
    const mapInstanceRef = useRef<L.Map | null>(null)
    const routeLinesRef = useRef<L.Polyline[]>([])

    useEffect(() => {
        setIsClient(true)
    }, [])

    useEffect(() => {
        if (!isClient || !mapRef.current) return

        // Limpiar mapa anterior si existe
        if (mapInstanceRef.current) {
            mapInstanceRef.current.remove()
            mapInstanceRef.current = null
        }

        // Importar dinámicamente para evitar problemas de SSR
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
                const map = L.map(mapRef.current!).setView([20.0, -75.0], 6)

                // Agregar capas de tiles
                const osmLayer = L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
                    attribution: '© OpenStreetMap contributors'
                })

                // Agregar la capa por defecto
                osmLayer.addTo(map)

                // Agregar marcadores para embarcaciones si hay datos
                const safeData = Array.isArray(data) ? data : []
                safeData.forEach((vessel) => {
                    const lat = parseFloat(vessel.latitude)
                    const lng = parseFloat(vessel.longitude)

                    if (!isNaN(lat) && !isNaN(lng) && lat >= -90 && lat <= 90 && lng >= -180 && lng <= 180) {
                        const vesselIcon = L.divIcon({
                            html: `
                                <div class="vessel-marker" style="background-color: #3b82f6;">
                                    <svg width="16" height="16" viewBox="0 0 24 24" fill="white">
                                        <path d="M3 12H7L9 9H11L13 12H17L19 9H21L22 12H21L19 15H17L13 12H11L9 15H7L3 12Z"/>
                                    </svg>
                                </div>
                            `,
                            className: 'custom-vessel-marker',
                            iconSize: [24, 24],
                            iconAnchor: [12, 12]
                        })

                        L.marker([lat, lng], { icon: vesselIcon })
                            .addTo(map)
                            .bindPopup(`
                            <div class="text-sm">
                                <h4 class="font-semibold">${vessel.name}</h4>
                                <p class="text-xs text-gray-600">${vessel.type} - ${vessel.status}</p>
                            </div>
                        `)
                    }
                })

                // Evento de clic para crear rutas
                map.on('click', (e: L.LeafletMouseEvent) => {
                    if (isCreatingRoute) {
                        const newPoint = { lat: e.latlng.lat, lng: e.latlng.lng }
                        setCurrentRoute(prev => [...prev, newPoint])

                        // Agregar marcador temporal
                        const marker = L.marker([e.latlng.lat, e.latlng.lng])
                            .addTo(map)
                            .bindPopup(`Punto ${currentRoute.length + 1}`)

                        // Dibujar línea si hay más de un punto
                        if (currentRoute.length > 0) {
                            const line = L.polyline([
                                [currentRoute[currentRoute.length - 1].lat, currentRoute[currentRoute.length - 1].lng],
                                [e.latlng.lat, e.latlng.lng]
                            ], { color: '#ef4444', weight: 3 }).addTo(map)
                        }
                    }
                })

                mapInstanceRef.current = map
                setMapInitialized(true)
            } catch (error) {
                console.error('Error initializing route map:', error)
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
    }, [isClient, data, isCreatingRoute, currentRoute])

    // Funciones de control
    const startCreatingRoute = () => {
        setIsCreatingRoute(true)
        setCurrentRoute([])
    }

    const finishRoute = () => {
        if (currentRoute.length >= 2) {
            const newRoute: VesselRoute = {
                id: `route-${Date.now()}`,
                name: `Ruta ${routes.length + 1}`,
                points: currentRoute,
                color: '#ef4444'
            }

            setRoutes(prev => [...prev, newRoute])

            if (onRouteCreate) {
                onRouteCreate(newRoute)
            }
        }

        setIsCreatingRoute(false)
        setCurrentRoute([])
    }

    const cancelRoute = () => {
        setIsCreatingRoute(false)
        setCurrentRoute([])

        // Limpiar marcadores temporales si el mapa está disponible
        if (mapInstanceRef.current) {
            // Simplemente recrear el mapa para limpiar elementos temporales
            window.location.reload()
        }
    }

    const deleteRoute = (routeId: string) => {
        setRoutes(prev => prev.filter(r => r.id !== routeId))

        if (onRouteDelete) {
            onRouteDelete(routeId)
        }
    }

    if (isLoading) {
        return (
            <div className="flex items-center justify-center" style={{ height }}>
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
            </div>
        )
    }

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
        <div className="space-y-4">
            {/* Controles de rutas */}
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center">
                        <Route className="h-5 w-5 mr-2" />
                        Planificador de Rutas
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="flex items-center gap-2">
                        {!isCreatingRoute ? (
                            <Button onClick={startCreatingRoute} size="sm">
                                <Plus className="h-4 w-4 mr-1" />
                                Nueva Ruta
                            </Button>
                        ) : (
                            <div className="flex items-center gap-2">
                                <Button onClick={finishRoute} size="sm" disabled={currentRoute.length < 2}>
                                    Finalizar Ruta ({currentRoute.length} puntos)
                                </Button>
                                <Button onClick={cancelRoute} size="sm" variant="outline">
                                    Cancelar
                                </Button>
                            </div>
                        )}

                        {routes.length > 0 && (
                            <span className="text-sm text-muted-foreground">
                                {routes.length} ruta{routes.length !== 1 ? 's' : ''} creada{routes.length !== 1 ? 's' : ''}
                            </span>
                        )}
                    </div>

                    {isCreatingRoute && (
                        <div className="mt-2 p-2 bg-blue-50 rounded text-sm text-blue-700">
                            Haz clic en el mapa para agregar puntos a la ruta
                        </div>
                    )}
                </CardContent>
            </Card>

            {/* Contenedor del mapa */}
            <div style={{ height }} className="relative rounded-lg overflow-hidden border">
                <div ref={mapRef} className="w-full h-full" />

                {/* Lista de rutas */}
                {routes.length > 0 && (
                    <div className="absolute top-4 right-4 bg-background/95 backdrop-blur-sm p-3 rounded-lg shadow-lg border z-[1000] max-w-xs">
                        <div className="text-sm font-medium mb-2">Rutas Creadas</div>
                        <div className="space-y-2">
                            {routes.map((route) => (
                                <div key={route.id} className="flex items-center justify-between">
                                    <div>
                                        <div className="text-xs font-medium">{route.name}</div>
                                        <div className="text-xs text-muted-foreground">
                                            {route.points.length} puntos
                                        </div>
                                    </div>
                                    <Button
                                        size="sm"
                                        variant="ghost"
                                        onClick={() => deleteRoute(route.id)}
                                        className="h-6 w-6 p-0"
                                    >
                                        <Trash2 className="h-3 w-3" />
                                    </Button>
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                {/* Información del mapa */}
                <div className="absolute bottom-4 left-4 bg-background/95 backdrop-blur-sm p-2 rounded-lg shadow-lg border z-[1000]">
                    <div className="text-xs font-medium">
                        <Navigation className="h-3 w-3 inline mr-1" />
                        Planificador de Rutas
                    </div>
                    <div className="text-xs text-muted-foreground">
                        Haz clic para crear puntos de ruta
                    </div>
                </div>
            </div>
        </div>
    )
}
