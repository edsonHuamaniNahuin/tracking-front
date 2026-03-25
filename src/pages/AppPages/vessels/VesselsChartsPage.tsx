"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Calendar } from "@/components/ui/calendar"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { CalendarIcon, Download, Ship, Activity, LineChart, PieChart, BarChart3, Navigation, Route } from "lucide-react"
import { format } from "date-fns"
import { es } from "date-fns/locale"

// Componentes de gráficos actualizados
import { VesselsStatsCards } from "@/components/vessels/vessels-stats-cards"
import { VesselsByTypeChart } from "@/components/vessels/charts/vessels-by-type-chart"
import { VesselsStatusChart } from "@/components/vessels/charts/vessels-status-chart"
import { VesselsActivityChart } from "@/components/vessels/charts/vessels-activity-chart"
import { VesselsAgeChart } from "@/components/vessels/charts/vessels-age-chart"
import { VesselsComparisonChart } from "@/components/vessels/charts/vessels-comparison-chart"
import { VesselsPerformanceChart } from "@/components/vessels/charts/vessels-performance-chart"
import { TabAwareMap } from "@/components/vessels/charts/tab-aware-map"
import { FixedZoomMap } from "@/components/vessels/charts/fixed-zoom-map"
import { RouteMap } from "@/components/vessels/charts/route-map"

// Servicios y tipos
import { dashboardService } from "@/services/dashboard.service"
import type { DashboardStatsData } from "@/types/models/dashboardStats"

export default function VesselsChartsPage() {
    const [date, setDate] = useState<Date | undefined>(new Date())
    const [period, setPeriod] = useState("month")
    const [dashboardData, setDashboardData] = useState<DashboardStatsData | null>(null)
    const [isLoading, setIsLoading] = useState(true)
    const [error, setError] = useState<string | null>(null)

    // Cargar datos del dashboard
    useEffect(() => {
        const loadDashboardData = async () => {
            try {
                setIsLoading(true)
                const data = await dashboardService.getStats()
                setDashboardData(data)
                setError(null)
            } catch (err) {
                console.error('Error loading dashboard data:', err)
                setError('Error al cargar los datos del dashboard')
            } finally {
                setIsLoading(false)
            }
        }

        loadDashboardData()
    }, [])

    if (error) {
        return (
            <div className="container mx-auto py-6 space-y-6 px-6">
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
        <div className="container mx-auto py-6 space-y-6 px-6">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight flex items-center">
                        <Ship className="mr-2 h-6 w-6" />
                        Dashboard de Embarcaciones
                    </h1>
                    <p className="text-muted-foreground">Análisis y estadísticas de tu flota</p>
                </div>

                <div className="flex items-center space-x-2">
                    <Popover>
                        <PopoverTrigger asChild>
                            <Button variant="outline" className="w-[240px] justify-start text-left font-normal">
                                <CalendarIcon className="mr-2 h-4 w-4" />
                                {date ? format(date, "PPP", { locale: es }) : <span>Seleccionar fecha</span>}
                            </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto p-0" align="end">
                            <Calendar mode="single" selected={date} onSelect={setDate} initialFocus locale={es} />
                        </PopoverContent>
                    </Popover>

                    <Select value={period} onValueChange={setPeriod}>
                        <SelectTrigger className="w-[180px]">
                            <SelectValue placeholder="Seleccionar período" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="week">Última semana</SelectItem>
                            <SelectItem value="month">Último mes</SelectItem>
                            <SelectItem value="quarter">Último trimestre</SelectItem>
                            <SelectItem value="year">Último año</SelectItem>
                            <SelectItem value="all">Todo el tiempo</SelectItem>
                        </SelectContent>
                    </Select>

                    <Button variant="outline" size="icon">
                        <Download className="h-4 w-4" />
                    </Button>
                </div>
            </div>            {/* Stats Cards */}
            <VesselsStatsCards
                metrics={dashboardData?.main_metrics || {
                    total_vessels: 0,
                    active_vessels: 0,
                    total_trackings: 0,
                    total_users: 0,
                    vessels_with_alerts: 0,
                    maintenance_vessels: 0
                }}
                isLoading={isLoading}
            />            {/* Tabs for different chart views */}
            <Tabs defaultValue="overview" className="space-y-4">
                <TabsList className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-8 h-auto">
                    <TabsTrigger value="overview" className="flex items-center">
                        <Activity className="mr-2 h-4 w-4" />
                        <span className="hidden md:inline">Resumen</span>
                    </TabsTrigger>
                    <TabsTrigger value="types" className="flex items-center">
                        <Ship className="mr-2 h-4 w-4" />
                        <span className="hidden md:inline">Tipos</span>
                    </TabsTrigger>
                    <TabsTrigger value="activity" className="flex items-center">
                        <LineChart className="mr-2 h-4 w-4" />
                        <span className="hidden md:inline">Actividad</span>
                    </TabsTrigger>
                    <TabsTrigger value="status" className="flex items-center">
                        <PieChart className="mr-2 h-4 w-4" />
                        <span className="hidden md:inline">Estado</span>
                    </TabsTrigger>
                    <TabsTrigger value="age" className="flex items-center">
                        <BarChart3 className="mr-2 h-4 w-4" />
                        <span className="hidden md:inline">Antigüedad</span>
                    </TabsTrigger>
                    <TabsTrigger value="performance" className="flex items-center">
                        <Activity className="mr-2 h-4 w-4" />
                        <span className="hidden md:inline">Rendimiento</span>
                    </TabsTrigger>
                    <TabsTrigger value="map" className="flex items-center">
                        <Navigation className="mr-2 h-4 w-4" />
                        <span className="hidden md:inline">Mapa</span>
                    </TabsTrigger>
                    <TabsTrigger value="routes" className="flex items-center">
                        <Route className="mr-2 h-4 w-4" />
                        <span className="hidden md:inline">Rutas</span>
                    </TabsTrigger>
                </TabsList>

                {/* Overview Tab */}
                <TabsContent value="overview" className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <Card>
                            <CardHeader className="flex flex-row items-center justify-between pb-2">
                                <div className="space-y-0.5">
                                    <CardTitle className="text-base">Embarcaciones por Tipo</CardTitle>
                                    <CardDescription>Distribución de la flota por categoría</CardDescription>
                                </div>
                                <Ship className="h-4 w-4 text-muted-foreground" />
                            </CardHeader>                            <CardContent>
                                <VesselsByTypeChart
                                    data={dashboardData?.vessels_by_type || []}
                                    isLoading={isLoading}
                                    height={220}
                                />
                            </CardContent>
                        </Card>
                        <Card>
                            <CardHeader className="flex flex-row items-center justify-between pb-2">
                                <div className="space-y-0.5">
                                    <CardTitle className="text-base">Estado de Embarcaciones</CardTitle>
                                    <CardDescription>Distribución por estado operativo</CardDescription>
                                </div>
                                <Ship className="h-4 w-4 text-muted-foreground" />
                            </CardHeader>
                            <CardContent>
                                <VesselsStatusChart
                                    data={dashboardData?.vessels_by_status || []}
                                    isLoading={isLoading}
                                    height={220}
                                />
                            </CardContent>
                        </Card>
                    </div>

                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between pb-2">
                            <div className="space-y-0.5">
                                <CardTitle className="text-base">Actividad de Embarcaciones</CardTitle>
                                <CardDescription>Viajes registrados en el último período</CardDescription>
                            </div>
                            <LineChart className="h-4 w-4 text-muted-foreground" />
                        </CardHeader>                        <CardContent>
                            <VesselsActivityChart
                                data={dashboardData?.monthly_activity || []}
                                isLoading={isLoading}
                                height={300}
                            />
                        </CardContent>
                    </Card>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <Card>
                            <CardHeader className="flex flex-row items-center justify-between pb-2">
                                <div className="space-y-0.5">
                                    <CardTitle className="text-base">Antigüedad de la Flota</CardTitle>
                                    <CardDescription>Distribución por año de fabricación</CardDescription>
                                </div>
                                <BarChart3 className="h-4 w-4 text-muted-foreground" />
                            </CardHeader>                            <CardContent>
                                <VesselsAgeChart
                                    data={dashboardData?.fleet_aging || []}
                                    isLoading={isLoading}
                                    height={220}
                                />
                            </CardContent>
                        </Card>
                        <Card>
                            <CardHeader className="flex flex-row items-center justify-between pb-2">
                                <div className="space-y-0.5">
                                    <CardTitle className="text-base">Comparativa de Rendimiento</CardTitle>
                                    <CardDescription>Eficiencia por tipo de embarcación</CardDescription>
                                </div>
                                <Activity className="h-4 w-4 text-muted-foreground" />
                            </CardHeader>
                            <CardContent>
                                <VesselsComparisonChart height={220} />
                            </CardContent>
                        </Card>
                    </div>
                </TabsContent>

                {/* Types Tab */}
                <TabsContent value="types">
                    <Card>
                        <CardHeader>
                            <CardTitle>Embarcaciones por Tipo</CardTitle>
                            <CardDescription>
                                Análisis detallado de la distribución de tu flota por categoría y subcategoría
                            </CardDescription>
                        </CardHeader>                        <CardContent className="pt-6">
                            <VesselsByTypeChart
                                data={dashboardData?.vessels_by_type || []}
                                isLoading={isLoading}
                                height={400}
                            />
                        </CardContent>
                    </Card>
                </TabsContent>

                {/* Activity Tab */}
                <TabsContent value="activity">
                    <Card>
                        <CardHeader>
                            <CardTitle>Actividad de Embarcaciones</CardTitle>
                            <CardDescription>Seguimiento de viajes y operaciones a lo largo del tiempo</CardDescription>
                        </CardHeader>
                        <CardContent className="pt-6">
                            <VesselsActivityChart
                                data={dashboardData?.monthly_activity || []}
                                isLoading={isLoading}
                                height={500}
                            />
                        </CardContent>
                    </Card>
                </TabsContent>

                {/* Status Tab */}
                <TabsContent value="status">
                    <Card>
                        <CardHeader>
                            <CardTitle>Estado de Embarcaciones</CardTitle>
                            <CardDescription>Distribución actual de embarcaciones por estado operativo</CardDescription>
                        </CardHeader>                        <CardContent className="pt-6">
                            <VesselsStatusChart
                                data={dashboardData?.vessels_by_status || []}
                                isLoading={isLoading}
                                height={500}
                            />
                        </CardContent>
                    </Card>
                </TabsContent>

                {/* Age Tab */}
                <TabsContent value="age">
                    <Card>
                        <CardHeader>
                            <CardTitle>Antigüedad de la Flota</CardTitle>
                            <CardDescription>Análisis de la distribución de embarcaciones por año de fabricación</CardDescription>
                        </CardHeader>                        <CardContent className="pt-6">
                            <VesselsAgeChart
                                data={dashboardData?.fleet_aging || []}
                                isLoading={isLoading}
                                height={500}
                            />
                        </CardContent>
                    </Card>
                </TabsContent>

                {/* Performance Tab */}
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

                {/* Map Tab */}
                <TabsContent value="map">
                    <Card>
                        <CardHeader>
                            <CardTitle>Mapa de Embarcaciones</CardTitle>
                            <CardDescription>Ubicación y rutas de las embarcaciones activas</CardDescription>
                        </CardHeader>                        <CardContent className="pt-6">
                            <FixedZoomMap
                                data={dashboardData?.vessel_positions || []}
                                height={600}
                            />
                            {/* <TabAwareMap
                                data={dashboardData?.vessel_positions || []}
                                height={600}
                            /> */}
                        </CardContent>
                    </Card>
                </TabsContent>

                {/* Routes Tab */}
                <TabsContent value="routes">
                    <RouteMap
                        data={dashboardData?.vessel_positions || []}
                        isLoading={isLoading}
                        height={600}
                        onRouteCreate={(route) => {
                            console.log('Nueva ruta creada:', route)
                            // Aquí puedes agregar lógica para guardar la ruta en el backend
                        }}
                        onRouteDelete={(routeId) => {
                            console.log('Ruta eliminada:', routeId)
                            // Aquí puedes agregar lógica para eliminar la ruta del backend
                        }}
                    />
                </TabsContent>
            </Tabs>
        </div>
    )
}
