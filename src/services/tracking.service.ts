// src/services/tracking.service.ts
import api from './api'
import type { CreateTrackingRequest, Tracking } from '@/types/tracking'
import { PaginatedTrackingResponse } from '@/types/pagination/paginatedTrackingResponse'

/**
 * Estructura de datos procesados
 */
export interface ProcessedTrackingData {
  trackings: Tracking[]
  dailyDistances: { date: string; distance: number; count: number }[]
  speeds: (Tracking & { speed: number })[]
}

export const trackingService = {
  /**
   * Obtiene todos los trackings de una embarcación
   * entre dos fechas (inclusive).
   */
  getTrackings: async (
    vesselId: number,
    from: string,
    to: string
  ): Promise<Tracking[]> => {
    const response = await api.get<PaginatedTrackingResponse>(`/trackings`, {
      params: {
        vessel_id: vesselId,
        date_from: from,
        date_to: to,
        per_page: 1000,
        page: 1,
      },
    })
    return response.data.data
  },

  /**
   * Envía un nuevo punto de tracking.
   */
  postTracking: async (
    data: CreateTrackingRequest
  ): Promise<Tracking> => {
    const response = await api.post<Tracking>('/trackings', data)
    return response.data
  },

  /**
   * Procesa un array de trackings:
   * - Ordena por fecha
   * - Calcula distancias diarias y cuenta de puntos
   * - Calcula velocidad (m/s) en cada tramo
   */
  processTrackingData: (
    raw: Tracking[]
  ): ProcessedTrackingData => {
    // Helper para Haversine
    const toRad = (deg: number) => (deg * Math.PI) / 180
    const haversine = (
      [lat1, lon1]: [number, number],
      [lat2, lon2]: [number, number]
    ) => {
      const R = 6371000 // metros
      const dLat = toRad(lat2 - lat1)
      const dLon = toRad(lon2 - lon1)
      const a =
        Math.sin(dLat / 2) ** 2 +
        Math.cos(toRad(lat1)) *
        Math.cos(toRad(lat2)) *
        Math.sin(dLon / 2) ** 2
      const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
      return R * c
    }

    // 1) Ordenar trackings por fecha
    const trackings = [...raw].sort(
      (a, b) =>
        new Date(a.tracked_at).getTime() -
        new Date(b.tracked_at).getTime()
    )

    // 2) Velocidades
    const speeds: (Tracking & { speed: number })[] = trackings.map(
      (pt, i, arr) => {
        if (i === 0) return { ...pt, speed: 0 }
        const prev = arr[i - 1]
        const dist = haversine(
          [Number(prev.latitude), Number(prev.longitude)],
          [Number(pt.latitude), Number(pt.longitude)]
        )
        const dt =
          (new Date(pt.tracked_at).getTime() -
            new Date(prev.tracked_at).getTime()) /
          1000 // segundos
        return {
          ...pt,
          speed: dt > 0 ? dist / dt : 0, // m/s
        }
      }
    )

    // 3) Distancias diarias
    const dailyMap = new Map<
      string,
      { distance: number; count: number }
    >()
    trackings.forEach((pt, i, arr) => {
      const dateKey = pt.tracked_at.split('T')[0]
      const prev = arr[i - 1]
      const dist =
        i > 0
          ? haversine(
            [Number(prev.latitude), Number(prev.longitude)],
            [Number(pt.latitude), Number(pt.longitude)]
          )
          : 0
      const entry = dailyMap.get(dateKey) || { distance: 0, count: 0 }
      entry.distance += dist
      entry.count += 1
      dailyMap.set(dateKey, entry)
    })
    const dailyDistances = Array.from(dailyMap.entries()).map(
      ([date, { distance, count }]) => ({
        date,
        distance,
        count,
      })
    )

    return { trackings, dailyDistances, speeds }
  },

  /**
   * Obtiene trackings paginados.
   */
  getPaginatedTrackings: async (
    params?: { vessel_id?: number; page?: number; per_page?: number }
  ): Promise<PaginatedTrackingResponse> => {
    const response = await api.get<PaginatedTrackingResponse>('/trackings', {
      params,
    })
    return response.data
  },
}
