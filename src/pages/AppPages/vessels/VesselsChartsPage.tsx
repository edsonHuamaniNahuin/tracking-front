"use client"

import { useState, useEffect, useCallback, useMemo } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Calendar } from "@/components/ui/calendar"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { CalendarIcon, Download, Ship, Activity, LineChart, PieChart, BarChart3, Navigation, Route } from "lucide-react"
import { format, startOfWeek, startOfMonth, startOfQuarter, startOfYear } from "date-fns"
import { es } from "date-fns/locale"
import * as XLSX from "xlsx"

import { VesselsStatsCards } from "@/components/vessels/vessels-stats-cards"
import { VesselsByTypeChart } from "@/components/vessels/charts/vessels-by-type-chart"
import { VesselsStatusChart } from "@/components/vessels/charts/vessels-status-chart"
import { VesselsActivityChart } from "@/components/vessels/charts/vessels-activity-chart"
import { VesselsAgeChart } from "@/components/vessels/charts/vessels-age-chart"
import { VesselsComparisonChart } from "@/components/vessels/charts/vessels-comparison-chart"
import { VesselsPerformanceChart } from "@/components/vessels/charts/vessels-performance-chart"
import { FixedZoomMap } from "@/components/vessels/charts/fixed-zoom-map"
import { RouteMap } from "@/components/vessels/charts/route-map"

import { dashboardService } from "@/services/dashboard.service"
import type { DashboardStatsData } from "@/types/models/dashboardStats"

type FilterMode = "period" | "date"

const PERIOD_LABELS: Record<string, string> = {
    week: "Última semana",
    month: "Último mes",
    quarter: "Último trimestre",
    year: "Último año",
}

export default function VesselsChartsPage() {
    const today = useMemo(() => new Date(), [])
    const [filterMode, setFilterMode] = useState<FilterMode>("period")
    const [period, setPeriod] = useState("month")
    const [date, setDate] = useState<Date>(today)
    const [datePickerOpen, setDatePickerOpen] = useState(false)
    const [dashboardData, setDashboardData] = useState<DashboardStatsData | null>(null)
    const [isLoading, setIsLoading] = useState(true)
    const [error, setError] = useState<string | null>(null)

    // Calcular rango de fechas según filtro activo
    const dateRange = useMemo(() => {
        const end = today
        end.setHours(23, 59, 59, 999)

        if (filterMode === "date") {
            const start = new Date(date)
            start.setHours(0, 0, 0, 0)
            return { start, end }
        }

        let start: Date
        switch (period) {
            case "week":   start = startOfWeek(end, { weekStartsOn: 1 }); break
            case "month":  start = startOfMonth(end); break
            case "quarter":start = startOfQuarter(end); break
            case "year":   start = startOfYear(end); break
            default:       start = startOfMonth(end)
        }
        start.setHours(0, 0, 0, 0)
        return { start, end }
    }, [filterMode, period, date, today])

    const fmt = (d: Date) => format(d, "yyyy-MM-dd")

    // Cargar datos con filtros
    const loadData = useCallback(async () => {
        setIsLoading(true)
        setError(null)
        try {
            const data = await dashboardService.getStatsWithFilters({
                start_date: fmt(dateRange.start),
                end_date: fmt(dateRange.end),
            })
            setDashboardData(data)
        } catch {
            setError("Error al cargar los datos del dashboard")
        } finally {
            setIsLoading(false)
        }
    }, [dateRange])

    useEffect(() => { loadData() }, [loadData])

    // ── Excel download ────────────────────────────────────────────────
    const handleDownload = () => {
        if (!dashboardData) return

        const wb = XLSX.utils.book_new()

        // Hoja 1: Métricas principales
        if (dashboardData.main_metrics) {
            const m = dashboardData.main_metrics
            const metricsRows = [
                ["Métrica", "Valor"],
                ["Total Unidades", m.total_vessels],
                ["Unidades Activas", m.active_vessels],
                ["En Mantenimiento", m.maintenance_vessels],
                ["Total Trackings", m.total_trackings],
                ["Total Usuarios", m.total_users],
                ["Unidades con Alertas", m.vessels_with_alerts],
            ]
            XLSX.utils.book_append_sheet(wb, XLSX.utils.aoa_to_sheet(metricsRows), "Métricas")
        }

        // Hoja 2: Actividad mensual
        if (dashboardData.monthly_activity?.length) {
            const rows = [["Mes", "Trackings"]]
            for (const a of dashboardData.monthly_activity) {
                rows.push([a.month_name ?? a.month, String(a.trackings)])
            }
            XLSX.utils.book_append_sheet(wb, XLSX.utils.aoa_to_sheet(rows), "Actividad Mensual")
        }

        // Hoja 3: Unidades por tipo
        if (dashboardData.vessels_by_type?.length) {
            const rows = [["Tipo", "Cantidad"]]
            for (const v of dashboardData.vessels_by_type) {
                rows.push([v.type, String(v.count)])
            }
            XLSX.utils.book_append_sheet(wb, XLSX.utils.aoa_to_sheet(rows), "Por Tipo")
        }

        // Hoja 4: Unidades por estado
        if (dashboardData.vessels_by_status?.length) {
            const rows = [["Estado", "Cantidad"]]
            for (const v of dashboardData.vessels_by_status) {
                rows.push([v.status, String(v.count)])
            }
            XLSX.utils.book_append_sheet(wb, XLSX.utils.aoa_to_sheet(rows), "Por Estado")
        }

        // Hoja 5: Posiciones
        if (dashboardData.vessel_positions?.length) {
            const rows = [["Embarcación", "Tipo", "Latitud", "Longitud", "Último Reporte"]]
            for (const p of dashboardData.vessel_positions) {
                rows.push([p.name, p.type ?? "", String(p.latitude), String(p.longitude), p.last_position_at ?? ""])
            }
            XLSX.utils.book_append_sheet(wb, XLSX.utils.aoa_to_sheet(rows), "Posiciones")
        }

        const label = filterMode === "period" ? (PERIOD_LABELS[period] ?? period) : format(date, "dd/MM/yyyy")
        const filename = `dashboard_${label.replace(/\s/g, "_")}.xlsx`
        XLSX.writeFile(wb, filename)
    }

    if (error) {
        return (
            <div className="flex flex-1 flex-col gap-4 py-4 px-4 lg:px-6">
                <div className="text-center">
                    <h1 className="text-2xl font-bold text-red-600">Error</h1>
                    <p className="text-muted-foreground mt-2">{error}</p>
                    <Button onClick={() => window.location.reload()} className="mt-4">
                        Intentar de nuevo
                    </Button>
                </div>
            </div>
        )
    }

    return (
        <div className="flex flex-1 flex-col gap-4 py-4 px-4 lg:px-6">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight flex items-center">
                        <Ship className="mr-2 h-6 w-6" />
                        Dashboard de Unidades
                    </h1>
                    <p className="text-muted-foreground">Análisis y estadísticas de tu flota</p>
                </div>

                <div className="flex flex-wrap items-center gap-2">
                    {/* Selector de período */}
                    <Select
                        value={filterMode === "period" ? period : ""}
                        onValueChange={(v) => {
                            if (!v) return
                            setPeriod(v)
                            setFilterMode("period")
                        }}
                    >
                        <SelectTrigger className={`w-full sm:w-[160px] ${filterMode === "period" ? "border-primary ring-1 ring-primary/20" : ""}`}>
                            <SelectValue placeholder="Período" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="week">Última semana</SelectItem>
                            <SelectItem value="month">Último mes</SelectItem>
                            <SelectItem value="quarter">Último trimestre</SelectItem>
                            <SelectItem value="year">Último año</SelectItem>
                        </SelectContent>
                    </Select>

                    {/* Date picker */}
                    <Popover open={datePickerOpen} onOpenChange={setDatePickerOpen}>
                        <PopoverTrigger asChild>
                            <Button
                                variant="outline"
                                className={`w-full sm:w-[200px] justify-start text-left font-normal ${filterMode === "date" ? "border-primary ring-1 ring-primary/20" : ""}`}
                            >
                                <CalendarIcon className="mr-2 h-4 w-4 shrink-0" />
                                {filterMode === "date"
                                    ? format(date, "PPP", { locale: es })
                                    : <span className="text-muted-foreground">Seleccionar fecha</span>
                                }
                            </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto p-0" align="end">
                            <Calendar
                                mode="single"
                                selected={filterMode === "date" ? date : undefined}
                                onSelect={(d) => {
                                    if (!d) return
                                    setDate(d)
                                    setFilterMode("date")
                                    setDatePickerOpen(false)
                                }}
                                disabled={(d) => d > today}
                                locale={es}
                                initialFocus
                            />
                        </PopoverContent>
                    </Popover>

                    {/* Download */}
                    <Button variant="outline" size="icon" onClick={handleDownload} title="Descargar Excel">
                        <Download className="h-4 w-4" />
                    </Button>
                </div>
            </div>

            {/* Indicador de filtro activo */}
            <p className="text-xs text-muted-foreground -mt-2">
                Mostrando datos del{" "}
                <span className="font-medium text-foreground">
                    {filterMode === "period"
                        ? PERIOD_LABELS[period] ?? period
                        : format(date, "PPP", { locale: es })
                    }
                </span>
                {" "}({fmt(dateRange.start)} → {fmt(dateRange.end)})
            </p>

            {/* Stats Cards */}
            <VesselsStatsCards
                metrics={dashboardData?.main_metrics || {
                    total_vessels: 0,
                    active_vessels: 0,
                    total_trackings: 0,
                    total_users: 0,
                    vessels_with_alerts: 0,
                    maintenance_vessels: 0,
                }}
                isLoading={isLoading}
            />

            {/* Tabs for different chart views */}
            <Tabs defaultValue="overview" className="space-y-4">
                <TabsList className="flex flex-wrap h-auto gap-1 p-1">
                    <TabsTrigger value="overview" className="flex items-center text-xs sm:text-sm">
                        <Activity className="mr-1.5 h-4 w-4" />
                        <span className="hidden sm:inline">Resumen</span>
                    </TabsTrigger>
                    <TabsTrigger value="types" className="flex items-center text-xs sm:text-sm">
                        <Ship className="mr-1.5 h-4 w-4" />
                        <span className="hidden sm:inline">Tipos</span>
                    </TabsTrigger>
                    <TabsTrigger value="activity" className="flex items-center text-xs sm:text-sm">
                        <LineChart className="mr-1.5 h-4 w-4" />
                        <span className="hidden sm:inline">Actividad</span>
                    </TabsTrigger>
                    <TabsTrigger value="status" className="flex items-center text-xs sm:text-sm">
                        <PieChart className="mr-1.5 h-4 w-4" />
                        <span className="hidden sm:inline">Estado</span>
                    </TabsTrigger>
                    <TabsTrigger value="age" className="flex items-center text-xs sm:text-sm">
                        <BarChart3 className="mr-1.5 h-4 w-4" />
                        <span className="hidden sm:inline">Antigüedad</span>
                    </TabsTrigger>
                    <TabsTrigger value="performance" className="flex items-center text-xs sm:text-sm">
                        <Activity className="mr-1.5 h-4 w-4" />
                        <span className="hidden sm:inline">Rendimiento</span>
                    </TabsTrigger>
                    <TabsTrigger value="map" className="flex items-center text-xs sm:text-sm">
                        <Navigation className="mr-1.5 h-4 w-4" />
                        <span className="hidden sm:inline">Mapa</span>
                    </TabsTrigger>
                    <TabsTrigger value="routes" className="flex items-center text-xs sm:text-sm">
                        <Route className="mr-1.5 h-4 w-4" />
                        <span className="hidden sm:inline">Rutas</span>
                    </TabsTrigger>
                </TabsList>

                {/* Overview Tab */}
                <TabsContent value="overview" className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <Card>
                            <CardHeader className="flex flex-row items-start justify-between gap-2 pb-2">
                                <div className="space-y-0.5 min-w-0">
                                    <CardTitle className="text-base">Unidades por Tipo</CardTitle>
                                    <CardDescription>Distribución de la flota por categoría</CardDescription>
                                </div>
                                <Ship className="h-4 w-4 text-muted-foreground shrink-0 mt-1" />
                            </CardHeader>
                            <CardContent>
                                <VesselsByTypeChart data={dashboardData?.vessels_by_type || []} isLoading={isLoading} height={220} />
                            </CardContent>
                        </Card>
                        <Card>
                            <CardHeader className="flex flex-row items-start justify-between gap-2 pb-2">
                                <div className="space-y-0.5 min-w-0">
                                    <CardTitle className="text-base">Estado de Unidades</CardTitle>
                                    <CardDescription>Distribución por estado operativo</CardDescription>
                                </div>
                                <Ship className="h-4 w-4 text-muted-foreground shrink-0 mt-1" />
                            </CardHeader>
                            <CardContent>
                                <VesselsStatusChart data={dashboardData?.vessels_by_status || []} isLoading={isLoading} height={220} />
                            </CardContent>
                        </Card>
                    </div>

                    <Card>
                        <CardHeader className="flex flex-row items-start justify-between gap-2 pb-2">
                            <div className="space-y-0.5 min-w-0">
                                <CardTitle className="text-base">Actividad de Unidades</CardTitle>
                                <CardDescription>Viajes registrados en el último período</CardDescription>
                            </div>
                            <LineChart className="h-4 w-4 text-muted-foreground shrink-0 mt-1" />
                        </CardHeader>
                        <CardContent>
                            <VesselsActivityChart data={dashboardData?.monthly_activity || []} isLoading={isLoading} height={300} />
                        </CardContent>
                    </Card>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <Card>
                            <CardHeader className="flex flex-row items-start justify-between gap-2 pb-2">
                                <div className="space-y-0.5 min-w-0">
                                    <CardTitle className="text-base">Antigüedad de la Flota</CardTitle>
                                    <CardDescription>Distribución por año de fabricación</CardDescription>
                                </div>
                                <BarChart3 className="h-4 w-4 text-muted-foreground shrink-0 mt-1" />
                            </CardHeader>
                            <CardContent>
                                <VesselsAgeChart data={dashboardData?.fleet_aging || []} isLoading={isLoading} height={220} />
                            </CardContent>
                        </Card>
                        <Card>
                            <CardHeader className="flex flex-row items-start justify-between gap-2 pb-2">
                                <div className="space-y-0.5 min-w-0">
                                    <CardTitle className="text-base">Comparativa de Rendimiento</CardTitle>
                                    <CardDescription>Eficiencia por tipo de embarcación</CardDescription>
                                </div>
                                <Activity className="h-4 w-4 text-muted-foreground shrink-0 mt-1" />
                            </CardHeader>
                            <CardContent>
                                <VesselsComparisonChart height={220} />
                            </CardContent>
                        </Card>
                    </div>
                </TabsContent>

                <TabsContent value="types">
                    <Card>
                        <CardHeader>
                            <CardTitle>Unidades por Tipo</CardTitle>
                            <CardDescription>Análisis detallado de la distribución de tu flota por categoría y subcategoría</CardDescription>
                        </CardHeader>
                        <CardContent className="pt-6">
                            <VesselsByTypeChart data={dashboardData?.vessels_by_type || []} isLoading={isLoading} height={400} />
                        </CardContent>
                    </Card>
                </TabsContent>

                <TabsContent value="activity">
                    <Card>
                        <CardHeader>
                            <CardTitle>Actividad de Unidades</CardTitle>
                            <CardDescription>Seguimiento de viajes y operaciones a lo largo del tiempo</CardDescription>
                        </CardHeader>
                        <CardContent className="pt-6">
                            <VesselsActivityChart data={dashboardData?.monthly_activity || []} isLoading={isLoading} height={500} />
                        </CardContent>
                    </Card>
                </TabsContent>

                <TabsContent value="status">
                    <Card>
                        <CardHeader>
                            <CardTitle>Estado de Unidades</CardTitle>
                            <CardDescription>Distribución actual de unidades por estado operativo</CardDescription>
                        </CardHeader>
                        <CardContent className="pt-6">
                            <VesselsStatusChart data={dashboardData?.vessels_by_status || []} isLoading={isLoading} height={500} />
                        </CardContent>
                    </Card>
                </TabsContent>

                <TabsContent value="age">
                    <Card>
                        <CardHeader>
                            <CardTitle>Antigüedad de la Flota</CardTitle>
                            <CardDescription>Análisis de la distribución de embarcaciones por año de fabricación</CardDescription>
                        </CardHeader>
                        <CardContent className="pt-6">
                            <VesselsAgeChart data={dashboardData?.fleet_aging || []} isLoading={isLoading} height={500} />
                        </CardContent>
                    </Card>
                </TabsContent>

                <TabsContent value="performance">
                    <Card>
                        <CardHeader>
                            <CardTitle>Rendimiento de Embarcaciones</CardTitle>
                            <CardDescription>Métricas de rendimiento y eficiencia operativa</CardDescription>
                        </CardHeader>
                        <CardContent className="pt-6">
                            <VesselsPerformanceChart height={500} />
                        </CardContent>
                    </Card>
                </TabsContent>

                <TabsContent value="map">
                    <Card>
                        <CardHeader>
                            <CardTitle>Mapa de Embarcaciones</CardTitle>
                            <CardDescription>Ubicación y rutas de las embarcaciones activas</CardDescription>
                        </CardHeader>
                        <CardContent className="pt-6">
                            <FixedZoomMap data={dashboardData?.vessel_positions || []} height={600} />
                        </CardContent>
                    </Card>
                </TabsContent>

                <TabsContent value="routes">
                    <RouteMap
                        data={dashboardData?.vessel_positions || []}
                        isLoading={isLoading}
                        height={600}
                        onRouteCreate={(route) => console.log("Nueva ruta creada:", route)}
                        onRouteDelete={(routeId) => console.log("Ruta eliminada:", routeId)}
                    />
                </TabsContent>
            </Tabs>
        </div>
    )
}
