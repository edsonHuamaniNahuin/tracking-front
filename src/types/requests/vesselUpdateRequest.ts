export interface VesselUpdateRequest {
    name?: string;
    imo?: string;
    vessel_type_id?: number;
    vessel_status_id?: number;
    description?: string;
    photoUrl?: string;
}
