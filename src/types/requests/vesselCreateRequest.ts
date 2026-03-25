
export interface VesselCreateRequest {
    name: string;
    imo?: string;
    vessel_type_id: number;
    vessel_status_id: number;
    photoUrl: string;
}

