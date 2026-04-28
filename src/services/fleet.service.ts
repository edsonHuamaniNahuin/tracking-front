// src/services/fleet.service.ts
import api from './api'
import type { Fleet, StoreFleetRequest, UpdateFleetRequest } from '@/types/fleet'

export const fleetService = {
  /** Lista flotas del usuario autenticado (admin ve todas). */
  async list(): Promise<Fleet[]> {
    const res = await api.get<{ data: Fleet[] }>('/fleets')
    return res.data.data
  },

  /** Detalle de una flota con sus embarcaciones. */
  async get(id: number): Promise<Fleet> {
    const res = await api.get<{ data: Fleet }>(`/fleets/${id}`)
    return res.data.data
  },

  /** Crea una nueva flota. */
  async create(payload: StoreFleetRequest): Promise<Fleet> {
    const res = await api.post<{ data: Fleet }>('/fleets', payload)
    return res.data.data
  },

  /** Actualiza nombre, descripción o color. */
  async update(id: number, payload: UpdateFleetRequest): Promise<Fleet> {
    const res = await api.put<{ data: Fleet }>(`/fleets/${id}`, payload)
    return res.data.data
  },

  /** Elimina (soft delete) una flota. */
  async delete(id: number): Promise<void> {
    await api.delete(`/fleets/${id}`)
  },

  /** Asigna una embarcación a una flota. */
  async assignVessel(fleetId: number, vesselId: number): Promise<void> {
    await api.post(`/fleets/${fleetId}/vessels/${vesselId}`)
  },

  /** Quita una embarcación de una flota. */
  async removeVessel(fleetId: number, vesselId: number): Promise<void> {
    await api.delete(`/fleets/${fleetId}/vessels/${vesselId}`)
  },
}
