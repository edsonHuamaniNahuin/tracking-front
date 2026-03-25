import type { Tracking } from '../tracking'
import type { ApiPaginatedResponse } from '../api'

export type PaginatedTrackingMeta = import('../api').ApiMeta

export type PaginatedTrackingResponse = ApiPaginatedResponse<Tracking>

