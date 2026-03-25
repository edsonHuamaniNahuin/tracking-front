import { useState, useEffect, useCallback, useRef } from 'react'
import { telemetryService } from '@/services/telemetry.service'
import type { VesselTelemetry, WeatherForecast } from '@/types/models/vesselTelemetry'

const POLL_INTERVAL_MS = 30_000 // 30 segundos

interface TelemetryState {
    position: VesselTelemetry | null
    weather: WeatherForecast | null
    loading: boolean
    error: string | null
    lastUpdated: Date | null
}

/**
 * Hook para telemetría en vivo de una embarcación.
 * Hace polling cada 30 segundos cuando autoRefresh es true.
 *
 * @param vesselId  ID de la embarcación (null para desactivar)
 * @param autoRefresh  Activa/desactiva el polling automático
 */
export const useTelemetry = (vesselId: number | null, autoRefresh = true) => {
    const [state, setState] = useState<TelemetryState>({
        position: null,
        weather: null,
        loading: false,
        error: null,
        lastUpdated: null,
    })

    const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null)

    const fetchTelemetry = useCallback(async () => {
        if (!vesselId) return

        setState(prev => ({ ...prev, loading: true, error: null }))

        const [posResult, weatherResult] = await Promise.allSettled([
            telemetryService.getLatestPosition(vesselId),
            telemetryService.getWeather(vesselId),
        ])

        setState(prev => ({
            ...prev,
            position:
                posResult.status === 'fulfilled' ? posResult.value.data : prev.position,
            weather:
                weatherResult.status === 'fulfilled'
                    ? weatherResult.value.data
                    : prev.weather,
            loading: false,
            lastUpdated: new Date(),
            error:
                posResult.status === 'rejected'
                    ? 'Sin datos de telemetría disponibles para esta embarcación'
                    : null,
        }))
    }, [vesselId])

    // Fetch inicial cuando cambia el vesselId
    useEffect(() => {
        setState({
            position: null,
            weather: null,
            loading: false,
            error: null,
            lastUpdated: null,
        })
        fetchTelemetry()
    }, [fetchTelemetry])

    // Polling automático
    useEffect(() => {
        if (!autoRefresh || !vesselId) return

        intervalRef.current = setInterval(fetchTelemetry, POLL_INTERVAL_MS)
        return () => {
            if (intervalRef.current) clearInterval(intervalRef.current)
        }
    }, [fetchTelemetry, autoRefresh, vesselId])

    return { ...state, refresh: fetchTelemetry }
}
