import api from './api';
import type { DashboardStatsResponse, DashboardStatsData } from '@/types/models/dashboardStats';

export const dashboardService = {
    /**
     * Obtiene las estadísticas del dashboard de embarcaciones
     */
    async getStats(): Promise<DashboardStatsData> {
        const response = await api.get<DashboardStatsResponse>('/dashboard/all-metrics');
        return response.data.data; // Devolver solo la parte data
    },

    /**
     * Obtiene las estadísticas del dashboard con filtros opcionales
     */    async getStatsWithFilters(params?: {
        start_date?: string;
        end_date?: string;
        vessel_type?: string;
        vessel_status?: string;
    }): Promise<DashboardStatsData> {
        const response = await api.get<DashboardStatsResponse>('/dashboard/all-metrics', {
            params
        });
        return response.data.data; // Devolver solo la parte data
    }
};
