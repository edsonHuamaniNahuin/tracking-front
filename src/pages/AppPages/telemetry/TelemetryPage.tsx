import { useState, useEffect, useCallback } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Separator } from "@/components/ui/separator"
import { Switch } from "@/components/ui/switch"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { TelemetryLiveMap } from "@/components/telemetry/telemetry-live-map"
import { TelemetryGauges } from "@/components/telemetry/telemetry-gauges"
import { WeatherConditions } from "@/components/telemetry/weather-conditions"
import { vesselService } from "@/services/vessel.service"
import { telemetryService } from "@/services/telemetry.service"
import { useTelemetry } from "@/hooks/useTelemetry"
import type { Vessel } from "@/types/models/vessel"
import type { OptimalRoute, RouteWaypoint } from "@/types/models/vesselTelemetry"
import {
    Activity,
    AlertCircle,
    RefreshCw,
    Ship,
    Navigation,
    Route,
    MapPin,
    Loader2,
} from "lucide-react"
import { formatTimeMedium } from "@/utils/date"

export default function TelemetryPage() {
    // ── Embarcaciones ──────────────────────────────────────────────────────────
    const [vessels, setVessels] = useState<Vessel[]>([])
    const [selectedVessel, setSelectedVessel] = useState<number | null>(null)
    const [autoRefresh, setAutoRefresh] = useState(true)

    // ── Telemetría en vivo ─────────────────────────────────────────────────────
    const { position, weather, loading, error, lastUpdated, refresh } =
        useTelemetry(selectedVessel, autoRefresh)

    // ── Ruta óptima ───────────────────────────────────────────────────────────
    const [destLat, setDestLat] = useState("")
    const [destLng, setDestLng] = useState("")
    const [speedKnots, setSpeedKnots] = useState("10")
    const [route, setRoute] = useState<RouteWaypoint[] | undefined>()
    const [routeData, setRouteData] = useState<OptimalRoute | null>(null)
    const [routeLoading, setRouteLoading] = useState(false)
    const [routeError, setRouteError] = useState<string | null>(null)

    // ── Cargar embarcaciones ───────────────────────────────────────────────────
    useEffect(() => {
        vesselService
            .getVessels({ page: 1, per_page: 100 })
            .then(res => setVessels(res.data))
            .catch(() => {/* silencioso */ })
    }, [])

    // ── Limpiar ruta cuando cambia la embarcación ──────────────────────────────
    useEffect(() => {
        setRoute(undefined)
        setRouteData(null)
        setRouteError(null)
    }, [selectedVessel])

    const selectedVesselData = vessels.find(v => v.id === selectedVessel)

    // ── Calcular ruta óptima ───────────────────────────────────────────────────
    const calculateRoute = useCallback(async () => {
        if (!selectedVessel || !destLat || !destLng) return

        const lat = parseFloat(destLat)
        const lng = parseFloat(destLng)
        const spd = parseFloat(speedKnots)

        if (isNaN(lat) || isNaN(lng) || lat < -90 || lat > 90 || lng < -180 || lng > 180) {
            setRouteError("Coordenadas de destino inválidas")
            return
        }

        setRouteLoading(true)
        setRouteError(null)

        try {
            const res = await telemetryService.getOptimalRoute(
                selectedVessel,
                lat,
                lng,
                isNaN(spd) ? 10 : spd
            )
            setRouteData(res.data)
            setRoute(res.data.waypoints)
        } catch {
            setRouteError("No se pudo calcular la ruta. Verifica que el barco tenga posición conocida.")
        } finally {
            setRouteLoading(false)
        }
    }, [selectedVessel, destLat, destLng, speedKnots])

    return (
        <div className="container mx-auto py-6 space-y-6 px-6">

            {/* ── Header ─────────────────────────────────────────────────────────── */}
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight flex items-center gap-2">
                        <Activity className="h-6 w-6" />
                        Telemetría en Vivo
                    </h1>
                    <p className="text-muted-foreground mt-1">
                        Posición, instrumentos y condiciones meteorológicas en tiempo real
                    </p>
                </div>

                <div className="flex items-center gap-3">
                    {/* Auto-refresh toggle */}
                    <div className="flex items-center gap-2">
                        <Switch
                            id="auto-refresh"
                            checked={autoRefresh}
                            onCheckedChange={setAutoRefresh}
                        />
                        <Label htmlFor="auto-refresh" className="text-sm">
                            Auto-actualizar (30s)
                        </Label>
                    </div>

                    <Button
                        variant="outline"
                        size="sm"
                        onClick={refresh}
                        disabled={!selectedVessel || loading}
                    >
                        <RefreshCw className={`h-4 w-4 mr-2 ${loading ? "animate-spin" : ""}`} />
                        Actualizar
                    </Button>
                </div>
            </div>

            {/* ── Selector de embarcación ─────────────────────────────────────────── */}
            <Card>
                <CardHeader className="pb-4">
                    <CardTitle className="text-base">Seleccionar Unidad</CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-end">
                        <div className="flex-1 space-y-1.5">
                            <Label>Unidad</Label>
                            <Select
                                value={selectedVessel?.toString() ?? ""}
                                onValueChange={v => setSelectedVessel(parseInt(v, 10))}
                            >
                                <SelectTrigger className="w-full sm:max-w-xs">
                                    <SelectValue placeholder="Seleccionar unidad..." />
                                </SelectTrigger>
                                <SelectContent>
                                    {vessels.map(vessel => (
                                        <SelectItem key={vessel.id} value={vessel.id.toString()}>
                                            <div className="flex items-center gap-2">
                                                <Ship className="h-3.5 w-3.5 text-muted-foreground" />
                                                <span>{vessel.name}</span>
                                                {vessel.vessel_type?.name && (
                                                    <Badge variant="outline" className="text-xs py-0">
                                                        {vessel.vessel_type.name}
                                                    </Badge>
                                                )}
                                            </div>
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>

                        {lastUpdated && (
                            <p className="text-xs text-muted-foreground pb-2">
                                Actualizado:{" "}
                                {formatTimeMedium(lastUpdated)}
                            </p>
                        )}
                    </div>
                </CardContent>
            </Card>

            {/* ── Sin embarcación seleccionada ────────────────────────────────────── */}
            {!selectedVessel && (
                <div className="flex flex-col items-center justify-center py-20 text-center text-muted-foreground">
                    <Ship className="h-14 w-14 mb-4 opacity-30" />
                    <p className="text-lg font-medium">Selecciona una unidad</p>
                    <p className="text-sm mt-1">
                        Elige una unidad para ver su telemetría en tiempo real.
                    </p>
                </div>
            )}

            {/* ── Cargando ────────────────────────────────────────────────────────── */}
            {selectedVessel && loading && !position && (
                <div className="flex items-center justify-center py-20 gap-3 text-muted-foreground">
                    <Loader2 className="h-6 w-6 animate-spin" />
                    <span>Obteniendo datos de telemetría...</span>
                </div>
            )}

            {/* ── Error / sin datos ────────────────────────────────────────────────── */}
            {selectedVessel && error && !position && (
                <Alert variant="destructive">
                    <AlertCircle className="h-4 w-4" />
                    <AlertDescription>{error}</AlertDescription>
                </Alert>
            )}

            {/* ── Contenido principal ────────────────────────────────────────────── */}
            {selectedVessel && position && (
                <div className="space-y-6">

                    {/* Panel de instrumentos */}
                    <div>
                        <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-3 flex items-center gap-2">
                            <Navigation className="h-4 w-4" />
                            Panel de Instrumentos — {selectedVesselData?.name}
                        </h2>
                        <TelemetryGauges telemetry={position} />
                    </div>

                    <Separator />

                    {/* Mapa + Clima */}
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

                        {/* Mapa en vivo */}
                        <Card className="lg:col-span-2">
                            <CardHeader className="pb-3">
                                <CardTitle className="text-base flex items-center gap-2">
                                    <MapPin className="h-4 w-4" />
                                    Posición en Vivo
                                    {loading && (
                                        <Loader2 className="h-3.5 w-3.5 animate-spin text-muted-foreground ml-1" />
                                    )}
                                </CardTitle>
                                <CardDescription>
                                    {position.lat.toFixed(6)}, {position.lng.toFixed(6)}
                                    {route && routeData && (
                                        <span className="ml-3 text-amber-600 font-medium">
                                            Ruta activa — {routeData.distance_nm?.toFixed(1)} mn
                                        </span>
                                    )}
                                </CardDescription>
                            </CardHeader>
                            <CardContent className="p-0 rounded-b-lg overflow-hidden">
                                <TelemetryLiveMap
                                    position={position}
                                    vesselName={selectedVesselData?.name ?? "Unidad"}
                                    route={route}
                                    height={400}
                                />
                            </CardContent>
                        </Card>

                        {/* Clima */}
                        <div className="space-y-4">
                            {weather ? (
                                <WeatherConditions weather={weather} />
                            ) : (
                                <Card>
                                    <CardHeader className="pb-3">
                                        <CardTitle className="text-base">Condiciones Meteorológicas</CardTitle>
                                    </CardHeader>
                                    <CardContent>
                                        <p className="text-sm text-muted-foreground">
                                            {loading ? "Cargando datos meteorológicos..." : "No disponible"}
                                        </p>
                                    </CardContent>
                                </Card>
                            )}
                        </div>
                    </div>

                    <Separator />

                    {/* Calculador de ruta óptima */}
                    <Card>
                        <CardHeader className="pb-4">
                            <CardTitle className="text-base flex items-center gap-2">
                                <Route className="h-4 w-4" />
                                Ruta Marítima Óptima
                            </CardTitle>
                            <CardDescription>
                                Calcula la ruta desde la posición actual hasta un destino (vía Searoutes API).
                            </CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                                <div className="space-y-1.5">
                                    <Label htmlFor="dest-lat">Latitud destino</Label>
                                    <Input
                                        id="dest-lat"
                                        type="number"
                                        step="0.0001"
                                        min="-90"
                                        max="90"
                                        placeholder="-12.0921"
                                        value={destLat}
                                        onChange={e => setDestLat(e.target.value)}
                                    />
                                </div>

                                <div className="space-y-1.5">
                                    <Label htmlFor="dest-lng">Longitud destino</Label>
                                    <Input
                                        id="dest-lng"
                                        type="number"
                                        step="0.0001"
                                        min="-180"
                                        max="180"
                                        placeholder="-77.0282"
                                        value={destLng}
                                        onChange={e => setDestLng(e.target.value)}
                                    />
                                </div>

                                <div className="space-y-1.5">
                                    <Label htmlFor="speed-knots">Velocidad (nudos)</Label>
                                    <Input
                                        id="speed-knots"
                                        type="number"
                                        step="0.5"
                                        min="1"
                                        max="50"
                                        placeholder="10"
                                        value={speedKnots}
                                        onChange={e => setSpeedKnots(e.target.value)}
                                    />
                                </div>
                            </div>

                            {routeError && (
                                <Alert variant="destructive">
                                    <AlertCircle className="h-4 w-4" />
                                    <AlertDescription>{routeError}</AlertDescription>
                                </Alert>
                            )}

                            <div className="flex items-center gap-4">
                                <Button
                                    onClick={calculateRoute}
                                    disabled={routeLoading || !destLat || !destLng}
                                >
                                    {routeLoading ? (
                                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                                    ) : (
                                        <Route className="h-4 w-4 mr-2" />
                                    )}
                                    Calcular Ruta
                                </Button>

                                {route && (
                                    <Button
                                        variant="ghost"
                                        size="sm"
                                        onClick={() => { setRoute(undefined); setRouteData(null) }}
                                    >
                                        Limpiar ruta
                                    </Button>
                                )}
                            </div>

                            {/* Resumen de ruta */}
                            {routeData && (
                                <div className="mt-3 grid grid-cols-2 sm:grid-cols-4 gap-3">
                                    <div className="rounded-lg bg-muted p-3 space-y-1">
                                        <p className="text-xs text-muted-foreground">Distancia</p>
                                        <p className="text-lg font-bold">
                                            {routeData.distance_nm?.toFixed(1) ?? "—"}
                                            <span className="text-xs font-normal text-muted-foreground ml-1">mn</span>
                                        </p>
                                    </div>

                                    {routeData.duration_hours != null && (
                                        <div className="rounded-lg bg-muted p-3 space-y-1">
                                            <p className="text-xs text-muted-foreground">Duración estimada</p>
                                            <p className="text-lg font-bold">
                                                {routeData.duration_hours.toFixed(1)}
                                                <span className="text-xs font-normal text-muted-foreground ml-1">h</span>
                                            </p>
                                        </div>
                                    )}

                                    {routeData.co2_kg != null && (
                                        <div className="rounded-lg bg-muted p-3 space-y-1">
                                            <p className="text-xs text-muted-foreground">CO₂ estimado</p>
                                            <p className="text-lg font-bold">
                                                {(routeData.co2_kg / 1000).toFixed(2)}
                                                <span className="text-xs font-normal text-muted-foreground ml-1">t</span>
                                            </p>
                                        </div>
                                    )}

                                    <div className="rounded-lg bg-muted p-3 space-y-1">
                                        <p className="text-xs text-muted-foreground">Fuente</p>
                                        <p className="text-sm font-medium truncate">
                                            {routeData.source === "searoutes"
                                                ? "Searoutes API"
                                                : "Ortodrómica (fallback)"}
                                        </p>
                                        {routeData.degraded && (
                                            <Badge variant="outline" className="text-xs py-0">
                                                Degradado
                                            </Badge>
                                        )}
                                    </div>
                                </div>
                            )}
                        </CardContent>
                    </Card>
                </div>
            )}
        </div>
    )
}
