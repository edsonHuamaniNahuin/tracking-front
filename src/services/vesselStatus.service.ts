// src/services/vesselStatus.service.ts

import api from "./api"
import type { VesselStatus } from "@/types/models/vesselStatus"
import type { VesselStatusSearchRequest } from "@/types/requests/vesselStatusSearchRequest"
import type { VesselStatusPaginatedResponse } from "@/types/pagination/vesselStatusPaginatedResponse"
import type { VesselStatusCreateRequest } from "@/types/requests/vesselStatusCreateRequest"
import type { VesselStatusCreateResponse } from "@/types/responses/vesselStatusCreateResponse"
import type { VesselStatusUpdateRequest } from "@/types/requests/vesselStatusUpdateRequest"
import type { VesselStatusUpdateResponse } from "@/types/responses/vesselStatusUpdateResponse"
import type { ApiResponse } from "@/types/api"

export const vesselStatusService = {
    /**
     * GET /vessel-statuses?page=&per_page=&name?
     */
    getStatuses: async (
        params: VesselStatusSearchRequest
    ): Promise<VesselStatusPaginatedResponse> => {
        const response = await api.get<VesselStatusPaginatedResponse>("/vessels-status", {
            params,
        })
        return response.data
    },

    /**
     * GET /vessel-statuses/{id}
     */
    getStatus: async (id: number): Promise<ApiResponse<VesselStatus>> => {
        const response = await api.get<ApiResponse<VesselStatus>>(`/vessel-status/${id}`)
        return response.data
    },

    /**
     * POST /vessel-statuses
     */
    createStatus: async (
        payload: VesselStatusCreateRequest
    ): Promise<VesselStatus> => {
        const response = await api.post<VesselStatusCreateResponse>("/vessel-status", payload)
        return response.data.data
    },

    /**
     * PUT /vessel-statuses/{id}
     */
    updateStatus: async (
        id: number,
        payload: VesselStatusUpdateRequest
    ): Promise<VesselStatus> => {
        const response = await api.put<VesselStatusUpdateResponse>(`/vessel-status/${id}`, payload)
        return response.data.data
    },

    /**
     * DELETE /vessel-statuses/{id}
     */
    deleteStatus: async (id: number): Promise<void> => {
        await api.delete(`/vessel-status/${id}`)
    },
}
