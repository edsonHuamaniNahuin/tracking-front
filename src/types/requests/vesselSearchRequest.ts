
export interface VesselSearchRequest {
    page: number
    per_page: number
    name?: string
    imo?: string
    own_only?: boolean
}