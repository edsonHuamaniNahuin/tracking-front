// src/types/fleet.ts

export interface Fleet {
  id: number
  user_id: number
  name: string
  description: string | null
  color: string
  vessels_count?: number
  vessels?: FleetVessel[]
  user?: {
    id: number
    name: string
    email: string
    username: string
  }
  created_at: string
  updated_at: string
}

/** Embarcación simplificada dentro del detalle de flota */
export interface FleetVessel {
  id: number
  name: string
  imo: string | null
  fleet_id: number | null
  vessel_type: { id: number; name: string; slug: string } | null
  vessel_status: { id: number; name: string; slug: string } | null
}

export interface StoreFleetRequest {
  name: string
  description?: string
  color?: string
}

export interface UpdateFleetRequest {
  name?: string
  description?: string
  color?: string
}

/** Constantes de tipos de unidades rastreadas — reflejan los slugs de BD */
export const VESSEL_TYPE_SLUGS = {
  // Marítimos
  CARGO     : 'carguero',
  OIL       : 'petrolero',
  PASSENGER : 'pasajeros',
  FISHING   : 'pesquero',
  TUG       : 'remolcador',
  OTHER     : 'otros',
  // Terrestres
  BUS_INTERPROVINCIAL : 'bus-interprovincial',
  BUS_URBANO          : 'bus-urbano',
  TRUCK               : 'camion',
  TAXI                : 'taxi',
  MOTORCYCLE          : 'motocicleta',
  OTHER_TERRESTRIAL   : 'otros-terrestre',
} as const

export type VesselTypeSlug = typeof VESSEL_TYPE_SLUGS[keyof typeof VESSEL_TYPE_SLUGS]
