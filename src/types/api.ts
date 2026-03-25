/**
 * Tipos genéricos que modelan el contrato estándar de la API.
 *
 * Todas las respuestas siguen una de estas dos formas:
 *   - Recurso único : ApiResponse<T>            → { status, message, data: T }
 *   - Lista paginada: ApiPaginatedResponse<T>    → { status, message, data: T[], meta }
 *
 * Los tipos específicos (VesselResponse, VesselPaginatedResponse, etc.)
 * son aliases de estos genéricos — no se duplica la estructura.
 */

export interface ApiMeta {
    current_page: number;
    per_page: number;
    total: number;
    last_page: number;
    from: number | null;
    to: number | null;
}

/** Respuesta estándar para un recurso único. */
export interface ApiResponse<T> {
    status: number;
    message: string;
    data: T;
}

/** Respuesta estándar para colecciones paginadas. */
export interface ApiPaginatedResponse<T> {
    status: number;
    message: string;
    data: T[];
    meta: ApiMeta;
}
