"use client"

import { RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar, Legend, ResponsiveContainer } from "recharts"

const data = [
    { subject: "Eficiencia", carguero: 80, petrolero: 90, pasajeros: 70 },
    { subject: "Velocidad", carguero: 65, petrolero: 60, pasajeros: 85 },
    { subject: "Capacidad", carguero: 90, petrolero: 85, pasajeros: 75 },
    { subject: "Consumo", carguero: 75, petrolero: 65, pasajeros: 80 },
    { subject: "Mantenimiento", carguero: 70, petrolero: 75, pasajeros: 85 },
    { subject: "Seguridad", carguero: 85, petrolero: 80, pasajeros: 90 },
]

interface VesselsPerformanceChartProps {
    height?: number
}

export function VesselsPerformanceChart({ height = 300 }: VesselsPerformanceChartProps) {
    return (
        <ResponsiveContainer width="100%" height={height}>
            <RadarChart cx="50%" cy="50%" outerRadius="80%" data={data}>
                <PolarGrid />
                <PolarAngleAxis dataKey="subject" />
                <PolarRadiusAxis angle={30} domain={[0, 100]} />
                <Radar name="Carguero" dataKey="carguero" stroke="#2563eb" fill="#2563eb" fillOpacity={0.2} />
                <Radar name="Petrolero" dataKey="petrolero" stroke="#0891b2" fill="#0891b2" fillOpacity={0.2} />
                <Radar name="Pasajeros" dataKey="pasajeros" stroke="#4f46e5" fill="#4f46e5" fillOpacity={0.2} />
                <Legend />
            </RadarChart>
        </ResponsiveContainer>
    )
}
