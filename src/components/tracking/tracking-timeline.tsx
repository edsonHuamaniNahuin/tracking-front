import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { ScrollArea } from "@/components/ui/scroll-area"
import {
    Clock,
    MapPin,
    Navigation,
    Anchor,
    Activity,
    TrendingUp,
    TrendingDown,
    Minus
} from "lucide-react"
import { formatTimeMedium } from "@/utils/date"
import type { Tracking } from "@/types/tracking"

interface TrackingTimelineProps {
    trackings: Tracking[]
    selectedTracking: Tracking | null
    onTrackingSelect: (tracking: Tracking) => void
    isLoading?: boolean
}

export function TrackingTimeline({
    trackings,
    selectedTracking,
    onTrackingSelect,
    isLoading = false
}: TrackingTimelineProps) {
    const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc')    // Ordenar trackings por fecha
    const sortedTrackings = [...trackings].sort((a, b) => {
        const dateA = new Date(a.reportedAt || a.tracked_at || a.created_at).getTime()
        const dateB = new Date(b.reportedAt || b.tracked_at || b.created_at).getTime()
        return sortOrder === 'desc' ? dateB - dateA : dateA - dateB
    })

    // Función para obtener el estado del movimiento
    const getMovementStatus = (tracking: Tracking, index: number) => {
        if (index === 0 || sortedTrackings.length === 1) return 'initial'

        const prevTracking = sortedTrackings[index - 1]
        const currentSpeed = tracking.speed || 0
        const prevSpeed = prevTracking.speed || 0

        if (currentSpeed > prevSpeed + 2) return 'accelerating'
        if (currentSpeed < prevSpeed - 2) return 'decelerating'
        if (currentSpeed < 1) return 'stopped'
        return 'steady'
    }

    // Función para obtener el icono del estado
    const getStatusIcon = (status: string) => {
        switch (status) {
            case 'accelerating':
                return <TrendingUp className="w-4 h-4 text-green-500" />
            case 'decelerating':
                return <TrendingDown className="w-4 h-4 text-orange-500" />
            case 'stopped':
                return <Anchor className="w-4 h-4 text-red-500" />
            case 'steady':
                return <Minus className="w-4 h-4 text-blue-500" />
            default:
                return <Navigation className="w-4 h-4 text-gray-500" />
        }
    }

    // Función para formatear la velocidad
    const formatSpeed = (speed?: number | string) => {
        const s = typeof speed === 'string' ? parseFloat(speed) : speed
        if (!s || isNaN(s)) return '0 kn'
        return `${s.toFixed(1)} kn`
    }

    // Función para formatear la distancia entre puntos
    const calculateDistance = (tracking: Tracking, index: number) => {
        if (index === 0 || sortedTrackings.length === 1) return null

        const prevTracking = sortedTrackings[index - 1]
        if (!prevTracking.latitude || !prevTracking.longitude ||
            !tracking.latitude || !tracking.longitude) return null

        const lat1 = parseFloat(String(tracking.latitude))
        const lon1 = parseFloat(String(tracking.longitude))
        const lat2 = parseFloat(String(prevTracking.latitude))
        const lon2 = parseFloat(String(prevTracking.longitude))

        if (isNaN(lat1) || isNaN(lon1) || isNaN(lat2) || isNaN(lon2)) return null

        // Fórmula de Haversine para calcular distancia
        const R = 6371 // Radio de la Tierra en km
        const dLat = (lat1 - lat2) * Math.PI / 180
        const dLon = (lon1 - lon2) * Math.PI / 180
        const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
            Math.cos(lat2 * Math.PI / 180) *
            Math.cos(lat1 * Math.PI / 180) *
            Math.sin(dLon / 2) * Math.sin(dLon / 2)
        const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
        const distance = R * c

        return distance < 1 ? `${(distance * 1000).toFixed(0)}m` : `${distance.toFixed(2)}km`
    }

    if (isLoading) {
        return (
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <Clock className="w-5 h-5" />
                        Línea de Tiempo
                    </CardTitle>
                    <CardDescription>
                        Cargando historial de seguimiento...
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <div className="space-y-4">
                        {[...Array(5)].map((_, i) => (
                            <div key={i} className="flex items-start gap-4 p-3 border rounded-lg animate-pulse">
                                <div className="w-8 h-8 bg-gray-200 rounded-full"></div>
                                <div className="flex-1 space-y-2">
                                    <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                                    <div className="h-3 bg-gray-100 rounded w-1/2"></div>
                                </div>
                            </div>
                        ))}
                    </div>
                </CardContent>
            </Card>
        )
    }

    if (!trackings.length) {
        return (
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <Clock className="w-5 h-5" />
                        Línea de Tiempo
                    </CardTitle>
                    <CardDescription>
                        No hay datos de seguimiento disponibles
                    </CardDescription>
                </CardHeader>
                <CardContent className="text-center py-8">
                    <Activity className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                    <p className="text-gray-500">
                        Selecciona una embarcación y un rango de fechas para ver el historial
                    </p>
                </CardContent>
            </Card>
        )
    }

    return (
        <Card>
            <CardHeader className="pb-2 pt-3 px-4">
                <div className="flex items-center justify-between">
                    <CardTitle className="flex items-center gap-2 text-sm">
                        <Clock className="w-4 h-4" />
                        Línea de Tiempo
                        <span className="text-xs font-normal text-muted-foreground">{trackings.length} pts</span>
                    </CardTitle>
                    <Button
                        variant="ghost"
                        size="sm"
                        className="h-6 px-2 text-xs"
                        onClick={() => setSortOrder(sortOrder === 'desc' ? 'asc' : 'desc')}
                    >
                        {sortOrder === 'desc' ? '↓ Reciente' : '↑ Antiguo'}
                    </Button>
                </div>
            </CardHeader>
            <CardContent className="px-4 pb-3">
                <ScrollArea className="h-[280px] pr-2">
                    <div className="space-y-1">
                        {sortedTrackings.map((tracking, index) => {
                            const isSelected = selectedTracking?.id === tracking.id
                            const movementStatus = getMovementStatus(tracking, index)
                            const distance = calculateDistance(tracking, index)
                            const reportDate = new Date(tracking.reportedAt || tracking.tracked_at || tracking.created_at)

                            return (
                                <div
                                    key={tracking.id}
                                    className={`
                                        flex items-center gap-2 px-2 py-1.5 rounded cursor-pointer transition-all text-xs
                                        ${isSelected
                                            ? 'bg-blue-50 ring-1 ring-blue-400'
                                            : 'hover:bg-muted/50'
                                        }
                                    `}
                                    onClick={() => onTrackingSelect(tracking)}
                                >
                                    {/* Icono de estado */}
                                    <div className="shrink-0">{getStatusIcon(movementStatus)}</div>

                                    {/* Hora + velocidad */}
                                    <span className="font-mono font-medium w-14 shrink-0">
                                        {formatTimeMedium(reportDate)}
                                    </span>
                                    <Badge variant="outline" className="text-[10px] px-1 py-0 shrink-0">
                                        {formatSpeed(tracking.speed)}
                                    </Badge>

                                    {/* Coordenadas */}
                                    <span className="text-muted-foreground truncate">
                                        {parseFloat(String(tracking.latitude)).toFixed(5)}, {parseFloat(String(tracking.longitude)).toFixed(5)}
                                    </span>

                                    {/* Distancia */}
                                    {distance && (
                                        <span className="ml-auto text-muted-foreground shrink-0">+{distance}</span>
                                    )}
                                </div>
                            )
                        })}
                    </div>
                </ScrollArea>
            </CardContent>
        </Card>
    )
}
