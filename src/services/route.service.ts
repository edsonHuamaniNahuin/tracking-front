import api from './api'

export interface SavedRoute {
    id: number
    user_id: number
    name: string
    points: { lat: number; lng: number; name?: string }[]
    color: string
    vessel_id: number | null
    created_at: string
    updated_at: string
}

export const routeService = {
    async list(): Promise<SavedRoute[]> {
        const resp = await api.get<{ data: SavedRoute[] }>('/routes')
        return resp.data.data
    },

    async create(data: {
        name: string
        points: { lat: number; lng: number; name?: string }[]
        color: string
        vesselId?: string | null
    }): Promise<SavedRoute> {
        const resp = await api.post<{ data: SavedRoute }>('/routes', data)
        return resp.data.data
    },

    async remove(id: number): Promise<void> {
        await api.delete(`/routes/${id}`)
    },
}
