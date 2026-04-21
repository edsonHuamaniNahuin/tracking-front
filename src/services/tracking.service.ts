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
   * Obtiene todos los trackings de una embarcación entre dos fechas (inclusive).
   *
   * Política de granularidad (espeja la del backend):
   * - HOY       → se envían fecha+hora exactas; el backend filtra por hora.
   * - AYER ←   → se envía solo la fecha (sin hora); el backend devuelve el
   *               día completo (startOfDay→endOfDay). El filtro por hora queda
   *               en manos del componente que consume esta función.
   *
   * El cache key usa fechas normalizadas (sin hora para días históricos), de modo
   * que distintas consultas sobre el mismo día pasado siempre reutilizan la misma
   * entrada de sessionStorage.
   */
  getTrackings: async (
    vesselId: number,
    from: string,
    to: string
  ): Promise<Tracking[]> => {
    const todayStart = new Date()
    todayStart.setHours(0, 0, 0, 0)

    const fromDate = new Date(from)
    const toDate   = new Date(to)

    // Normalizar: días anteriores a hoy → solo fecha (backend los tratará como día completo)
    const apiFrom = fromDate < todayStart ? from.slice(0, 10) : from
    const apiTo   = toDate   < todayStart ? to.slice(0, 10)   : to

    // Cache solo para rangos completamente en el pasado (resultado inmutable)
    const isHistorical = toDate < todayStart
    const cacheKey = `tk_${vesselId}_${apiFrom}_${apiTo}`

    if (isHistorical) {
      const cached = sessionStorage.getItem(cacheKey)
      if (cached) {
        try { return JSON.parse(cached) as Tracking[] } catch { /* parse fail → refetch */ }
      }
    }

    // Loop secuencial: espera cada página antes de pedir la siguiente.
    const PER_PAGE = 5000
    let page     = 1
    let lastPage = 1
    const allData: Tracking[] = []

    do {
      const response = await api.get<PaginatedTrackingResponse>(`/trackings`, {
        params: {
          vessel_id: vesselId,
          date_from: apiFrom,
          date_to:   apiTo,
          per_page: PER_PAGE,
          page,
        },
      })
      allData.push(...response.data.data)
      lastPage = response.data.meta.last_page
      page++
    } while (page <= lastPage)

    if (isHistorical) {
      try { sessionStorage.setItem(cacheKey, JSON.stringify(allData)) } catch { /* quota exceeded — skip */ }
    }

    return allData
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
