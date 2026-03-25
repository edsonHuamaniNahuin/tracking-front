"use client"

import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip } from "recharts"
import { Ship, Anchor, AlertTriangle, CheckCircle } from "lucide-react"
import type { VesselsByStatus } from "@/types/models/dashboardStats"

const statusConfig = {
    "Activa": { color: "#22c55e", icon: CheckCircle },
    "En Mantenimiento": { color: "#f59e0b", icon: Anchor },
    "Inactiva": { color: "#64748b", icon: Ship },
    "Con Alertas": { color: "#ef4444", icon: AlertTriangle },
}

const RADIAN = Math.PI / 180
const renderCustomizedLabel = ({ cx, cy, midAngle, innerRadius, outerRadius, percent }: {
    cx: number; cy: number; midAngle: number; innerRadius: number; outerRadius: number; percent: number;
}) => {
    const radius = innerRadius + (outerRadius - innerRadius) * 0.5
    const x = cx + radius * Math.cos(-midAngle * RADIAN)
    const y = cy + radius * Math.sin(-midAngle * RADIAN)

    return (
        <text
            x={x}
            y={y}
            fill="white"
            textAnchor={x > cx ? "start" : "end"}
            dominantBaseline="central"
            className="text-xs font-medium"
        >
            {`${(percent * 100).toFixed(0)}%`}
        </text>
    )
}

interface VesselsStatusChartProps {
    data: VesselsByStatus[]
    height?: number
    isLoading?: boolean
}

export function VesselsStatusChart({ data, height = 300, isLoading = false }: VesselsStatusChartProps) {
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
                    <p>No hay datos de estado disponibles</p>
                </div>
            </div>
        )
    }

    // Transformar los datos con configuración de colores e iconos
    const chartData = safeData.map((item) => ({
        name: item.status,
        value: item.count,
        color: statusConfig[item.status as keyof typeof statusConfig]?.color || "#64748b",
        icon: statusConfig[item.status as keyof typeof statusConfig]?.icon || Ship,
    }))

    return (
        <ResponsiveContainer width="100%" height={height}>
            <PieChart>
                <Pie
                    data={chartData}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={renderCustomizedLabel}
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="value"
                >
                    {chartData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                </Pie>
                <Tooltip
                    content={({ active, payload }) => {
                        if (active && payload && payload.length) {
                            const data = payload[0].payload
                            const Icon = data.icon
                            return (
                                <div className="rounded-lg border bg-background p-2 shadow-sm">
                                    <div className="flex items-center">
                                        <Icon className="mr-2 h-4 w-4" style={{ color: data.color }} />
                                        <span className="font-medium">
                                            {data.name}: {data.value}
                                        </span>
                                    </div>
                                </div>
                            )
                        }
                        return null
                    }}
                />
                <Legend
                    layout="vertical"
                    verticalAlign="middle"
                    align="right"
                    content={({ payload }) => (
                        <ul className="flex flex-col space-y-2">
                            {payload?.map((entry, index) => {
                                const Icon = chartData[index]?.icon || Ship
                                return (
                                    <li key={`item-${index}`} className="flex items-center">
                                        <Icon className="mr-2 h-4 w-4" style={{ color: entry.color }} />
                                        <span className="text-sm">
                                            {entry.value}: {chartData[index]?.value}
                                        </span>
                                    </li>
                                )
                            })}
                        </ul>
                    )}
                />
            </PieChart>
        </ResponsiveContainer>
    )
}
