// src/services/vesselType.service.ts

import api from "./api"
import type { VesselType } from "@/types/models/vesselType"
import type { VesselTypeSearchRequest } from "@/types/requests/vesselTypeSearchRequest"
import type { VesselTypePaginatedResponse } from "@/types/pagination/vesselTypePaginatedResponse"
import type { VesselTypeCreateRequest } from "@/types/requests/vesselTypeCreateRequest"
import type { VesselTypeCreateResponse } from "@/types/responses/vesselTypeCreateResponse"
import type { VesselTypeUpdateRequest } from "@/types/requests/vesselTypeUpdateRequest"
import type { VesselTypeUpdateResponse } from "@/types/responses/vesselTypeUpdateResponse"
import type { ApiResponse } from "@/types/api"

export const vesselTypeService = {
    /**
     * GET /vessel-types?page=&per_page=&name?
     */
    getTypes: async (
        params: VesselTypeSearchRequest
    ): Promise<VesselTypePaginatedResponse> => {
        const response = await api.get<VesselTypePaginatedResponse>("/vessels-types", {
            params,
        })
        return response.data
    },

    /**
     * GET /vessel-types/{id}
     */
    getType: async (id: number): Promise<ApiResponse<VesselType>> => {
        const response = await api.get<ApiResponse<VesselType>>(`/vessel-type/${id}`)
        return response.data
    },

    /**
     * POST /vessel-types
     */
    createType: async (
        payload: VesselTypeCreateRequest
    ): Promise<VesselType> => {
        const response = await api.post<VesselTypeCreateResponse>("/vessel-types", payload)
        return response.data.data
    },

    /**
     * PUT /vessel-types/{id}
     */
    updateType: async (
        id: number,
        payload: VesselTypeUpdateRequest
    ): Promise<VesselType> => {
        const response = await api.put<VesselTypeUpdateResponse>(`/vessel-types/${id}`, payload)
        return response.data.data
    },

    /**
     * DELETE /vessel-types/{id}
     */
    deleteType: async (id: number): Promise<void> => {
        await api.delete(`/vessel-types/${id}`)
    },
}
