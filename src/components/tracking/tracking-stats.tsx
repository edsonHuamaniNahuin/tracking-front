import { useMemo } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import {
    Ship,
    MapPin,
    Clock,
    Route,
    Gauge,
    Navigation,
    Activity,
    Timer
} from "lucide-react"
import { differenceInMinutes } from "date-fns"
import { formatDate } from "@/utils/date"
import type { Tracking } from "@/types/tracking"
import type { Vessel } from "@/types/models/vessel"

interface TrackingStatsProps {
    trackings: Tracking[]
    vessel: Vessel | null
    isLoading?: boolean
}

export function TrackingStats({ trackings, vessel, isLoading = false }: TrackingStatsProps) {
    const stats = useMemo(() => {
        if (!trackings.length) {
            return {
                totalPoints: 0,
                totalDistance: 0,
                totalTime: 0,
                avgSpeed: 0,
                maxSpeed: 0,
                minSpeed: 0,
                timeMoving: 0,
                timeStopped: 0,
                firstPoint: null,
                lastPoint: null,
                coursesCount: 0,
                avgCourse: 0
            }
        }

        // Ordenar por fecha
        const sortedTrackings = [...trackings].sort((a, b) => {
            const dateA = new Date(a.reportedAt || a.tracked_at || a.created_at).getTime()
            const dateB = new Date(b.reportedAt || b.tracked_at || b.created_at).getTime()
            return dateA - dateB
        })

        const firstPoint = sortedTrackings[0]
        const lastPoint = sortedTrackings[sortedTrackings.length - 1]

        // Calcular distancia total usando la fórmula de Haversine
        let totalDistance = 0
        let totalTime = 0
        let timeMoving = 0
        let timeStopped = 0
        const speeds: number[] = []
        const courses: number[] = []

        for (let i = 1; i < sortedTrackings.length; i++) {
            const current = sortedTrackings[i]
            const previous = sortedTrackings[i - 1]

            let segmentDistanceKm = 0

            // Calcular distancia entre puntos
            if (current.latitude && current.longitude && previous.latitude && previous.longitude) {
                const R = 6371 // Radio de la Tierra en km
                const curLat = Number(current.latitude)
                const curLon = Number(current.longitude)
                const prevLat = Number(previous.latitude)
                const prevLon = Number(previous.longitude)
                const dLat = (curLat - prevLat) * Math.PI / 180
                const dLon = (curLon - prevLon) * Math.PI / 180
                const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
                    Math.cos(prevLat * Math.PI / 180) *
                    Math.cos(curLat * Math.PI / 180) *
                    Math.sin(dLon / 2) * Math.sin(dLon / 2)
                const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
                segmentDistanceKm = R * c
                totalDistance += segmentDistanceKm
            }

            // Calcular tiempo entre puntos
            const currentTime = new Date(current.reportedAt || current.tracked_at || current.created_at)
            const previousTime = new Date(previous.reportedAt || previous.tracked_at || previous.created_at)
            const timeDiffMin = differenceInMinutes(currentTime, previousTime)
            const timeDiffHours = (currentTime.getTime() - previousTime.getTime()) / 3_600_000
            totalTime += timeDiffMin

            // Calcular velocidad: usar speed del backend si existe y es > 0,
            // de lo contrario calcularla desde distancia/tiempo en nudos
            let segmentSpeed: number
            if (current.speed !== undefined && current.speed !== null && current.speed > 0) {
                segmentSpeed = current.speed
            } else if (segmentDistanceKm > 0 && timeDiffHours > 0) {
                // Convertir km/h a nudos (1 kn = 1.852 km/h)
                segmentSpeed = (segmentDistanceKm / timeDiffHours) / 1.852
            } else {
                segmentSpeed = 0
            }

            speeds.push(segmentSpeed)

            // Clasificar tiempo como en movimiento o parado (umbral 0.5 kn)
            if (segmentSpeed > 0.5) {
                timeMoving += timeDiffMin
            } else {
                timeStopped += timeDiffMin
            }

            if (current.course !== undefined && current.course !== null) {
                courses.push(current.course)
            }
        }

        // Calcular estadísticas de velocidad
        const avgSpeed = speeds.length > 0 ? speeds.reduce((a, b) => a + b, 0) / speeds.length : 0
        const maxSpeed = speeds.length > 0 ? Math.max(...speeds) : 0
        const minSpeed = speeds.length > 0 ? Math.min(...speeds) : 0

        // Calcular curso promedio
        const avgCourse = courses.length > 0 ? courses.reduce((a, b) => a + b, 0) / courses.length : 0

        return {
            totalPoints: trackings.length,
            totalDistance,
            totalTime,
            avgSpeed,
            maxSpeed,
            minSpeed,
            timeMoving,
            timeStopped,
            firstPoint,
            lastPoint,
            coursesCount: courses.length,
            avgCourse
        }
    }, [trackings])

    const formatDuration = (minutes: number) => {
        const hours = Math.floor(minutes / 60)
        const mins = minutes % 60
        if (hours > 0) {
            return `${hours}h ${mins}m`
        }
        return `${mins}m`
    }

    const formatSpeed = (speed: number) => {
        return `${speed.toFixed(1)} kn`
    }

    const formatDistance = (distance: number) => {
        if (distance < 1) {
            return `${(distance * 1000).toFixed(0)} m`
        }
        return `${distance.toFixed(2)} km`
    }

    if (isLoading) {
        return (
            <div className="space-y-4">
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <Activity className="w-5 h-5" />
                            Estadísticas de Seguimiento
                        </CardTitle>
                        <CardDescription>Cargando estadísticas...</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="grid grid-cols-2 gap-4">
                            {[...Array(6)].map((_, i) => (
                                <div key={i} className="space-y-2">
                                    <div className="h-4 bg-gray-200 rounded animate-pulse"></div>
                                    <div className="h-6 bg-gray-100 rounded animate-pulse"></div>
                                </div>
                            ))}
                        </div>
                    </CardContent>
                </Card>
            </div>
        )
    }

    if (!trackings.length) {
        return (
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <Activity className="w-5 h-5" />
                        Estadísticas de Seguimiento
                    </CardTitle>
                    <CardDescription>
                        No hay datos disponibles para mostrar estadísticas
                    </CardDescription>
                </CardHeader>
                <CardContent className="text-center py-8">
                    <Ship className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                    <p className="text-gray-500">
                        Selecciona una unidad para ver las estadísticas
                    </p>
                </CardContent>
            </Card>
        )
    }

    return (
        <Card>
            <CardHeader className="pb-2 pt-3 px-4">
                <CardTitle className="flex items-center gap-2 text-sm">
                    <Activity className="w-4 h-4" />
                    Resumen
                    {stats.firstPoint && stats.lastPoint && (
                        <span className="text-xs font-normal text-muted-foreground ml-auto">
                            {formatDate(stats.firstPoint.reportedAt || stats.firstPoint.tracked_at || stats.firstPoint.created_at, { day: '2-digit', month: 'short' })} – {formatDate(stats.lastPoint.reportedAt || stats.lastPoint.tracked_at || stats.lastPoint.created_at, { day: '2-digit', month: 'short', year: 'numeric' })}
                        </span>
                    )}
                </CardTitle>
            </CardHeader>
            <CardContent className="px-4 pb-3 space-y-3">
                {/* Métricas principales — grid compacto */}
                <div className="grid grid-cols-4 gap-2 text-center">
                    <div>
                        <div className="text-lg font-bold leading-tight">{stats.totalPoints}</div>
                        <div className="text-[10px] text-muted-foreground">Puntos</div>
                    </div>
                    <div>
                        <div className="text-lg font-bold leading-tight">{formatDistance(stats.totalDistance)}</div>
                        <div className="text-[10px] text-muted-foreground">Distancia</div>
                    </div>
                    <div>
                        <div className="text-lg font-bold leading-tight">{formatDuration(stats.totalTime)}</div>
                        <div className="text-[10px] text-muted-foreground">Tiempo</div>
                    </div>
                    <div>
                        <div className="text-lg font-bold leading-tight">{formatSpeed(stats.avgSpeed)}</div>
                        <div className="text-[10px] text-muted-foreground">Vel. prom.</div>
                    </div>
                </div>

                {/* Velocidad — con barra visual */}
                <div className="border-t pt-2 space-y-1.5">
                    <div className="flex items-center gap-2 text-xs">
                        <Gauge className="w-3.5 h-3.5 text-muted-foreground shrink-0" />
                        <span className="font-medium text-muted-foreground">Velocidad</span>
                    </div>
                    <div className="grid grid-cols-3 gap-1 text-center text-xs">
                        <div className="rounded bg-green-50 dark:bg-green-950/30 px-2 py-1">
                            <div className="font-bold text-green-600">{formatSpeed(stats.maxSpeed)}</div>
                            <div className="text-[10px] text-muted-foreground">Máx</div>
                        </div>
                        <div className="rounded bg-blue-50 dark:bg-blue-950/30 px-2 py-1">
                            <div className="font-bold text-blue-600">{formatSpeed(stats.avgSpeed)}</div>
                            <div className="text-[10px] text-muted-foreground">Prom</div>
                        </div>
                        <div className="rounded bg-orange-50 dark:bg-orange-950/30 px-2 py-1">
                            <div className="font-bold text-orange-600">{formatSpeed(stats.minSpeed)}</div>
                            <div className="text-[10px] text-muted-foreground">Mín</div>
                        </div>
                    </div>
                    {stats.maxSpeed > 0 && (
                        <div className="space-y-0.5">
                            <Progress value={(stats.avgSpeed / stats.maxSpeed) * 100} className="h-1.5" />
                            <div className="text-[10px] text-muted-foreground text-right">
                                Prom es el {((stats.avgSpeed / stats.maxSpeed) * 100).toFixed(0)}% del máx
                            </div>
                        </div>
                    )}
                </div>

                {/* Actividad — barras inline */}
                <div className="flex items-center gap-3 text-xs border-t pt-2">
                    <Clock className="w-3.5 h-3.5 text-muted-foreground shrink-0" />
                    <div className="flex-1 space-y-1">
                        <div className="flex justify-between">
                            <span>Movimiento {formatDuration(stats.timeMoving)}</span>
                            <span>Detenido {formatDuration(stats.timeStopped)}</span>
                        </div>
                        <Progress
                            value={stats.totalTime > 0 ? (stats.timeMoving / stats.totalTime) * 100 : 0}
                            className="h-1.5"
                        />
                    </div>
                </div>

                {/* Navegación — solo si hay datos */}
                {stats.coursesCount > 0 && (
                    <div className="flex items-center gap-3 text-xs border-t pt-2">
                        <Navigation className="w-3.5 h-3.5 text-muted-foreground shrink-0" />
                        <span>Rumbo prom. <strong>{stats.avgCourse.toFixed(0)}°</strong></span>
                        <span className="text-muted-foreground">({stats.coursesCount} pts)</span>
                    </div>
                )}
            </CardContent>
        </Card>
    )
}
