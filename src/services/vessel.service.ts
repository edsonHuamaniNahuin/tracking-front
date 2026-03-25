
import api from './api'
import { VesselSearchRequest } from '@/types/requests/vesselSearchRequest'
import { VesselPaginatedResponse } from '@/types/pagination/vesselPaginatedResponse'
import { Vessel } from '@/types/models/vessel'
import { VesselCreateRequest } from '@/types/requests/vesselCreateRequest'
import { VesselCreateResponse } from '@/types/responses/vesselCreateResponse'
import { VesselUpdateResponse } from '@/types/responses/vesselUpdateResponse'
import { VesselUpdateRequest } from '@/types/requests/vesselUpdateRequest'
import { VesselResponse } from '@/types/responses/vesselResponse'

export const vesselService = {
  /**
   * Obtiene la lista paginada de embarcaciones con filtros opcionales.
   * @param params Objeto con { page, per_page, name?, imo? }
   */
  getVessels: async (
    params: VesselSearchRequest
  ): Promise<VesselPaginatedResponse> => {
    const response = await api.get<VesselPaginatedResponse>("/vessels", {
      params
    })
    return response.data
  },

  /**
   * Obtiene una embarcación por su ID.
   * GET /vessels/{id}
   */
  getVessel: async (id: number): Promise<VesselResponse> => {
    const response = await api.get<VesselResponse>(`/vessels/${id}`)
    return response.data
  },

  /**
   * Crea una nueva embarcación.
   * POST /vessels
   */
  createVessel: async (payload: VesselCreateRequest): Promise<Vessel> => {
    const response = await api.post<VesselCreateResponse>("/vessels", payload)
    return response.data.data
  },

  /**
   * Actualiza una embarcación existente.
   * PUT /vessels/{id}
   */
  updateVessel: async (
    id: number,
    payload: VesselUpdateRequest
  ): Promise<Vessel> => {
    const response = await api.put<VesselUpdateResponse>(`/vessels/${id}`, payload)
    return response.data.data
  },

  /**
   * Elimina una embarcación.
   * DELETE /vessels/{id}
   */
  deleteVessel: async (id: number): Promise<void> => {
    await api.delete(`/vessels/${id}`)
  },

  // ── Gestión del dispositivo IoT ──────────────────────────────────────────

  /**
   * Obtiene el device_token en claro de una embarcación.
   * GET /vessels/{id}/device/token
   */
  getDeviceToken: async (id: number): Promise<{ device_token: string | null; has_token: boolean }> => {
    const response = await api.get(`/vessels/${id}/device/token`)
    return response.data.data
  },

  /**
   * Genera un nuevo device_token (invalida el anterior).
   * POST /vessels/{id}/device/token/regen
   */
  regenerateDeviceToken: async (id: number): Promise<{ device_token: string }> => {
    const response = await api.post(`/vessels/${id}/device/token/regen`)
    return response.data.data
  },

  /**
   * Encola un comando de reinicio para el microcontrolador.
   * POST /vessels/{id}/device/reboot
   */
  rebootDevice: async (id: number): Promise<void> => {
    await api.post(`/vessels/${id}/device/reboot`)
  },

  /**
   * Estado de conexión del dispositivo IoT.
   * GET /vessels/{id}/device/status
   */
  getDeviceStatus: async (id: number): Promise<{
    vessel_id: number
    vessel_name: string
    is_online: boolean
    last_seen_at: string | null
    last_seen_ago: string | null
    firmware_version: string | null
    device_ip: string | null
    device_uptime: number | null
    device_uptime_human: string | null
    send_interval: number
    pending_command: string | null
    has_token: boolean
    last_position: {
      latitude: number
      longitude: number
      tracked_at: string
      utm: { zone: string; easting: number; northing: number; datum: string; label: string }
      quad_tile: { zoom: number; quadkey: string; tile_x: number; tile_y: number }
    } | null
  }> => {
    const response = await api.get(`/vessels/${id}/device/status`)
    return response.data.data
  },

  /**
   * Logs de telemetría del dispositivo para diagnóstico.
   * GET /vessels/{id}/device/logs
   */
  getDeviceLogs: async (id: number, limit = 50): Promise<{
    vessel_id: number
    vessel_name: string
    is_online: boolean
    device_ip: string | null
    firmware: string | null
    uptime: number | null
    last_seen_at: string | null
    total_logs: number
    total_trackings: number
    logs: Array<{
      type: string
      timestamp: string
      latitude: number
      longitude: number
      speed: number
      course: number | null
      fuel_level: number | null
      rpm: number | null
      voltage: number | null
      raw_data: Record<string, unknown> | null
      utm: string | null
    }>
    trackings: Array<{
      id: number
      latitude: string
      longitude: string
      tracked_at: string
      created_at: string
    }>
  }> => {
    const response = await api.get(`/vessels/${id}/device/logs`, { params: { limit } })
    return response.data.data
  },
}