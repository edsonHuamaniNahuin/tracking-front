"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Ship, Activity, AlertTriangle, Users, Wrench, TrendingUp } from "lucide-react"
import type { MainMetrics } from "@/types/models/dashboardStats"

interface VesselsStatsCardsProps {
    metrics: MainMetrics;
    isLoading?: boolean;
}

export function VesselsStatsCards({ metrics, isLoading = false }: VesselsStatsCardsProps) {
    if (isLoading) {
        return (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
                {Array.from({ length: 6 }).map((_, i) => (
                    <Card key={i}>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">
                                <div className="h-4 bg-gray-200 rounded animate-pulse" />
                            </CardTitle>
                            <div className="h-4 w-4 bg-gray-200 rounded animate-pulse" />
                        </CardHeader>
                        <CardContent>
                            <div className="h-8 bg-gray-200 rounded animate-pulse mb-1" />
                            <div className="h-3 bg-gray-200 rounded animate-pulse w-2/3" />
                        </CardContent>
                    </Card>
                ))}
            </div>
        )
    }

    const statsConfig = [
        {
            title: "Total Unidades",
            value: metrics.total_vessels,
            description: "Flota total",
            icon: Ship,
            color: "text-blue-600"
        },
        {
            title: "Unidades Activas",
            value: metrics.active_vessels,
            description: "En operación",
            icon: Activity,
            color: "text-green-600"
        },
        {
            title: "Con Alertas",
            value: metrics.vessels_with_alerts,
            description: "Requieren atención",
            icon: AlertTriangle,
            color: "text-red-600"
        },
        {
            title: "En Mantenimiento",
            value: metrics.maintenance_vessels,
            description: "Fuera de servicio",
            icon: Wrench,
            color: "text-orange-600"
        },
        {
            title: "Total Usuarios",
            value: metrics.total_users,
            description: "Usuarios activos",
            icon: Users,
            color: "text-purple-600"
        },
        {
            title: "Total Seguimientos",
            value: metrics.total_trackings,
            description: "Datos de tracking",
            icon: TrendingUp,
            color: "text-indigo-600"
        }
    ]

    return (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
            {statsConfig.map((stat, index) => {
                const Icon = stat.icon
                return (
                    <Card key={index}>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">
                                {stat.title}
                            </CardTitle>
                            <Icon className={`h-4 w-4 ${stat.color}`} />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold">{stat.value.toLocaleString()}</div>
                            <p className="text-xs text-muted-foreground">
                                {stat.description}
                            </p>
                        </CardContent>
                    </Card>
                )
            })}
        </div>
    )
}
