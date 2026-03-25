import api from './api'
import type { ApiResponse } from '@/types/api'
import type {
    VesselTelemetry,
    WeatherForecast,
    OptimalRoute,
} from '@/types/models/vesselTelemetry'

export interface StoreTelemetryPayload {
    vessel_id: number
    lat: number
    lng: number
    speed?: number
    course?: number
    fuel_level?: number
    rpm?: number
    voltage?: number
    raw_data?: Record<string, unknown>
    recorded_at?: string
}

export const telemetryService = {
    /**
     * Envía un ping de telemetría desde el microcontrolador.
     * El servidor devuelve 202 Accepted — el procesamiento es asíncrono.
     */
    store: async (payload: StoreTelemetryPayload): Promise<void> => {
        await api.post('/telemetry', payload)
    },

    /**
     * Obtiene la última posición conocida de una embarcación.
     * Primero busca en caché Redis (TTL 5 min), luego en BD.
     */
    getLatestPosition: async (
        vesselId: number
    ): Promise<ApiResponse<VesselTelemetry>> => {
        const response = await api.get<ApiResponse<VesselTelemetry>>(
            `/vessels/${vesselId}/telemetry/latest`
        )
        return response.data
    },

    /**
     * Obtiene las condiciones meteorológicas en la posición actual del barco.
     * Caché de 30 minutos en el backend.
     */
    getWeather: async (vesselId: number): Promise<ApiResponse<WeatherForecast>> => {
        const response = await api.get<ApiResponse<WeatherForecast>>(
            `/vessels/${vesselId}/telemetry/weather`
        )
        return response.data
    },

    /**
     * Calcula la ruta marítima óptima desde la posición actual hasta un destino.
     * Caché inmutable en el backend (misma ruta → mismo resultado).
     */
    getOptimalRoute: async (
        vesselId: number,
        destLat: number,
        destLng: number,
        speedKnots = 10
    ): Promise<ApiResponse<OptimalRoute>> => {
        const response = await api.get<ApiResponse<OptimalRoute>>(
            `/vessels/${vesselId}/telemetry/route`,
            {
                params: {
                    dest_lat: destLat,
                    dest_lng: destLng,
                    speed_knots: speedKnots,
                },
            }
        )
        return response.data
    },
}
