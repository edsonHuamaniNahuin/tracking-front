import { useState, useEffect, useCallback, useRef, useMemo } from "react"
import { useSearchParams } from "react-router-dom"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Label } from "@/components/ui/label"
import { Calendar } from "@/components/ui/calendar"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { TrackingMap } from "@/components/tracking/tracking-map"
import { TrackingTimeline } from "@/components/tracking/tracking-timeline"
import { TrackingStats } from "@/components/tracking/tracking-stats"
import { useTrackingSocket } from "@/hooks/useTrackingSocket"
import {
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
    Radio,
    WifiOff,
    Wifi,
    CalendarIcon,
    Clock,
} from "lucide-react"
import { format, isSameDay, startOfDay, subDays } from "date-fns"
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
    const [isCheckingDevice, setIsCheckingDevice] = useState(false)
    const [deviceOfflineMsg, setDeviceOfflineMsg] = useState<string | null>(null)

    // Días con registros para la embarcación seleccionada (cacheados en sessionStorage)
    const [availableDays, setAvailableDays] = useState<string[]>([])
    const [isLoadingDays, setIsLoadingDays] = useState(false)

    // Estados de filtros por día
    const [selectedDay, setSelectedDay] = useState<Date>(() => startOfDay(new Date()))
    // Datos del día completo traídos del backend (cacheados en sessionStorage para histórico)
    const [rawDayTrackings, setRawDayTrackings] = useState<Tracking[]>([])
    // Filtro de horas aplicado localmente sobre rawDayTrackings (sin petición al backend)
    const [timeFrom, setTimeFrom] = useState(0)   // hora inicio 0-23
    const [timeTo, setTimeTo] = useState(23)       // hora fin 0-23
    const [dayPickerOpen, setDayPickerOpen] = useState(false)
    const [showTrajectory, setShowTrajectory] = useState(true)
    const [showAllVessels, setShowAllVessels] = useState(false)
    const [vesselPositions, setVesselPositions] = useState<VesselPosition[]>([])

    // Evitar loop: leemos el param de URL solo en el primer montaje
    const initialParamRead = useRef(false)

    // ── ESC para salir de pantalla completa ──────────────────────────────────
    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.key === 'Escape') setIsFullscreen(false)
        }
        window.addEventListener('keydown', handleKeyDown)
        return () => window.removeEventListener('keydown', handleKeyDown)
    }, [])

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
    // ── Cargar posiciones de embarcaciones para el mapa ──────────────────────
    useEffect(() => {
        if (!showAllVessels) return
        dashboardService.getStats()
            .then(data => setVesselPositions(data.vessel_positions ?? []))
            .catch(() => { /* posiciones opcionales — fallo silencioso */ })
    }, [showAllVessels])

    // ── Cargar días con datos al seleccionar embarcación ─────────────────────
    // Primera vez → consulta backend + guarda en sessionStorage.
    // Siguientes veces → el servicio devuelve la caché sin llamada a red.
    useEffect(() => {
        if (!selectedVessel) { setAvailableDays([]); return }
        setIsLoadingDays(true)
        trackingService.getVesselTrackingDays(selectedVessel)
            .then(days => setAvailableDays(days))
        .catch(() => setAvailableDays([]))
        .finally(() => setIsLoadingDays(false))
    }, [selectedVessel])

    // ── Sincronizar URL al cambiar embarcación (sin que afecte loadTrackings) ─
    const setSearchParamsRef = useRef(setSearchParams)
    setSearchParamsRef.current = setSearchParams
    useEffect(() => {
        if (selectedVessel) {
            setSearchParamsRef.current({ vessel: selectedVessel.toString() }, { replace: true })
        }
    }, [selectedVessel])
    // â”€â”€ Cargar trackings cuando cambie embarcaciÃ³n o fechas â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
    const loadTrackings = useCallback(async () => {
        if (!selectedVessel) return

        setIsLoading(true)
        setError(null)
        setSelectedTracking(null)
        setRawDayTrackings([])   // limpiar datos del día anterior de inmediato

        try {
            const dayStr = format(selectedDay, 'yyyy-MM-dd')
            const isToday = isSameDay(selectedDay, new Date())
            // Histórico → solo fecha (el servicio normaliza a startOfDay/endOfDay y cachea)
            // Hoy → incluir hora para evitar normalización y obtener datos en tiempo real
            const from = isToday ? `${dayStr} 00:00:00` : dayStr
            const to   = isToday ? `${dayStr} 23:59:59` : dayStr
            const data    = await trackingService.getTrackings(selectedVessel, from, to)
            setRawDayTrackings(Array.isArray(data) ? data : [])
        } catch {
            setError('Error al cargar los datos de tracking')
            setRawDayTrackings([])
        } finally {
            setIsLoading(false)
        }
    }, [selectedVessel, selectedDay])   // ← sin setSearchParams

    useEffect(() => {
        loadTrackings()
    }, [loadTrackings])

    // Aplicar filtro de horas localmente sobre los datos del día completo (sin re-fetch)
    useEffect(() => {
        if (rawDayTrackings.length === 0) {
            setTrackings([])
            return
        }
        // Pre-computar límites como timestamps (números) fuera del filter
        // Date.parse() es más rápido que new Date() dentro del loop
        const fromMs = new Date(selectedDay).setHours(timeFrom, 0, 0, 0)
        const toMs = new Date(selectedDay).setHours(timeTo, 59, 59, 999)
        setTrackings(rawDayTrackings.filter(t => {
            const ms = Date.parse(t.tracked_at)
            return ms >= fromMs && ms <= toMs
        }))
    }, [rawDayTrackings, selectedDay, timeFrom, timeTo])

    const selectedVesselData = vessels.find(v => v.id === selectedVessel)

    // ── Estado Live ──────────────────────────────────────────────────────────
    const [isLive, setIsLive] = useState(false)

    // ── WebSocket: suscripción al canal privado de la embarcación ─────────────
    // Cuando el backend guarda un nuevo Tracking lo emite vía Reverb y el
    // hook lo recibe sin necesidad de polling HTTP.
    const handleNewTracking = useCallback((data: Partial<import('@/types/tracking').Tracking>) => {
        // Solo agregamos si es para el día de hoy (Live siempre es hoy)
        if (!isSameDay(selectedDay, new Date())) return
        setRawDayTrackings(prev => {
            // Evitar duplicados (Reverb puede entregar el mismo evento dos veces)
            if (prev.some(t => t.id === data.id)) return prev
            // El payload del evento sólo tiene campos básicos (sin vessel anidado).
            // Completamos con el objeto vessel que ya tenemos en memoria.
            const vessel = vessels.find(v => v.id === (data.vessel_id ?? selectedVessel))
            const full = {
                ...data,
                // Normalizar latitude/longitude a string para que coincida con el tipo
                latitude:  String(data.latitude  ?? ''),
                longitude: String(data.longitude ?? ''),
                // Si no tenemos el vessel anidado usamos el del primer elemento existente
                vessel: (vessel as unknown as import('@/types/tracking').TrackingVessel) ?? prev[0]?.vessel,
                updated_at:  data.created_at ?? '',
                deleted_at:  null,
            } as import('@/types/tracking').Tracking
            // Insertar ordenado por tracked_at descendente (el más reciente primero)
            return [full, ...prev].sort(
                (a, b) => Date.parse(b.tracked_at) - Date.parse(a.tracked_at)
            )
        })
    }, [selectedDay, selectedVessel, vessels])

    const { isConnected: wsConnected } = useTrackingSocket({
        vesselId: selectedVessel,
        enabled:  isLive,
        onNewTracking: handleNewTracking,
    })

    // ── Activar Live con validación de dispositivo online ────────────────────
    const handleLiveToggle = useCallback(async () => {
        if (isLive) { setIsLive(false); return }
        if (!selectedVessel) return
        setDeviceOfflineMsg(null)
        setIsCheckingDevice(true)
        try {
            const status = await vesselService.getDeviceStatus(selectedVessel)
            if (status.is_online) {
                setSelectedDay(startOfDay(new Date()))
                setTimeFrom(0)
                setTimeTo(23)
                setIsLive(true)
            } else {
                const lastSeen = status.last_seen_at
                    ? `Última señal: ${new Date(status.last_seen_at).toLocaleString('es-PE')}`
                    : 'Sin señal reciente'
                setDeviceOfflineMsg(`Dispositivo desconectado. ${lastSeen}.`)
            }
        } catch {
            setDeviceOfflineMsg('No se pudo verificar el estado del dispositivo.')
        } finally {
            setIsCheckingDevice(false)
        }
    }, [isLive, selectedVessel])

    // ── Días con datos → convertidos a Date[] para react-day-picker modifiers ──
    // useMemo evita recrear el array en cada render
    const daysWithData = useMemo(
        () => availableDays.map(d => new Date(`${d}T00:00:00`)),
        [availableDays]
    )

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
                        isLive={isLive}
                    />

                    {/* Indicador LIVE flotante */}
                    {isLive && (
                        <div className={`absolute top-3 left-1/2 -translate-x-1/2 z-[1001] flex items-center gap-1.5 text-white text-xs font-semibold px-3 py-1 rounded-full shadow ${wsConnected ? 'bg-emerald-600' : 'bg-amber-500'}`}>
                            <span className="relative flex h-2 w-2">
                                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-white opacity-75" />
                                <span className="relative inline-flex rounded-full h-2 w-2 bg-white" />
                            </span>
                            {wsConnected ? 'LIVE · conectado' : 'LIVE · conectando…'}
                        </div>
                    )}

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
                    <div className="relative z-[1] w-80 border-l bg-background overflow-y-auto p-3">
                        {/* Filtros compactos */}
                        <div className="space-y-2 mb-3">
                            <Select
                                value={selectedVessel?.toString() ?? ""}
                                onValueChange={v => setSelectedVessel(parseInt(v, 10))}
                            >
                                <SelectTrigger className="h-8 text-xs">
                                    <SelectValue placeholder="Unidad" />
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

                            <div className="flex items-center gap-1.5 text-xs text-muted-foreground px-0.5">
                                <CalendarIcon className="h-3 w-3" />
                                <span>{format(selectedDay, 'dd/MM/yyyy')}</span>
                                <Clock className="h-3 w-3 ml-1" />
                                <span>{String(timeFrom).padStart(2, '0')}:00 – {String(timeTo).padStart(2, '0')}:59</span>
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
        <div className="container mx-auto py-4 space-y-4 px-4 sm:px-6">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div>
                    <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2">
                        <Route className="h-5 w-5" />
                        Mapa de Tracking
                    </h1>
                    <p className="text-sm text-muted-foreground mt-0.5">
                        Rutas y trayectorias de unidades
                    </p>
                </div>
                <div className="flex flex-wrap items-center gap-2">
                    {isLive && (
                        <div className={`flex items-center gap-1.5 text-xs font-medium ${wsConnected ? 'text-emerald-600' : 'text-amber-600'}`}>
                            <span className="relative flex h-2 w-2">
                                <span className="animate-ping absolute inline-flex h-full w-full rounded-full opacity-75" style={{ backgroundColor: wsConnected ? '#34d399' : '#f59e0b' }} />
                                <span className="relative inline-flex rounded-full h-2 w-2" style={{ backgroundColor: wsConnected ? '#10b981' : '#f59e0b' }} />
                            </span>
                            {wsConnected
                                ? <><Wifi className="h-3 w-3" /> LIVE · conectado</>
                                : <>LIVE · conectando&hellip;</>
                            }
                        </div>
                    )}
                    <Button
                        variant={isLive ? "destructive" : "outline"}
                        size="sm"
                        onClick={handleLiveToggle}
                        disabled={!selectedVessel || isCheckingDevice}
                        title={isLive ? 'Detener modo live' : 'Activar modo live (WebSocket en tiempo real)'}
                    >
                        {isCheckingDevice
                            ? <><RefreshCw className="h-4 w-4 mr-1.5 animate-spin" />Verificando...</>
                            : isLive
                                ? <><WifiOff className="h-4 w-4 mr-1.5" />Detener Live</>
                                : <><Radio className="h-4 w-4 mr-1.5" />Live</>
                        }
                    </Button>
                    <Button variant="outline" size="sm" onClick={loadTrackings} disabled={!selectedVessel || isLoading || isLive}>
                        <RefreshCw className={`h-4 w-4 mr-1.5 ${isLoading ? 'animate-spin' : ''}`} />
                        Actualizar
                    </Button>
                </div>
            </div>

            {/* Aviso de dispositivo offline */}
            {deviceOfflineMsg && (
                <div className="flex items-center gap-2 rounded-md border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-800">
                    <AlertCircle className="h-4 w-4 shrink-0" />
                    <span>{deviceOfflineMsg}</span>
                    <button
                        className="ml-auto text-amber-600 hover:text-amber-800 text-xs underline"
                        onClick={() => setDeviceOfflineMsg(null)}
                    >
                        Cerrar
                    </button>
                </div>
            )}

            {/* Filtros — una sola fila */}
            <Card>
                <CardContent className="py-3 px-4">
                    <div className="flex flex-wrap items-end gap-3">
                        <div className="space-y-1 min-w-[180px] flex-1">
                            <Label className="text-xs">Unidad</Label>
                            <Select
                                value={selectedVessel?.toString() ?? ""}
                                onValueChange={v => setSelectedVessel(parseInt(v, 10))}
                            >
                                <SelectTrigger className="h-8">
                                    <SelectValue placeholder="Seleccionar unidad" />
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

                        {/* Selector de día */}
                        <div className="space-y-1">
                            <Label className="text-xs flex items-center gap-1">
                                Día
                                {isLoadingDays && <span className="text-[10px] text-muted-foreground ml-1">cargando…</span>}
                                {!isLoadingDays && availableDays.length > 0 && (
                                    <span className="text-[10px] text-blue-600 ml-1">● días con datos</span>
                                )}
                            </Label>
                            <Popover open={dayPickerOpen} onOpenChange={setDayPickerOpen}>
                                <PopoverTrigger asChild>
                                    <Button
                                        variant="outline"
                                        size="sm"
                                        disabled={isLive}
                                        className="h-8 text-xs font-normal gap-1.5 min-w-[120px] justify-start"
                                    >
                                        <CalendarIcon className="h-3 w-3 shrink-0" />
                                        {format(selectedDay, "dd/MM/yyyy")}
                                    </Button>
                                </PopoverTrigger>
                                <PopoverContent className="w-auto p-0" align="start">
                                    <Calendar
                                        mode="single"
                                        selected={selectedDay}
                                        onSelect={(d) => {
                                            if (!d) return
                                            setSelectedDay(startOfDay(d))
                                            setTimeFrom(0)
                                            setTimeTo(23)
                                            setDayPickerOpen(false)
                                        }}
                                        disabled={(d) => {
                                            if (d > new Date()) return true
                                            // Si ya tenemos los días cargados, deshabilitar días sin datos
                                            if (!isLoadingDays && availableDays.length > 0) {
                                                return !availableDays.includes(format(d, 'yyyy-MM-dd'))
                                            }
                                            return false
                                        }}
                                        modifiers={{ hasData: daysWithData }}
                                        modifiersClassNames={{ hasData: 'day-has-data' }}
                                        locale={es}
                                        initialFocus
                                    />
                                    <div className="p-2 border-t flex gap-1">
                                        <Button size="sm" variant="ghost" className="text-xs h-6" onClick={() => { setSelectedDay(startOfDay(new Date())); setTimeFrom(0); setTimeTo(23); setDayPickerOpen(false) }}>Hoy</Button>
                                        <Button size="sm" variant="ghost" className="text-xs h-6" onClick={() => { setSelectedDay(startOfDay(subDays(new Date(), 1))); setTimeFrom(0); setTimeTo(23); setDayPickerOpen(false) }}>Ayer</Button>
                                        <Button size="sm" variant="ghost" className="text-xs h-6" onClick={() => { setSelectedDay(startOfDay(subDays(new Date(), 7))); setTimeFrom(0); setTimeTo(23); setDayPickerOpen(false) }}>-7 días</Button>
                                    </div>
                                </PopoverContent>
                            </Popover>
                        </div>

                        {/* Filtro de horas — aplicado localmente sin nueva petición al backend */}
                        <div className="flex items-end gap-1.5">
                            <div className="space-y-1">
                                <Label className="text-xs flex items-center gap-1">
                                    <Clock className="h-3 w-3" /> Hora desde
                                </Label>
                                <Select
                                    value={timeFrom.toString()}
                                    onValueChange={v => setTimeFrom(parseInt(v))}
                                    disabled={isLive}
                                >
                                    <SelectTrigger className="h-8 w-[88px] text-xs">
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {Array.from({ length: 24 }, (_, i) => (
                                            <SelectItem key={i} value={i.toString()} className="text-xs">
                                                {String(i).padStart(2, '0')}:00
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>
                            <div className="space-y-1">
                                <Label className="text-xs">Hora hasta</Label>
                                <Select
                                    value={timeTo.toString()}
                                    onValueChange={v => setTimeTo(parseInt(v))}
                                    disabled={isLive}
                                >
                                    <SelectTrigger className="h-8 w-[88px] text-xs">
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {Array.from({ length: 24 }, (_, i) => (
                                            <SelectItem key={i} value={i.toString()} disabled={i < timeFrom} className="text-xs">
                                                {String(i).padStart(2, '0')}:59
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>
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
                <div className="flex flex-wrap items-center gap-2 bg-blue-50/60 border border-blue-200 rounded-lg px-3 py-1.5 text-xs">
                    <Ship className="h-4 w-4 text-blue-600 shrink-0" />
                    <span className="font-semibold text-blue-900 truncate max-w-[200px]">{selectedVesselData.name}</span>
                    {selectedVesselData.imo && <span className="text-blue-700 shrink-0">IMO: {selectedVesselData.imo}</span>}
                    {selectedVesselData.vessel_type?.name && (
                        <Badge variant="outline" className="text-[10px] py-0 text-blue-700 border-blue-300 shrink-0">{selectedVesselData.vessel_type.name}</Badge>
                    )}
                    {selectedVesselData.vessel_status?.name && (
                        <Badge className="text-[10px] py-0 bg-blue-600 shrink-0">{selectedVesselData.vessel_status.name}</Badge>
                    )}
                    <span className="ml-auto text-blue-700 shrink-0">{trackings.length} punto{trackings.length !== 1 ? 's' : ''}</span>
                </div>
            )}

            {/* Mapa + Panel lateral */}
            <div className="grid grid-cols-1 xl:grid-cols-3 gap-4">
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
                                isLive={isLive}
                            />
                        </CardContent>
                    </Card>
                </div>

                <div>{sidePanel}</div>
            </div>
        </div>
    )
}
