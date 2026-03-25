import { useState, useEffect, useCallback, useRef } from "react"
import { useSearchParams } from "react-router-dom"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Switch } from "@/components/ui/switch"
import { Label } from "@/components/ui/label"
import { vesselService } from "@/services/vessel.service"
import type { Vessel } from "@/types/models/vessel"
import {
    Activity,
    Wifi,
    WifiOff,
    Cpu,
    Satellite,
    MapPin,
    Navigation,
    Clock,
    RefreshCw,
    Terminal,
    Gauge,
    Zap,
} from "lucide-react"
import { formatTimeMedium, formatDate as fmtDate } from "@/utils/date"

interface TelemetryLog {
    type: string
    timestamp: string
    latitude: number
    longitude: number
    speed: number
    course: number | null
    fuel_level: number | null
    rpm: number | null
    voltage: number | null
    raw_data: Record<string, unknown> | null
    utm: string | null
}

export default function DeviceLogsPage() {
    const [searchParams] = useSearchParams()

    const [vessels, setVessels] = useState<Vessel[]>([])
    const [selectedVessel, setSelectedVessel] = useState<number | null>(null)
    const [logs, setLogs] = useState<TelemetryLog[]>([])
    const [isLoading, setIsLoading] = useState(false)
    const [autoRefresh, setAutoRefresh] = useState(false)
    const [deviceInfo, setDeviceInfo] = useState<{
        is_online: boolean
        device_ip: string | null
        firmware: string | null
        uptime: number | null
        last_seen_at: string | null
        total_logs: number
        total_trackings: number
    } | null>(null)

    const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null)

    useEffect(() => {
        vesselService.getVessels({ page: 1, per_page: 100 })
            .then(res => {
                setVessels(res.data)
                const idParam = searchParams.get("vessel")
                if (idParam) setSelectedVessel(parseInt(idParam, 10))
            })
            .catch(() => {})
    }, []) // eslint-disable-line react-hooks/exhaustive-deps

    const fetchLogs = useCallback(async () => {
        if (!selectedVessel) return
        setIsLoading(true)
        try {
            const data = await vesselService.getDeviceLogs(selectedVessel, 100)
            setLogs(data.logs)
            setDeviceInfo({
                is_online: data.is_online,
                device_ip: data.device_ip,
                firmware: data.firmware,
                uptime: data.uptime,
                last_seen_at: data.last_seen_at,
                total_logs: data.total_logs,
                total_trackings: data.total_trackings,
            })
        } catch {
            setLogs([])
            setDeviceInfo(null)
        } finally {
            setIsLoading(false)
        }
    }, [selectedVessel])

    useEffect(() => { fetchLogs() }, [fetchLogs])

    // Auto-refresh
    useEffect(() => {
        if (autoRefresh && selectedVessel) {
            intervalRef.current = setInterval(fetchLogs, 5000)
        }
        return () => {
            if (intervalRef.current) clearInterval(intervalRef.current)
        }
    }, [autoRefresh, selectedVessel, fetchLogs])

    const formatTime = (ts: string) => {
        return formatTimeMedium(ts)
    }

    const formatDate = (ts: string) => {
        return fmtDate(ts, { day: "2-digit", month: "short" }) + " " + formatTime(ts)
    }

    return (
        <div className="container mx-auto py-6 space-y-6 px-6">
            {/* Header */}
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight flex items-center gap-2">
                        <Terminal className="h-6 w-6" />
                        Logs del Dispositivo ESP32
                    </h1>
                    <p className="text-muted-foreground mt-1">
                        Monitor en tiempo real — GPS, telemetría y conexión
                    </p>
                </div>

                <div className="flex items-center gap-4">
                    <div className="flex items-center space-x-2">
                        <Switch id="auto-refresh" checked={autoRefresh} onCheckedChange={setAutoRefresh} />
                        <Label htmlFor="auto-refresh" className="text-sm">Auto-refresh (5s)</Label>
                    </div>
                    <Button variant="outline" size="sm" onClick={fetchLogs} disabled={isLoading || !selectedVessel}>
                        <RefreshCw className={`h-4 w-4 mr-2 ${isLoading ? "animate-spin" : ""}`} />
                        Actualizar
                    </Button>
                </div>
            </div>

            {/* Selector de embarcación */}
            <Card>
                <CardContent className="pt-6">
                    <div className="flex flex-col sm:flex-row gap-4 items-end">
                        <div className="flex-1">
                            <Label>Embarcación</Label>
                            <Select
                                value={selectedVessel?.toString() ?? ""}
                                onValueChange={(v) => setSelectedVessel(parseInt(v, 10))}
                            >
                                <SelectTrigger>
                                    <SelectValue placeholder="Seleccionar embarcación..." />
                                </SelectTrigger>
                                <SelectContent>
                                    {vessels.map((v) => (
                                        <SelectItem key={v.id} value={v.id.toString()}>
                                            {v.name} {v.imo ? `(${v.imo})` : ""}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                    </div>
                </CardContent>
            </Card>

            {/* Estado del dispositivo */}
            {deviceInfo && (
                <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-3">
                    <Card>
                        <CardContent className="pt-4 pb-3 text-center">
                            <div className="flex items-center justify-center gap-2 mb-1">
                                {deviceInfo.is_online ? <Wifi className="h-4 w-4 text-green-500" /> : <WifiOff className="h-4 w-4 text-red-500" />}
                                <span className="text-xs font-medium text-muted-foreground">Estado</span>
                            </div>
                            <Badge variant={deviceInfo.is_online ? "default" : "destructive"} className={deviceInfo.is_online ? "bg-green-500" : ""}>
                                {deviceInfo.is_online ? "ONLINE" : "OFFLINE"}
                            </Badge>
                        </CardContent>
                    </Card>
                    <Card>
                        <CardContent className="pt-4 pb-3 text-center">
                            <div className="flex items-center justify-center gap-2 mb-1">
                                <MapPin className="h-4 w-4 text-blue-500" />
                                <span className="text-xs font-medium text-muted-foreground">IP</span>
                            </div>
                            <p className="font-mono text-sm">{deviceInfo.device_ip ?? "—"}</p>
                        </CardContent>
                    </Card>
                    <Card>
                        <CardContent className="pt-4 pb-3 text-center">
                            <div className="flex items-center justify-center gap-2 mb-1">
                                <Cpu className="h-4 w-4 text-purple-500" />
                                <span className="text-xs font-medium text-muted-foreground">Firmware</span>
                            </div>
                            <p className="font-mono text-sm">{deviceInfo.firmware ?? "—"}</p>
                        </CardContent>
                    </Card>
                    <Card>
                        <CardContent className="pt-4 pb-3 text-center">
                            <div className="flex items-center justify-center gap-2 mb-1">
                                <Clock className="h-4 w-4 text-orange-500" />
                                <span className="text-xs font-medium text-muted-foreground">Uptime</span>
                            </div>
                            <p className="font-mono text-sm">
                                {deviceInfo.uptime != null
                                    ? `${Math.floor(deviceInfo.uptime / 3600)}h ${Math.floor((deviceInfo.uptime % 3600) / 60)}m ${deviceInfo.uptime % 60}s`
                                    : "—"}
                            </p>
                        </CardContent>
                    </Card>
                    <Card>
                        <CardContent className="pt-4 pb-3 text-center">
                            <div className="flex items-center justify-center gap-2 mb-1">
                                <Activity className="h-4 w-4 text-cyan-500" />
                                <span className="text-xs font-medium text-muted-foreground">Último ping</span>
                            </div>
                            <p className="text-xs">
                                {deviceInfo.last_seen_at ? formatDate(deviceInfo.last_seen_at) : "—"}
                            </p>
                        </CardContent>
                    </Card>
                    <Card>
                        <CardContent className="pt-4 pb-3 text-center">
                            <div className="flex items-center justify-center gap-2 mb-1">
                                <Terminal className="h-4 w-4 text-yellow-500" />
                                <span className="text-xs font-medium text-muted-foreground">Telemetrías</span>
                            </div>
                            <p className="font-mono text-lg font-bold">{deviceInfo.total_logs}</p>
                        </CardContent>
                    </Card>
                    <Card>
                        <CardContent className="pt-4 pb-3 text-center">
                            <div className="flex items-center justify-center gap-2 mb-1">
                                <Navigation className="h-4 w-4 text-emerald-500" />
                                <span className="text-xs font-medium text-muted-foreground">Trackings</span>
                            </div>
                            <p className="font-mono text-lg font-bold">{deviceInfo.total_trackings}</p>
                        </CardContent>
                    </Card>
                </div>
            )}

            {/* Tabla de logs */}
            {selectedVessel && (
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <Terminal className="h-5 w-5" />
                            Log de Telemetría GPS
                            {autoRefresh && (
                                <Badge variant="outline" className="ml-2 animate-pulse text-green-600 border-green-300">
                                    LIVE
                                </Badge>
                            )}
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        {logs.length === 0 && !isLoading ? (
                            <div className="text-center py-12 text-muted-foreground">
                                <Satellite className="h-12 w-12 mx-auto mb-4 opacity-30" />
                                <p className="text-lg font-medium">Sin datos de telemetría</p>
                                <p className="text-sm mt-1">El dispositivo aún no ha enviado coordenadas GPS</p>
                            </div>
                        ) : (
                            <div className="overflow-x-auto">
                                <table className="w-full text-sm">
                                    <thead>
                                        <tr className="border-b bg-muted/50">
                                            <th className="text-left py-2 px-3 font-medium">#</th>
                                            <th className="text-left py-2 px-3 font-medium">Hora</th>
                                            <th className="text-left py-2 px-3 font-medium">
                                                <div className="flex items-center gap-1"><Satellite className="h-3.5 w-3.5" /> GPS</div>
                                            </th>
                                            <th className="text-left py-2 px-3 font-medium">
                                                <div className="flex items-center gap-1"><MapPin className="h-3.5 w-3.5" /> Lat / Lon</div>
                                            </th>
                                            <th className="text-left py-2 px-3 font-medium">UTM WGS84</th>
                                            <th className="text-left py-2 px-3 font-medium">
                                                <div className="flex items-center gap-1"><Gauge className="h-3.5 w-3.5" /> Vel (kn)</div>
                                            </th>
                                            <th className="text-left py-2 px-3 font-medium">
                                                <div className="flex items-center gap-1"><Navigation className="h-3.5 w-3.5" /> Rumbo</div>
                                            </th>
                                            <th className="text-left py-2 px-3 font-medium">
                                                <div className="flex items-center gap-1"><Zap className="h-3.5 w-3.5" /> Voltaje</div>
                                            </th>
                                            <th className="text-left py-2 px-3 font-medium">SAT / HDOP</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {logs.map((log, i) => {
                                            const hasGps = log.latitude !== 0 && log.longitude !== 0
                                            const raw = log.raw_data ?? {}
                                            const sats = raw.satellites as number | undefined
                                            const hdop = raw.hdop as number | undefined

                                            return (
                                                <tr key={i} className="border-b hover:bg-muted/30 transition-colors">
                                                    <td className="py-2 px-3 font-mono text-xs text-muted-foreground">{logs.length - i}</td>
                                                    <td className="py-2 px-3 font-mono text-xs whitespace-nowrap">{formatTime(log.timestamp)}</td>
                                                    <td className="py-2 px-3">
                                                        {hasGps ? (
                                                            <Badge variant="default" className="bg-green-500 text-[10px] px-1.5">FIX</Badge>
                                                        ) : (
                                                            <Badge variant="destructive" className="text-[10px] px-1.5">NO FIX</Badge>
                                                        )}
                                                    </td>
                                                    <td className="py-2 px-3 font-mono text-xs">
                                                        {hasGps ? (
                                                            <div>
                                                                <span>{log.latitude.toFixed(6)}°</span>
                                                                <span className="text-muted-foreground mx-1">/</span>
                                                                <span>{log.longitude.toFixed(6)}°</span>
                                                            </div>
                                                        ) : (
                                                            <span className="text-muted-foreground">—</span>
                                                        )}
                                                    </td>
                                                    <td className="py-2 px-3 font-mono text-xs">
                                                        {log.utm ?? <span className="text-muted-foreground">—</span>}
                                                    </td>
                                                    <td className="py-2 px-3 font-mono text-xs">{log.speed.toFixed(1)}</td>
                                                    <td className="py-2 px-3 font-mono text-xs">
                                                        {log.course != null ? `${log.course.toFixed(0)}°` : "—"}
                                                    </td>
                                                    <td className="py-2 px-3 font-mono text-xs">
                                                        {log.voltage != null ? `${log.voltage.toFixed(1)}V` : "—"}
                                                    </td>
                                                    <td className="py-2 px-3 font-mono text-xs">
                                                        {sats != null ? (
                                                            <div className="flex items-center gap-1">
                                                                <Satellite className={`h-3 w-3 ${(sats ?? 0) >= 4 ? "text-green-500" : "text-yellow-500"}`} />
                                                                <span>{sats}</span>
                                                                {hdop != null && <span className="text-muted-foreground">/ {(hdop as number).toFixed(1)}</span>}
                                                            </div>
                                                        ) : "—"}
                                                    </td>
                                                </tr>
                                            )
                                        })}
                                    </tbody>
                                </table>
                            </div>
                        )}
                    </CardContent>
                </Card>
            )}

            {/* Leyenda */}
            {selectedVessel && logs.length > 0 && (
                <Card>
                    <CardContent className="pt-4 pb-3">
                        <div className="flex flex-wrap gap-x-6 gap-y-2 text-xs text-muted-foreground">
                            <div className="flex items-center gap-1.5">
                                <Badge variant="default" className="bg-green-500 text-[10px] px-1.5">FIX</Badge>
                                Señal GPS válida (≥3 satélites)
                            </div>
                            <div className="flex items-center gap-1.5">
                                <Badge variant="destructive" className="text-[10px] px-1.5">NO FIX</Badge>
                                Sin señal GPS — solo heartbeat
                            </div>
                            <div className="flex items-center gap-1.5">
                                <Satellite className="h-3.5 w-3.5 text-green-500" /> ≥4 sat = buena precisión
                            </div>
                            <div className="flex items-center gap-1.5">
                                <Satellite className="h-3.5 w-3.5 text-yellow-500" /> &lt;4 sat = baja precisión
                            </div>
                            <div>HDOP &lt;2.0 = excelente · &lt;5.0 = bueno · &gt;5.0 = pobre</div>
                        </div>
                    </CardContent>
                </Card>
            )}
        </div>
    )
}
