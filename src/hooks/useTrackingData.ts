
import { useState, useEffect } from "react"
import type { Tracking } from "../types/tracking"
import type {  FilterState } from "../types/filterState"
import { trackingService } from "../services/tracking.service"


interface TrackingDataState {
  trackings: Tracking[]
  dailyDistances: { date: string; distance: number; count: number }[]
  speeds: (Tracking & { speed?: number })[]
  loading: boolean
  error: string | null
}

export const useTrackingData = (filters: FilterState) => {
  const [state, setState] = useState<TrackingDataState>({
    trackings: [],
    dailyDistances: [],
    speeds: [],
    loading: false,
    error: null,
  })

  useEffect(() => {
    const fetchData = async () => {
      // Solo hacer fetch si tenemos vesselId y rango de fechas
      if (!filters.vesselId || !filters.dateRange.from || !filters.dateRange.to) {
        return
      }

      setState((prev) => ({ ...prev, loading: true, error: null }))

      try {
        const trackings = await trackingService.getTrackings(filters.vesselId, filters.dateRange.from, filters.dateRange.to)

        const processedData = trackingService.processTrackingData(trackings)

        setState({
          trackings: processedData.trackings,
          dailyDistances: processedData.dailyDistances,
          speeds: processedData.speeds,
          loading: false,
          error: null,
        })
      } catch (error) {
        setState((prev) => ({
          ...prev,
          loading: false,
          error: "Error al cargar los datos de seguimiento",
        }))
      }
    }

    fetchData()
  }, [filters.vesselId, filters.dateRange.from, filters.dateRange.to])

  return state
}
