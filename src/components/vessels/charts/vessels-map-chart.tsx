"use client"

import { useState } from "react"
import { Card } from "@/components/ui/card"
import { Ship, MapPin } from "lucide-react"
import type { VesselPosition } from "@/types/models/dashboardStats"
import { formatDate } from "@/utils/date"

interface VesselsMapChartProps {
    data: VesselPosition[]
    height?: number
    isLoading?: boolean
}

export function VesselsMapChart({ data, height = 400, isLoading = false }: VesselsMapChartProps) {
    const [activeVessel, setActiveVessel] = useState<VesselPosition | null>(null)

    if (isLoading) {
        return (
            <div className="flex items-center justify-center" style={{ height }}>
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
            </div>
        )
    }

    // Validar que data sea un array válido
    const safeData = Array.isArray(data) ? data : []

    // Si no hay datos, mostrar mensaje
    if (safeData.length === 0) {
        return (
            <div className="flex items-center justify-center" style={{ height }}>
                <div className="text-center text-sm text-muted-foreground">
                    <MapPin className="mx-auto h-8 w-8 mb-2" />
                    <p>No hay posiciones de embarcaciones disponibles</p>
                </div>
            </div>
        )
    }

    // Función para normalizar coordenadas a porcentajes (0-100)
    const normalizePosition = (lat: string, lng: string) => {
        const latitude = parseFloat(lat)
        const longitude = parseFloat(lng)

        // Normalizar latitud (-90 a 90) a porcentaje (0-100)
        const normalizedLat = ((latitude + 90) / 180) * 100

        // Normalizar longitud (-180 a 180) a porcentaje (0-100)
        const normalizedLng = ((longitude + 180) / 360) * 100

        return { x: normalizedLng, y: 100 - normalizedLat } // Invertir Y para que el norte esté arriba
    }

    // Función para obtener color según el tipo de embarcación
    const getVesselColor = (type: string) => {
        const colors = {
            "Carguero": "text-blue-600",
            "Petrolero": "text-cyan-600",
            "Pasajeros": "text-indigo-600",
            "Pesquero": "text-green-600",
            "Remolcador": "text-purple-600",
            "Otros": "text-gray-600"
        }
        return colors[type as keyof typeof colors] || "text-gray-600"
    }

    // Función para obtener color según el estado
    const getStatusColor = (status: string) => {
        const colors = {
            "Activa": "bg-green-500",
            "En Mantenimiento": "bg-yellow-500",
            "Inactiva": "bg-gray-500",
            "Con Alertas": "bg-red-500"
        }
        return colors[status as keyof typeof colors] || "bg-gray-500"
    }

    return (
        <div style={{ height: height }} className="relative bg-gradient-to-br from-blue-50 to-blue-100 rounded-lg overflow-hidden border">
            {/* Fondo simulado del mapa */}
            <div className="absolute inset-0 opacity-20">
                <div className="w-full h-full bg-gradient-to-r from-blue-200 via-blue-100 to-green-100"></div>
            </div>            {/* Embarcaciones en el mapa */}
            {safeData.map((vessel) => {
                const position = normalizePosition(vessel.latitude, vessel.longitude)
                return (
                    <div
                        key={vessel.id}
                        className="absolute cursor-pointer transform -translate-x-1/2 -translate-y-1/2 transition-all hover:scale-125 z-10"
                        style={{
                            left: `${Math.min(Math.max(position.x, 5), 95)}%`,
                            top: `${Math.min(Math.max(position.y, 5), 95)}%`
                        }}
                        onMouseEnter={() => setActiveVessel(vessel)}
                        onClick={() => setActiveVessel(vessel === activeVessel ? null : vessel)}
                    >
                        <div className="relative">
                            <Ship className={`h-6 w-6 ${getVesselColor(vessel.type)} drop-shadow-sm`} />
                            <div className={`absolute -top-1 -right-1 w-3 h-3 rounded-full ${getStatusColor(vessel.status)}`}></div>
                        </div>
                    </div>
                )
            })}

            {/* Tooltip para embarcación activa - Arreglado para evitar parpadeo */}
            {activeVessel && (
                <Card
                    className="absolute p-3 z-20 shadow-lg max-w-xs pointer-events-none"
                    style={{
                        left: `${Math.min(Math.max(normalizePosition(activeVessel.latitude, activeVessel.longitude).x, 5), 70)}%`,
                        top: `${Math.min(Math.max(normalizePosition(activeVessel.latitude, activeVessel.longitude).y - 15, 5), 80)}%`,
                        transform: "translateX(-50%)",
                    }}
                >
                    <div className="text-sm font-medium">{activeVessel.name}</div>
                    <div className="text-xs text-muted-foreground">IMO: {activeVessel.imo}</div>
                    <div className="text-xs text-muted-foreground">Tipo: {activeVessel.type}</div>
                    <div className="text-xs text-muted-foreground">Estado: {activeVessel.status}</div>
                    <div className="text-xs text-muted-foreground">
                        Última posición: {formatDate(activeVessel.last_position_at)}
                    </div>
                </Card>
            )}

            {/* Botón para cerrar tooltip en móvil */}
            {activeVessel && (
                <button
                    onClick={() => setActiveVessel(null)}
                    className="absolute top-2 right-2 z-30 bg-background/90 backdrop-blur-sm p-1 rounded-full shadow-lg border"
                >
                    ✕
                </button>
            )}

            {/* Leyenda */}
            <div className="absolute bottom-4 right-4 bg-background/90 backdrop-blur-sm p-3 rounded-lg shadow-lg border">
                <div className="text-sm font-medium mb-2">Tipos de embarcaciones</div>
                <div className="space-y-1">
                    <div className="flex items-center">
                        <Ship className="h-4 w-4 text-blue-600 mr-2" />
                        <span className="text-xs">Carguero</span>
                    </div>
                    <div className="flex items-center">
                        <Ship className="h-4 w-4 text-cyan-600 mr-2" />
                        <span className="text-xs">Petrolero</span>
                    </div>
                    <div className="flex items-center">
                        <Ship className="h-4 w-4 text-indigo-600 mr-2" />
                        <span className="text-xs">Pasajeros</span>
                    </div>
                    <div className="flex items-center">
                        <Ship className="h-4 w-4 text-green-600 mr-2" />
                        <span className="text-xs">Pesquero</span>
                    </div>
                </div>
                <div className="text-sm font-medium mt-3 mb-2">Estados</div>
                <div className="space-y-1">
                    <div className="flex items-center">
                        <div className="w-3 h-3 bg-green-500 rounded-full mr-2"></div>
                        <span className="text-xs">Activa</span>
                    </div>
                    <div className="flex items-center">
                        <div className="w-3 h-3 bg-yellow-500 rounded-full mr-2"></div>
                        <span className="text-xs">Mantenimiento</span>
                    </div>
                    <div className="flex items-center">
                        <div className="w-3 h-3 bg-red-500 rounded-full mr-2"></div>
                        <span className="text-xs">Con Alertas</span>
                    </div>
                </div>
            </div>

            {/* Información adicional */}
            <div className="absolute top-4 left-4 bg-background/90 backdrop-blur-sm p-3 rounded-lg shadow-lg border">
                <div className="text-sm font-medium">Posiciones de Flota</div>
                <div className="text-xs text-muted-foreground">{data.length} embarcaciones</div>
            </div>
        </div>
    )
}
