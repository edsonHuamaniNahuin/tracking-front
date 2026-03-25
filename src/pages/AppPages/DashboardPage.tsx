import { useEffect, useState } from "react"
import { useNavigate } from "react-router-dom"
import { SectionCards } from "@/layouts/dashboard/section-cards"
import { dashboardService } from "@/services/dashboard.service"
import type { DashboardStatsData } from "@/types/models/dashboardStats"
import {
  Card, CardContent, CardDescription, CardHeader, CardTitle,
} from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, Legend,
} from "recharts"
import {
  Ship, MapPin, Activity, TrendingUp, ExternalLink, RefreshCw,
} from "lucide-react"
import { formatDateTimeMedium } from "@/utils/date"

const PIE_COLORS = ["#3b82f6", "#10b981", "#f59e0b", "#ef4444", "#8b5cf6", "#06b6d4"]

export default function DashboardPage() {
  const navigate = useNavigate()
  const [stats, setStats] = useState<DashboardStatsData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const loadStats = () => {
    setLoading(true)
    setError(null)
    dashboardService.getStats()
      .then(setStats)
      .catch(() => setError("No se pudieron cargar las estadÃ­sticas"))
      .finally(() => setLoading(false))
  }

  useEffect(() => { loadStats() }, [])

  // Datos para grÃ¡fico de actividad mensual
  const monthlyData = stats?.monthly_activity.map(m => ({
    mes: m.month_name?.slice(0, 3) ?? m.month,
    trackings: m.trackings,
  })) ?? []

  // Datos para grÃ¡fico de tipos de embarcaciÃ³n
  const byTypeData = stats?.vessels_by_type ?? []

  return (
    <div className="flex flex-1 flex-col gap-6 py-4 px-4 lg:px-6">

      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <Ship className="h-6 w-6" /> Dashboard de la Flota
          </h1>
          <p className="text-muted-foreground text-sm mt-0.5">
            Resumen general del sistema de tracking marÃ­timo
          </p>
        </div>
        <Button variant="outline" size="sm" onClick={loadStats} disabled={loading}>
          <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
          Actualizar
        </Button>
      </div>

      {error && (
        <div className="p-4 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
          {error}
        </div>
      )}

      {/* Tarjetas KPI */}
      <SectionCards />

      {/* GrÃ¡ficos principales */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

        {/* Actividad mensual */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <Activity className="h-4 w-4" />
              Actividad de Tracking Mensual
            </CardTitle>
            <CardDescription>
              NÃºmero de puntos GPS registrados por mes
            </CardDescription>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="h-48 bg-muted animate-pulse rounded" />
            ) : monthlyData.length > 0 ? (
              <ResponsiveContainer width="100%" height={220}>
                <BarChart data={monthlyData} margin={{ top: 5, right: 10, left: -10, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} />
                  <XAxis dataKey="mes" tick={{ fontSize: 12 }} />
                  <YAxis tick={{ fontSize: 12 }} />
                  <Tooltip
                    formatter={(v: number) => [v.toLocaleString('es-ES'), 'Trackings']}
                  />
                  <Bar dataKey="trackings" fill="#3b82f6" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <p className="text-center text-muted-foreground py-12 text-sm">Sin datos disponibles</p>
            )}
          </CardContent>
        </Card>

        {/* Por tipo de embarcaciÃ³n */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <Ship className="h-4 w-4" />
              DistribuciÃ³n por Tipo
            </CardTitle>
            <CardDescription>
              Flota clasificada por tipo de embarcaciÃ³n
            </CardDescription>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="h-48 bg-muted animate-pulse rounded" />
            ) : byTypeData.length > 0 ? (
              <ResponsiveContainer width="100%" height={220}>
                <PieChart>
                  <Pie
                    data={byTypeData}
                    dataKey="count"
                    nameKey="type"
                    cx="50%"
                    cy="50%"
                    outerRadius={80}
                    label={({ type, percent }) =>
                      `${type} ${Math.round((percent ?? 0) * 100)}%`
                    }
                    labelLine={false}
                  >
                    {byTypeData.map((_entry, i) => (
                      <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />
                    ))}
                  </Pie>
                  <Legend />
                  <Tooltip formatter={(v: number) => [v, 'Embarcaciones']} />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <p className="text-center text-muted-foreground py-12 text-sm">Sin datos disponibles</p>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Ãšltimas posiciones */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2 text-base">
              <MapPin className="h-4 w-4" />
              Ãšltimas Posiciones Registradas
            </CardTitle>
            <CardDescription>
              PosiciÃ³n mÃ¡s reciente de cada embarcaciÃ³n
            </CardDescription>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={() => navigate('/tracking/map')}
          >
            <ExternalLink className="h-3.5 w-3.5 mr-1.5" />
            Ver mapa
          </Button>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="space-y-2">
              {[1, 2, 3].map(i => (
                <div key={i} className="h-12 bg-muted animate-pulse rounded" />
              ))}
            </div>
          ) : (stats?.vessel_positions ?? []).length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b text-muted-foreground">
                    <th className="text-left py-2 pr-4 font-medium">EmbarcaciÃ³n</th>
                    <th className="text-left py-2 pr-4 font-medium">Tipo</th>
                    <th className="text-left py-2 pr-4 font-medium">Estado</th>
                    <th className="text-left py-2 pr-4 font-medium">Coordenadas</th>
                    <th className="text-left py-2 font-medium">Ãšltimo reporte</th>
                  </tr>
                </thead>
                <tbody>
                  {(stats?.vessel_positions ?? []).map(pos => (
                    <tr
                      key={pos.id}
                      className="border-b last:border-0 hover:bg-muted/40 cursor-pointer transition-colors"
                      onClick={() => navigate(`/tracking/map?vessel=${pos.id}`)}
                    >
                      <td className="py-2.5 pr-4 font-medium">
                        <div className="flex items-center gap-2">
                          <Ship className="h-3.5 w-3.5 text-muted-foreground" />
                          {pos.name}
                        </div>
                        {pos.imo && (
                          <div className="text-xs text-muted-foreground">IMO: {pos.imo}</div>
                        )}
                      </td>
                      <td className="py-2.5 pr-4">
                        <Badge variant="outline" className="text-xs">{pos.type || 'â€”'}</Badge>
                      </td>
                      <td className="py-2.5 pr-4">
                        <Badge
                          variant={pos.status === 'Activa' ? 'default' : 'secondary'}
                          className="text-xs"
                        >
                          {pos.status || 'â€”'}
                        </Badge>
                      </td>
                      <td className="py-2.5 pr-4 font-mono text-xs text-muted-foreground">
                        {pos.latitude && pos.longitude
                          ? `${Number(pos.latitude).toFixed(5)}, ${Number(pos.longitude).toFixed(5)}`
                          : 'â€”'}
                      </td>
                      <td className="py-2.5 text-xs text-muted-foreground">
                        {pos.last_position_at
                          ? formatDateTimeMedium(pos.last_position_at)
                          : 'â€”'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="text-center py-10 text-muted-foreground">
              <MapPin className="h-8 w-8 mx-auto mb-2 opacity-30" />
              <p className="text-sm">No hay posiciones registradas aÃºn.</p>
              <Button
                variant="link"
                size="sm"
                className="mt-1"
                onClick={() => navigate('/vessels')}
              >
                Ir a gestiÃ³n de embarcaciones
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

    </div>
  )
}
