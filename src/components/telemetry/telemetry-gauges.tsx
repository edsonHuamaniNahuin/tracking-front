import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import type { VesselTelemetry } from "@/types/models/vesselTelemetry"
import { Gauge, Zap, Fuel, Navigation, Wind, BatteryCharging } from "lucide-react"
import { formatDateTimeFull } from "@/utils/date"

interface TelemetryGaugesProps {
    telemetry: VesselTelemetry
}

function GaugeCard({
    icon: Icon,
    label,
    value,
    unit,
    progress,
    progressColor,
    badge,
    badgeVariant = "secondary",
}: {
    icon: React.ElementType
    label: string
    value: string
    unit?: string
    progress?: number
    progressColor?: string
    badge?: string
    badgeVariant?: "default" | "secondary" | "destructive" | "outline"
}) {
    return (
        <Card>
            <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                    <Icon className="h-4 w-4" />
                    {label}
                </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
                <div className="flex items-end gap-1">
                    <span className="text-2xl font-bold">{value}</span>
                    {unit && <span className="text-sm text-muted-foreground mb-0.5">{unit}</span>}
                    {badge && (
                        <Badge variant={badgeVariant} className="ml-auto text-xs">
                            {badge}
                        </Badge>
                    )}
                </div>
                {progress !== undefined && (
                    <div className="space-y-1">
                        <Progress
                            value={progress}
                            className="h-2"
                            style={progressColor ? { '--progress-bg': progressColor } as React.CSSProperties : undefined}
                        />
                    </div>
                )}
            </CardContent>
        </Card>
    )
}

function fuelStatus(level: number): { label: string; variant: "default" | "secondary" | "destructive" | "outline" } {
    if (level <= 10) return { label: "Crítico", variant: "destructive" }
    if (level <= 25) return { label: "Bajo", variant: "destructive" }
    if (level <= 50) return { label: "Medio", variant: "secondary" }
    return { label: "OK", variant: "default" }
}

function speedStatus(knots: number): string {
    if (knots === 0) return "Detenido"
    if (knots < 3) return "Lento"
    if (knots < 10) return "Navegando"
    return "Rápido"
}

function compassDirection(degrees: number): string {
    const dirs = ["N", "NNE", "NE", "ENE", "E", "ESE", "SE", "SSE",
        "S", "SSO", "SO", "OSO", "O", "ONO", "NO", "NNO"]
    return dirs[Math.round(degrees / 22.5) % 16]
}

/**
 * Panel de instrumentos con indicadores de:
 * - Velocidad (SOG)
 * - Rumbo (COG)
 * - Nivel de combustible
 * - RPM del motor
 * - Voltaje de batería
 */
export function TelemetryGauges({ telemetry }: TelemetryGaugesProps) {
    const fuel = fuelStatus(telemetry.fuel_level ?? 0)

    return (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
            {/* Velocidad */}
            <GaugeCard
                icon={Wind}
                label="Velocidad (SOG)"
                value={telemetry.speed.toFixed(1)}
                unit="kn"
                progress={(telemetry.speed / 25) * 100}
                badge={speedStatus(telemetry.speed)}
                badgeVariant={telemetry.speed === 0 ? "outline" : "secondary"}
            />

            {/* Rumbo */}
            <GaugeCard
                icon={Navigation}
                label="Rumbo (COG)"
                value={telemetry.course != null ? telemetry.course.toFixed(0) : "—"}
                unit={telemetry.course != null ? "°" : undefined}
                badge={telemetry.course != null ? compassDirection(telemetry.course) : undefined}
                badgeVariant="outline"
            />

            {/* Combustible */}
            <GaugeCard
                icon={Fuel}
                label="Combustible"
                value={telemetry.fuel_level != null ? telemetry.fuel_level.toFixed(1) : "—"}
                unit={telemetry.fuel_level != null ? "%" : undefined}
                progress={telemetry.fuel_level ?? 0}
                badge={telemetry.fuel_level != null ? fuel.label : undefined}
                badgeVariant={fuel.variant}
            />

            {/* RPM */}
            <GaugeCard
                icon={Gauge}
                label="RPM Motor"
                value={telemetry.rpm != null ? telemetry.rpm.toString() : "—"}
                unit={telemetry.rpm != null ? "rpm" : undefined}
                progress={telemetry.rpm != null ? (telemetry.rpm / 3000) * 100 : undefined}
                badge={telemetry.rpm === 0 ? "Apagado" : telemetry.rpm != null ? "Encendido" : undefined}
                badgeVariant={telemetry.rpm === 0 ? "outline" : "default"}
            />

            {/* Voltaje */}
            <GaugeCard
                icon={BatteryCharging}
                label="Voltaje"
                value={telemetry.voltage != null ? telemetry.voltage.toFixed(1) : "—"}
                unit={telemetry.voltage != null ? "V" : undefined}
                progress={telemetry.voltage != null ? ((telemetry.voltage - 10) / 6) * 100 : undefined}
                badge={
                    telemetry.voltage != null
                        ? telemetry.voltage < 11.5
                            ? "Bajo"
                            : telemetry.voltage > 14.5
                                ? "Alt"
                                : "Normal"
                        : undefined
                }
                badgeVariant={
                    telemetry.voltage != null && telemetry.voltage < 11.5
                        ? "destructive"
                        : "secondary"
                }
            />

            {/* Último ping — ocupa el ancho completo en pantallas pequeñas */}
            <Card className="col-span-2 sm:col-span-3 lg:col-span-5">
                <CardContent className="py-3 flex flex-wrap items-center gap-3 text-sm text-muted-foreground">
                    <Zap className="h-4 w-4 shrink-0 text-green-500" />
                    <span>
                        Último ping:{" "}
                        <strong className="text-foreground">
                            {formatDateTimeFull(telemetry.recorded_at)}
                        </strong>
                    </span>
                    {telemetry.source && (
                        <Badge variant="outline" className="ml-auto text-xs">
                            Fuente: {telemetry.source === "cache" ? "Redis (caché)" : "Base de datos"}
                        </Badge>
                    )}
                </CardContent>
            </Card>
        </div>
    )
}
