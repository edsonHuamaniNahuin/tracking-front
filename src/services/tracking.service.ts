// src/services/tracking.service.ts
import api from './api'
import { trackingCacheService } from './trackingCache.service'
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

    // Días históricos: inmutables → se sirven desde caché si existen
    // Hoy: siempre va a la API (datos en tiempo real), pero igual se persiste en IndexedDB
    const isHistorical = toDate < todayStart
    const cacheKey = `tk_${vesselId}_${apiFrom}_${apiTo}`

    if (isHistorical) {
      const cached = await trackingCacheService.get(cacheKey)
      if (cached) return cached
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

    // Siempre persistir en IndexedDB (históricos: inmutables; hoy: se sobreescribe en cada fetch)
    trackingCacheService.set(cacheKey, allData).catch(() => { /* fallo silencioso */ })

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
   * Devuelve los días (YYYY-MM-DD) en que la embarcación tiene registros.
   *
   * Estrategia de caché (sessionStorage, clave `tk_days_{vesselId}`):
   *   - Se guarda `{ days: string[], cachedAt: string }` donde `cachedAt` es la
   *     fecha de hoy en formato YYYY-MM-DD.
   *   - Al leer: si `cachedAt === hoy` → caché válida, sin petición a red.
   *   - Si `cachedAt < hoy` → la embarcación puede tener días nuevos (días
   *     transcurridos desde el último caché). Se refetch y se actualiza el caché.
   *   - Así el dato nunca queda desactualizado al avanzar días de calendario.
   *
   * Consulta ligera en el backend: GROUP BY DATE(tracked_at) con índice compuesto.
   */
  getVesselTrackingDays: async (vesselId: number): Promise<string[]> => {
    const cacheKey = `tk_days_${vesselId}`
    const today    = new Date().toISOString().slice(0, 10)   // YYYY-MM-DD local naive

    const rawCached = sessionStorage.getItem(cacheKey)
    if (rawCached) {
      try {
        const parsed = JSON.parse(rawCached) as { days: string[]; cachedAt: string }
        if (parsed.cachedAt === today) {
          // Caché creada hoy → todavía válida
          return parsed.days
        }
        // cachedAt < hoy → pueden haber días nuevos; continúa al fetch
      } catch { /* formato inválido → refetch */ }
    }

    const response = await api.get<{ data: string[] }>(`/vessels/${vesselId}/tracking-days`)
    const days: string[] = response.data.data ?? []

    try {
      sessionStorage.setItem(cacheKey, JSON.stringify({ days, cachedAt: today }))
    } catch { /* quota exceeded — caché omitida */ }

    return days
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
