import { useState, useEffect, useCallback, useRef } from "react"
import { useSearchParams } from "react-router-dom"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Calendar } from "@/components/ui/calendar"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Label } from "@/components/ui/label"
import { TrackingMap } from "@/components/tracking/tracking-map"
import { TrackingTimeline } from "@/components/tracking/tracking-timeline"
import { TrackingStats } from "@/components/tracking/tracking-stats"
import {
    CalendarIcon,
    Ship,
    MapPin,
    Route,
    RefreshCw,
    AlertCircle,
    Info,
    Maximize2,
    Minimize2,
    PanelRightOpen,
    PanelRightClose,
} from "lucide-react"
import { format } from "date-fns"
import { es } from "date-fns/locale"
import { trackingService } from "@/services/tracking.service"
import { vesselService } from "@/services/vessel.service"
import { dashboardService } from "@/services/dashboard.service"
import type { Tracking } from "@/types/tracking"
import type { Vessel } from "@/types/models/vessel"
import type { VesselPosition } from "@/types/models/dashboardStats"

export default function TrackingMapPage() {
    const [searchParams, setSearchParams] = useSearchParams()

    // Estados principales
    const [trackings, setTrackings] = useState<Tracking[]>([])
    const [vessels, setVessels] = useState<Vessel[]>([])
    const [selectedVessel, setSelectedVessel] = useState<number | null>(null)
    const [selectedTracking, setSelectedTracking] = useState<Tracking | null>(null)
    const [isLoading, setIsLoading] = useState(false)
    const [error, setError] = useState<string | null>(null)

    // Estados de filtros
    const [dateFrom, setDateFrom] = useState<Date>(new Date(Date.now() - 365 * 24 * 60 * 60 * 1000))
    const [dateTo, setDateTo] = useState<Date>(new Date())
    const [showTrajectory, setShowTrajectory] = useState(true)
    const [showAllVessels, setShowAllVessels] = useState(false)
    const [vesselPositions, setVesselPositions] = useState<VesselPosition[]>([])

    // Evitar loop: leemos el param de URL solo en el primer montaje
    const initialParamRead = useRef(false)

    // Layout
    const [isFullscreen, setIsFullscreen] = useState(false)
    const [showSidePanel, setShowSidePanel] = useState(true)

    // â”€â”€ Cargar lista de embarcaciones (una sola vez) â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
    useEffect(() => {
        vesselService.getVessels({ page: 1, per_page: 100 })
            .then(res => {
                setVessels(res.data)
                // Leer param ?vessel=X solo si no lo hemos procesado aÃºn
                if (!initialParamRead.current) {
                    initialParamRead.current = true
                    const idParam = searchParams.get('vessel')
                    if (idParam) setSelectedVessel(parseInt(idParam, 10))
                }
            })
            .catch(() => setError('Error al cargar las embarcaciones'))
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [])   // â† sin searchParams para evitar loop
    // â"€â"€ Cargar posiciones de embarcaciones para el mapa â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€
    useEffect(() => {
        if (!showAllVessels) return
        dashboardService.getStats()
            .then(data => setVesselPositions(data.vessel_positions ?? []))
            .catch(() => { /* posiciones opcionales — fallo silencioso */ })
    }, [showAllVessels])
    // â”€â”€ Cargar trackings cuando cambie embarcaciÃ³n o fechas â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
    const loadTrackings = useCallback(async () => {
        if (!selectedVessel) return

        setIsLoading(true)
        setError(null)
        setSelectedTracking(null)

        try {
            const from = format(dateFrom, 'yyyy-MM-dd')
            const to = format(dateTo, 'yyyy-MM-dd')
            const data = await trackingService.getTrackings(selectedVessel, from, to)
            setTrackings(Array.isArray(data) ? data : [])
            // Actualizar URL sin disparar re-render del efecto de carga de vessels
            setSearchParams({ vessel: selectedVessel.toString() }, { replace: true })
        } catch {
            setError('Error al cargar los datos de tracking')
            setTrackings([])
        } finally {
            setIsLoading(false)
        }
    }, [selectedVessel, dateFrom, dateTo, setSearchParams])

    useEffect(() => {
        loadTrackings()
    }, [loadTrackings])

    const selectedVesselData = vessels.find(v => v.id === selectedVessel)

    // ── Contenido del panel lateral (reutilizado en normal y fullscreen) ──
    const sidePanel = trackings.length > 0 ? (
        <div className="space-y-3">
            <TrackingStats
                trackings={trackings}
                vessel={selectedVesselData ?? null}
                isLoading={isLoading}
            />
            <TrackingTimeline
                trackings={trackings}
                selectedTracking={selectedTracking}
                onTrackingSelect={setSelectedTracking}
                isLoading={isLoading}
            />
        </div>
    ) : (
        !isLoading && selectedVessel && (
            <Card>
                <CardContent className="py-8 text-center text-muted-foreground">
                    <MapPin className="h-8 w-8 mx-auto mb-2 opacity-30" />
                    <p className="text-sm font-medium">Sin registros de tracking</p>
                </CardContent>
            </Card>
        )
    )

    // ── FULLSCREEN MODE ──────────────────────────────────────────────────────
    if (isFullscreen) {
        return (
            <div className="fixed inset-0 z-50 bg-background flex h-screen w-screen">
                {/* Mapa ocupa todo */}
                <div className="flex-1 relative h-full min-h-0">
                    <TrackingMap
                        trackings={trackings}
                        selectedTracking={selectedTracking}
                        showTrajectory={showTrajectory}
                        showAllVessels={showAllVessels}
                        allVessels={vesselPositions}
                        onTrackingClick={setSelectedTracking}
                        height={undefined}
                        isLoading={isLoading}
                    />

                    {/* Barra superior flotante */}
                    <div className="absolute top-3 right-3 flex items-center gap-2 z-[1001]">
                        <Button
                            variant="secondary"
                            size="icon"
                            className="h-8 w-8 shadow"
                            onClick={() => setShowSidePanel(!showSidePanel)}
                            title={showSidePanel ? 'Ocultar panel' : 'Mostrar panel'}
                        >
                            {showSidePanel ? <PanelRightClose className="h-4 w-4" /> : <PanelRightOpen className="h-4 w-4" />}
                        </Button>
                        <Button
                            variant="secondary"
                            size="icon"
                            className="h-8 w-8 shadow"
                            onClick={() => setIsFullscreen(false)}
                            title="Salir de pantalla completa"
                        >
                            <Minimize2 className="h-4 w-4" />
                        </Button>
                    </div>

                    {/* Info embarcación flotante */}
                    {selectedVesselData && (
                        <div className="absolute top-3 left-14 bg-background/95 backdrop-blur-sm rounded-lg shadow px-3 py-1.5 z-[1001] flex items-center gap-2 text-xs">
                            <Ship className="h-3.5 w-3.5 text-blue-600" />
                            <span className="font-semibold">{selectedVesselData.name}</span>
                            <span className="text-muted-foreground">{trackings.length} pts</span>
                        </div>
                    )}
                </div>

                {/* Panel lateral flotante */}
                {showSidePanel && (
                    <div className="w-80 border-l bg-background overflow-y-auto p-3">
                        {/* Filtros compactos */}
                        <div className="space-y-2 mb-3">
                            <Select
                                value={selectedVessel?.toString() ?? ""}
                                onValueChange={v => setSelectedVessel(parseInt(v, 10))}
                            >
                                <SelectTrigger className="h-8 text-xs">
                                    <SelectValue placeholder="Embarcación" />
                                </SelectTrigger>
                                <SelectContent>
                                    {vessels.map(vessel => (
                                        <SelectItem key={vessel.id} value={vessel.id.toString()}>
                                            <span className="text-xs">{vessel.name}</span>
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>

                            <div className="flex gap-2">
                                <label className="flex items-center gap-1.5 cursor-pointer text-xs">
                                    <input type="checkbox" checked={showTrajectory} onChange={e => setShowTrajectory(e.target.checked)} className="rounded border-gray-300 text-blue-600 h-3 w-3" />
                                    Trayectoria
                                </label>
                                <label className="flex items-center gap-1.5 cursor-pointer text-xs">
                                    <input type="checkbox" checked={showAllVessels} onChange={e => setShowAllVessels(e.target.checked)} className="rounded border-gray-300 text-blue-600 h-3 w-3" />
                                    Otras
                                </label>
                            </div>
                        </div>

                        {sidePanel}
                    </div>
                )}
            </div>
        )
    }

    // ── NORMAL MODE ──────────────────────────────────────────────────────────
    return (
        <div className="container mx-auto py-4 space-y-4 px-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2">
                        <Route className="h-5 w-5" />
                        Mapa de Tracking
                    </h1>
                    <p className="text-sm text-muted-foreground mt-0.5">
                        Rutas y trayectorias de embarcaciones
                    </p>
                </div>
                <Button variant="outline" size="sm" onClick={loadTrackings} disabled={!selectedVessel || isLoading}>
                    <RefreshCw className={`h-4 w-4 mr-1.5 ${isLoading ? 'animate-spin' : ''}`} />
                    Actualizar
                </Button>
            </div>

            {/* Filtros — una sola fila */}
            <Card>
                <CardContent className="py-3 px-4">
                    <div className="flex flex-wrap items-end gap-3">
                        <div className="space-y-1 min-w-[180px] flex-1">
                            <Label className="text-xs">Embarcación</Label>
                            <Select
                                value={selectedVessel?.toString() ?? ""}
                                onValueChange={v => setSelectedVessel(parseInt(v, 10))}
                            >
                                <SelectTrigger className="h-8">
                                    <SelectValue placeholder="Seleccionar embarcación" />
                                </SelectTrigger>
                                <SelectContent>
                                    {vessels.map(vessel => (
                                        <SelectItem key={vessel.id} value={vessel.id.toString()}>
                                            <div className="flex items-center gap-2">
                                                <Ship className="h-3 w-3 text-muted-foreground" />
                                                <span>{vessel.name}</span>
                                            </div>
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>

                        <div className="space-y-1">
                            <Label className="text-xs">Desde</Label>
                            <Popover>
                                <PopoverTrigger asChild>
                                    <Button variant="outline" className="h-8 text-xs font-normal">
                                        <CalendarIcon className="mr-1.5 h-3 w-3 text-muted-foreground" />
                                        {format(dateFrom, "dd MMM yyyy", { locale: es })}
                                    </Button>
                                </PopoverTrigger>
                                <PopoverContent className="w-auto p-0" align="start">
                                    <Calendar mode="single" selected={dateFrom} onSelect={d => d && setDateFrom(d)} disabled={d => d > dateTo} initialFocus locale={es} />
                                </PopoverContent>
                            </Popover>
                        </div>

                        <div className="space-y-1">
                            <Label className="text-xs">Hasta</Label>
                            <Popover>
                                <PopoverTrigger asChild>
                                    <Button variant="outline" className="h-8 text-xs font-normal">
                                        <CalendarIcon className="mr-1.5 h-3 w-3 text-muted-foreground" />
                                        {format(dateTo, "dd MMM yyyy", { locale: es })}
                                    </Button>
                                </PopoverTrigger>
                                <PopoverContent className="w-auto p-0" align="start">
                                    <Calendar mode="single" selected={dateTo} onSelect={d => d && setDateTo(d)} disabled={d => d < dateFrom || d > new Date()} initialFocus locale={es} />
                                </PopoverContent>
                            </Popover>
                        </div>

                        <div className="flex items-center gap-3 pb-0.5">
                            <label className="flex items-center gap-1.5 cursor-pointer text-xs">
                                <input type="checkbox" checked={showTrajectory} onChange={e => setShowTrajectory(e.target.checked)} className="rounded border-gray-300 text-blue-600" />
                                Trayectoria
                            </label>
                            <label className="flex items-center gap-1.5 cursor-pointer text-xs">
                                <input type="checkbox" checked={showAllVessels} onChange={e => setShowAllVessels(e.target.checked)} className="rounded border-gray-300 text-blue-600" />
                                Otras embarcaciones
                            </label>
                        </div>
                    </div>
                </CardContent>
            </Card>

            {/* Error */}
            {error && (
                <div className="flex items-center gap-2 p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-xs">
                    <AlertCircle className="h-4 w-4 shrink-0" />
                    {error}
                </div>
            )}

            {/* Sin embarcación */}
            {!selectedVessel && (
                <div className="flex items-center gap-2 p-3 bg-slate-50 border border-slate-200 rounded-lg text-slate-600 text-xs">
                    <Info className="h-4 w-4 shrink-0" />
                    Selecciona una embarcación para visualizar su ruta en el mapa.
                </div>
            )}

            {/* Embarcación seleccionada — barra compacta */}
            {selectedVesselData && (
                <div className="flex items-center gap-2 bg-blue-50/60 border border-blue-200 rounded-lg px-3 py-1.5 text-xs">
                    <Ship className="h-4 w-4 text-blue-600" />
                    <span className="font-semibold text-blue-900">{selectedVesselData.name}</span>
                    {selectedVesselData.imo && <span className="text-blue-700">IMO: {selectedVesselData.imo}</span>}
                    {selectedVesselData.vessel_type?.name && (
                        <Badge variant="outline" className="text-[10px] py-0 text-blue-700 border-blue-300">{selectedVesselData.vessel_type.name}</Badge>
                    )}
                    {selectedVesselData.vessel_status?.name && (
                        <Badge className="text-[10px] py-0 bg-blue-600">{selectedVesselData.vessel_status.name}</Badge>
                    )}
                    <span className="ml-auto text-blue-700">{trackings.length} punto{trackings.length !== 1 ? 's' : ''}</span>
                </div>
            )}

            {/* Mapa + Panel lateral */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
                <div className="lg:col-span-2">
                    <Card className="relative">
                        <CardContent className="p-0">
                            {/* Botón fullscreen */}
                            <Button
                                variant="secondary"
                                size="icon"
                                className="absolute top-2 right-2 z-[1001] h-7 w-7 shadow"
                                onClick={() => setIsFullscreen(true)}
                                title="Pantalla completa"
                            >
                                <Maximize2 className="h-3.5 w-3.5" />
                            </Button>
                            <TrackingMap
                                trackings={trackings}
                                selectedTracking={selectedTracking}
                                showTrajectory={showTrajectory}
                                showAllVessels={showAllVessels}
                                allVessels={vesselPositions}
                                onTrackingClick={setSelectedTracking}
                                height={560}
                                isLoading={isLoading}
                            />
                        </CardContent>
                    </Card>
                </div>

                <div>{sidePanel}</div>
            </div>
        </div>
    )
}
