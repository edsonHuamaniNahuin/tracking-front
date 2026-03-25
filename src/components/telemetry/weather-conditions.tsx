import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import type { WeatherForecast, WeatherHour } from "@/types/models/vesselTelemetry"
import { CloudRain, Waves, Wind, Thermometer, Eye, AlertTriangle } from "lucide-react"

interface WeatherConditionsProps {
    weather: WeatherForecast
}

function windDirection(deg: number): string {
    const dirs = ["N", "NNE", "NE", "ENE", "E", "ESE", "SE", "SSE",
        "S", "SSO", "SO", "OSO", "O", "ONO", "NO", "NNO"]
    return dirs[Math.round(deg / 22.5) % 16]
}

function beaufortScale(mps: number): { grade: number; label: string } {
    if (mps < 0.3) return { grade: 0, label: "Calma" }
    if (mps < 1.6) return { grade: 1, label: "Ventolina" }
    if (mps < 3.4) return { grade: 2, label: "Brisa muy débil" }
    if (mps < 5.5) return { grade: 3, label: "Brisa débil" }
    if (mps < 8.0) return { grade: 4, label: "Brisa moderada" }
    if (mps < 10.8) return { grade: 5, label: "Brisa fresca" }
    if (mps < 13.9) return { grade: 6, label: "Brisa fuerte" }
    if (mps < 17.2) return { grade: 7, label: "Viento fuerte" }
    if (mps < 20.8) return { grade: 8, label: "Temporal" }
    if (mps < 24.5) return { grade: 9, label: "Temporal fuerte" }
    if (mps < 28.5) return { grade: 10, label: "Temporal muy fuerte" }
    if (mps < 32.7) return { grade: 11, label: "Borrasca" }
    return { grade: 12, label: "Huracán" }
}

function seaState(waveHeightM: number): { label: string; color: string } {
    if (waveHeightM < 0.1) return { label: "Glasa", color: "text-blue-400" }
    if (waveHeightM < 0.5) return { label: "Rizada", color: "text-blue-500" }
    if (waveHeightM < 1.25) return { label: "Marejadilla", color: "text-cyan-600" }
    if (waveHeightM < 2.5) return { label: "Marejada", color: "text-yellow-600" }
    if (waveHeightM < 4.0) return { label: "Marejada alta", color: "text-orange-600" }
    if (waveHeightM < 6.0) return { label: "Fuerte marej.", color: "text-red-500" }
    return { label: "Mar gruesa", color: "text-red-700" }
}

function WeatherItem({
    icon: Icon,
    label,
    value,
}: {
    icon: React.ElementType
    label: string
    value: React.ReactNode
}) {
    return (
        <div className="flex items-center justify-between py-2 border-b last:border-0">
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Icon className="h-4 w-4 shrink-0" />
                {label}
            </div>
            <div className="text-sm font-medium text-right">{value}</div>
        </div>
    )
}

/**
 * Muestra las condiciones meteorológicas actuales en posición del barco.
 * Usa la primera hora del pronóstico de StormGlass.
 */
export function WeatherConditions({ weather }: WeatherConditionsProps) {
    if (weather.degraded) {
        return (
            <Card>
                <CardHeader className="pb-3">
                    <CardTitle className="text-base flex items-center gap-2">
                        <CloudRain className="h-4 w-4" />
                        Condiciones Meteorológicas
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="flex items-center gap-2 text-sm text-muted-foreground py-4">
                        <AlertTriangle className="h-5 w-5 text-yellow-500" />
                        <span>
                            {weather.reason === "api_key_missing"
                                ? "API de StormGlass no configurada. Añade STORMGLASS_API_KEY al .env del servidor."
                                : "Datos meteorológicos no disponibles en este momento."}
                        </span>
                    </div>
                </CardContent>
            </Card>
        )
    }

    const current: WeatherHour | undefined = weather.hourly?.[0]

    if (!current) {
        return (
            <Card>
                <CardHeader className="pb-3">
                    <CardTitle className="text-base flex items-center gap-2">
                        <CloudRain className="h-4 w-4" />
                        Condiciones Meteorológicas
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    <p className="text-sm text-muted-foreground py-4">Sin datos disponibles.</p>
                </CardContent>
            </Card>
        )
    }

    const wind = current.windSpeed != null ? beaufortScale(current.windSpeed) : null
    const sea = current.waveHeight != null ? seaState(current.waveHeight) : null

    return (
        <Card>
            <CardHeader className="pb-3">
                <CardTitle className="text-base flex items-center justify-between gap-2">
                    <span className="flex items-center gap-2">
                        <CloudRain className="h-4 w-4" />
                        Condiciones Meteorológicas
                    </span>
                    {wind && (
                        <Badge
                            variant={wind.grade >= 6 ? "destructive" : wind.grade >= 4 ? "secondary" : "outline"}
                            className="text-xs"
                        >
                            Beaufort {wind.grade} — {wind.label}
                        </Badge>
                    )}
                </CardTitle>
            </CardHeader>
            <CardContent className="space-y-0">
                {current.waveHeight != null && sea && (
                    <WeatherItem
                        icon={Waves}
                        label="Oleaje"
                        value={
                            <span>
                                <span className={sea.color}>{sea.label}</span>
                                {" "}({current.waveHeight.toFixed(1)} m
                                {current.wavePeriod != null ? `, ${current.wavePeriod.toFixed(0)}s` : ""})
                            </span>
                        }
                    />
                )}

                {current.windSpeed != null && (
                    <WeatherItem
                        icon={Wind}
                        label="Viento"
                        value={`${(current.windSpeed * 1.944).toFixed(1)} kn${current.windDirection != null
                                ? ` — ${windDirection(current.windDirection)}`
                                : ""
                            }`}
                    />
                )}

                {current.visibility != null && (
                    <WeatherItem
                        icon={Eye}
                        label="Visibilidad"
                        value={`${current.visibility.toFixed(1)} km`}
                    />
                )}

                {current.airTemperature != null && (
                    <WeatherItem
                        icon={Thermometer}
                        label="Temperatura aire"
                        value={`${current.airTemperature.toFixed(1)} °C`}
                    />
                )}

                {current.waterTemperature != null && (
                    <WeatherItem
                        icon={Thermometer}
                        label="Temperatura agua"
                        value={`${current.waterTemperature.toFixed(1)} °C`}
                    />
                )}

                {current.precipitation != null && current.precipitation > 0 && (
                    <WeatherItem
                        icon={CloudRain}
                        label="Precipitación"
                        value={`${current.precipitation.toFixed(1)} mm/hr`}
                    />
                )}
            </CardContent>
        </Card>
    )
}
