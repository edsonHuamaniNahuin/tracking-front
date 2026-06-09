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

    // Refs para que el handler de click del mapa siempre lea los valores actualizados
    const isCreatingRouteRef = useRef(isCreatingRoute)
    const currentRouteRef = useRef(currentRoute)
    useEffect(() => { isCreatingRouteRef.current = isCreatingRoute }, [isCreatingRoute])
    useEffect(() => { currentRouteRef.current = currentRoute }, [currentRoute])

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
                                <div class="vessel-marker" style="background-color: #3b82f6; width:28px; height:28px; border-radius:50%; display:flex; align-items:center; justify-content:center; border:2px solid white; box-shadow:0 2px 4px rgba(0,0,0,.3);">
                                    <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
                                        <path d="M2 21c.6.5 1.2 1 2.5 1 2.5 0 2.5-2 5-2 1.3 0 1.9.5 2.5 1"/>
                                        <path d="M19.5 21c.6-.5 1.2-1 2.5-1 2.5 0 2.5 2 5 2 1.3 0 1.9-.5 2.5-1"/>
                                        <path d="M2 21V8c0-1.1.9-2 2-2h4l2-3h4l2 3h4c1.1 0 2 .9 2 2v13"/>
                                    </svg>
                                </div>
                            `,
                            className: 'custom-vessel-marker',
                            iconSize: [28, 28],
                            iconAnchor: [14, 14]
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

                // Evento de clic para crear rutas (usa refs para lectura actualizada)
                map.on('click', (e: L.LeafletMouseEvent) => {
                    if (isCreatingRouteRef.current) {
                        const newPoint = { lat: e.latlng.lat, lng: e.latlng.lng }
                        const prevPoints = currentRouteRef.current
                        setCurrentRoute(prev => [...prev, newPoint])

                        // Agregar marcador temporal
                        L.marker([e.latlng.lat, e.latlng.lng])
                            .addTo(map)
                            .bindPopup(`Punto ${prevPoints.length + 1}`)

                        // Dibujar línea si hay más de un punto
                        if (prevPoints.length > 0) {
                            const last = prevPoints[prevPoints.length - 1]
                            L.polyline([
                                [last.lat, last.lng],
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
    }, [isClient, data])

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
