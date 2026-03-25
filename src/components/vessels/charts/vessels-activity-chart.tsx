"use client"

import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from "recharts"
import { TrendingUp } from "lucide-react"
import type { MonthlyActivity } from "@/types/models/dashboardStats"

interface VesselsActivityChartProps {
    data: MonthlyActivity[]
    height?: number
    isLoading?: boolean
}

export function VesselsActivityChart({ data, height = 300, isLoading = false }: VesselsActivityChartProps) {
    if (isLoading) {
        return (
            <div className="flex items-center justify-center" style={{ height }}>
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
            </div>
        )
    }

    // Validar que data sea un array válido
    const safeData = Array.isArray(data) ? data : []

    // Si no hay datos, mostrar mensaje
    if (safeData.length === 0) {
        return (
            <div className="flex items-center justify-center" style={{ height }}>
                <div className="text-center text-sm text-muted-foreground">
                    <TrendingUp className="mx-auto h-8 w-8 mb-2" />
                    <p>No hay datos de actividad disponibles</p>
                </div>
            </div>
        )
    }

    // Transformar los datos para el gráfico
    const chartData = safeData.map((item) => ({
        name: item.month_name.split(' ')[0], // Solo el nombre del mes
        trackings: item.trackings,
        fullName: item.month_name
    }))

    return (
        <ResponsiveContainer width="100%" height={height}>
            <LineChart data={chartData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                <XAxis dataKey="name" axisLine={false} tickLine={false} />
                <YAxis axisLine={false} tickLine={false} />
                <Tooltip
                    content={({ active, payload }) => {
                        if (active && payload && payload.length) {
                            const data = payload[0].payload
                            return (
                                <div className="rounded-lg border bg-background p-2 shadow-sm">
                                    <div className="font-medium">{data.fullName}</div>
                                    <div className="text-sm">
                                        Seguimientos: {payload[0].value}
                                    </div>
                                </div>
                            )
                        }
                        return null
                    }}
                />
                <Legend
                    formatter={() => <span className="text-sm capitalize">Seguimientos</span>}
                    iconType="circle"
                    iconSize={8}
                />
                <Line
                    type="monotone"
                    dataKey="trackings"
                    stroke="#2563eb"
                    strokeWidth={2}
                    dot={{ r: 4 }}
                    activeDot={{ r: 6, strokeWidth: 0 }}
                />
            </LineChart>
        </ResponsiveContainer>
    )
}
