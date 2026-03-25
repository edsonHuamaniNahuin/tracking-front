import type { ApiResponse } from '../api'

export interface MainMetrics {
    total_vessels: number;
    active_vessels: number;
    total_trackings: number;
    total_users: number;
    vessels_with_alerts: number;
    maintenance_vessels: number;
}

export interface VesselsByType {
    type: string;
    count: number;
}

export interface VesselsByStatus {
    status: string;
    count: number;
}

export interface VesselPosition {
    id: number;
    name: string;
    imo: string;
    type: string;
    status: string;
    latitude: string;
    longitude: string;
    last_position_at: string;
}

export interface MonthlyActivity {
    month: string;
    month_name: string;
    trackings: number;
}

export interface FleetAging {
    age_group: string;
    count: number;
}

export interface PerformanceMetrics {
    avg_fleet_speed: number;
    avg_fuel_consumption: number;
    total_maintenance: string;
    total_incidents: string;
}

export interface DashboardStatsData {
    main_metrics: MainMetrics;
    vessels_by_type: VesselsByType[];
    vessels_by_status: VesselsByStatus[];
    vessel_positions: VesselPosition[];
    monthly_activity: MonthlyActivity[];
    fleet_aging: FleetAging[];
    performance_metrics: PerformanceMetrics;
}

export type DashboardStatsResponse = ApiResponse<DashboardStatsData>

export interface MonthlyActivity {
    month: string;
    month_name: string;
    trackings: number;
}

export interface FleetAging {
    age_group: string;
    count: number;
}

export interface PerformanceMetrics {
    avg_fleet_speed: number;
    avg_fuel_consumption: number;
    total_maintenance: string;
    total_incidents: string;
}

export interface DashboardStatsData {
    main_metrics: MainMetrics;
    vessels_by_type: VesselsByType[];
    vessels_by_status: VesselsByStatus[];
    vessel_positions: VesselPosition[];
    monthly_activity: MonthlyActivity[];
    fleet_aging: FleetAging[];
    performance_metrics: PerformanceMetrics;
}

export interface DashboardStatsResponse {
    status: number;
    message: string;
    data: DashboardStatsData;
}
