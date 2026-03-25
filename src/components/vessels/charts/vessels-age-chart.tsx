"use client"

import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from "recharts"
import { Ship } from "lucide-react"
import type { FleetAging } from "@/types/models/dashboardStats"

const colors = ["#22c55e", "#10b981", "#0ea5e9", "#6366f1", "#8b5cf6", "#a855f7"]

interface VesselsAgeChartProps {
    data: FleetAging[]
    height?: number
    isLoading?: boolean
}

export function VesselsAgeChart({ data, height = 300, isLoading = false }: VesselsAgeChartProps) {
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
                    <Ship className="mx-auto h-8 w-8 mb-2" />
                    <p>No hay datos de antigüedad disponibles</p>
                </div>
            </div>
        )
    }

    // Transformar y colorear los datos
    const chartData = safeData.map((item, index) => ({
        name: item.age_group,
        value: item.count,
        color: colors[index % colors.length]
    }))

    return (
        <ResponsiveContainer width="100%" height={height}>
            <BarChart data={chartData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                <XAxis dataKey="name" axisLine={false} tickLine={false} />
                <YAxis axisLine={false} tickLine={false} />
                <Tooltip
                    content={({ active, payload }) => {
                        if (active && payload && payload.length) {
                            return (
                                <div className="rounded-lg border bg-background p-2 shadow-sm">
                                    <div className="flex items-center">
                                        <Ship className="mr-2 h-4 w-4" />
                                        <span className="font-medium">
                                            {payload[0].payload.name}: {payload[0].value} embarcaciones
                                        </span>
                                    </div>
                                </div>
                            )
                        }
                        return null
                    }}
                />
                <Bar dataKey="value" radius={[4, 4, 0, 0]}>
                    {chartData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                </Bar>
            </BarChart>
        </ResponsiveContainer>
    )
}
