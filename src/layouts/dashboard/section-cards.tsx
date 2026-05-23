import { TrendingUpIcon, Ship, MapPin, Activity, Users, AlertTriangle } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Card, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import type { MainMetrics } from "@/types/models/dashboardStats"

function Skeleton() {
  return <div className="h-7 w-24 bg-muted animate-pulse rounded" />
}

interface SectionCardsProps {
  metrics?: MainMetrics | null
}

export function SectionCards({ metrics = null }: SectionCardsProps) {

  const activeRate = metrics
    ? Math.round((metrics.active_vessels / Math.max(metrics.total_vessels, 1)) * 100)
    : null

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4 *:data-[slot=card]:shadow-xs *:data-[slot=card]:bg-gradient-to-t *:data-[slot=card]:from-primary/5 *:data-[slot=card]:to-card dark:*:data-[slot=card]:bg-card">

      {/* Total Unidades */}
      <Card className="@container/card">
        <CardHeader className="flex-row items-start justify-between gap-2 space-y-0">
          <div className="space-y-1.5">
            <CardDescription className="flex items-center gap-1.5">
              <Ship className="h-3.5 w-3.5" /> Total Unidades
            </CardDescription>
            <CardTitle className="@[250px]/card:text-3xl text-2xl font-semibold tabular-nums">
              {metrics ? metrics.total_vessels : <Skeleton />}
            </CardTitle>
          </div>
          {activeRate !== null && (
            <Badge variant="outline" className="flex gap-1 rounded-lg text-xs whitespace-nowrap shrink-0">
              <TrendingUpIcon className="size-3" />
              {activeRate}% activas
            </Badge>
          )}
        </CardHeader>
        <CardFooter className="flex-col items-start gap-1 text-sm">
          <div className="line-clamp-1 flex gap-2 font-medium">
            {metrics ? `${metrics.active_vessels} en operación` : "Cargando..."}
            <Ship className="size-4" />
          </div>
          <div className="text-muted-foreground">Flota registrada en el sistema</div>
        </CardFooter>
      </Card>

      {/* Puntos de Tracking */}
      <Card className="@container/card">
        <CardHeader className="flex-row items-start justify-between gap-2 space-y-0">
          <div className="space-y-1.5">
            <CardDescription className="flex items-center gap-1.5">
              <MapPin className="h-3.5 w-3.5" /> Puntos de Tracking
            </CardDescription>
            <CardTitle className="@[250px]/card:text-3xl text-2xl font-semibold tabular-nums">
              {metrics ? metrics.total_trackings.toLocaleString('es-ES') : <Skeleton />}
            </CardTitle>
          </div>
          <Badge variant="outline" className="flex gap-1 rounded-lg text-xs whitespace-nowrap shrink-0">
            <Activity className="size-3" />
            Activo
          </Badge>
        </CardHeader>
        <CardFooter className="flex-col items-start gap-1 text-sm">
          <div className="line-clamp-1 flex gap-2 font-medium">
            Registro de posiciones GPS <MapPin className="size-4" />
          </div>
          <div className="text-muted-foreground">Total histórico acumulado</div>
        </CardFooter>
      </Card>

      {/* Unidades Activas */}
      <Card className="@container/card">
        <CardHeader className="flex-row items-start justify-between gap-2 space-y-0">
          <div className="space-y-1.5">
            <CardDescription className="flex items-center gap-1.5">
              <Activity className="h-3.5 w-3.5" /> Unidades Activas
            </CardDescription>
            <CardTitle className="@[250px]/card:text-3xl text-2xl font-semibold tabular-nums">
              {metrics ? metrics.active_vessels : <Skeleton />}
            </CardTitle>
          </div>
          <Badge variant="outline" className="flex gap-1 rounded-lg text-xs whitespace-nowrap shrink-0 text-emerald-600 border-emerald-300">
            <TrendingUpIcon className="size-3" /> Operativas
          </Badge>
        </CardHeader>
        <CardFooter className="flex-col items-start gap-1 text-sm">
          <div className="line-clamp-1 flex gap-2 font-medium">
            {metrics && metrics.maintenance_vessels > 0
              ? `${metrics.maintenance_vessels} en mantenimiento`
              : "Flota en buen estado"}
            <Activity className="size-4" />
          </div>
          <div className="text-muted-foreground">Estado operativo de la flota</div>
        </CardFooter>
      </Card>

      {/* Usuarios */}
      <Card className="@container/card">
        <CardHeader className="flex-row items-start justify-between gap-2 space-y-0">
          <div className="space-y-1.5">
            <CardDescription className="flex items-center gap-1.5">
              <Users className="h-3.5 w-3.5" /> Usuarios del sistema
            </CardDescription>
            <CardTitle className="@[250px]/card:text-3xl text-2xl font-semibold tabular-nums">
              {metrics ? metrics.total_users : <Skeleton />}
            </CardTitle>
          </div>
          {metrics && metrics.vessels_with_alerts > 0 ? (
            <Badge variant="outline" className="flex gap-1 rounded-lg text-xs whitespace-nowrap shrink-0 text-amber-600 border-amber-300">
              <AlertTriangle className="size-3" /> {metrics.vessels_with_alerts} alertas
            </Badge>
          ) : (
            <Badge variant="outline" className="flex gap-1 rounded-lg text-xs whitespace-nowrap shrink-0">
              <TrendingUpIcon className="size-3" /> Sin alertas
            </Badge>
          )}
        </CardHeader>
        <CardFooter className="flex-col items-start gap-1 text-sm">
          <div className="line-clamp-1 flex gap-2 font-medium">
            {metrics && metrics.vessels_with_alerts > 0
              ? `${metrics.vessels_with_alerts} unidades con alertas`
              : "Sin incidencias activas"}
            <Users className="size-4" />
          </div>
          <div className="text-muted-foreground">Monitorizando la flota completa</div>
        </CardFooter>
      </Card>

    </div>
  )
}
