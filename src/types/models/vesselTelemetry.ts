export interface VesselTelemetry {
    lat: number
    lng: number
    speed: number        // SOG — nudos
    course: number | null // COG — grados (0–360)
    fuel_level: number | null  // porcentaje (0–100)
    rpm: number | null
    voltage: number | null     // voltios
    recorded_at: string        // ISO 8601
    source?: 'cache' | 'database'
}

export interface WeatherHour {
    time: string
    waveHeight?: number       // metros
    wavePeriod?: number       // segundos
    waveDirection?: number    // grados
    windSpeed?: number        // m/s
    windDirection?: number    // grados
    currentSpeed?: number     // m/s
    currentDirection?: number // grados
    visibility?: number       // km
    precipitation?: number    // mm/hr
    waterTemperature?: number // °C
    airTemperature?: number   // °C
}

export interface WeatherForecast {
    degraded: boolean
    reason?: string
    hourly?: WeatherHour[]
    meta?: Record<string, unknown>
}

export interface RouteWaypoint {
    lat: number
    lng: number
}

export interface OptimalRoute {
    degraded: boolean
    source: 'searoutes' | 'orthodrome_fallback'
    distance_nm: number | null
    duration_hours?: number | null
    waypoints: RouteWaypoint[]
    co2_kg?: number | null
}
