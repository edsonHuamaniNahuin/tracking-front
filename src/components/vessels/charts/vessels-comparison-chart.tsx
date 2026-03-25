"use client"

import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts"

const data = [
    { name: "2018", carguero: 40, petrolero: 24, pasajeros: 35 },
    { name: "2019", carguero: 45, petrolero: 30, pasajeros: 38 },
    { name: "2020", carguero: 42, petrolero: 28, pasajeros: 32 },
    { name: "2021", carguero: 50, petrolero: 35, pasajeros: 40 },
    { name: "2022", carguero: 55, petrolero: 40, pasajeros: 45 },
    { name: "2023", carguero: 60, petrolero: 45, pasajeros: 50 },
    { name: "2024", carguero: 65, petrolero: 50, pasajeros: 55 },
]

interface VesselsComparisonChartProps {
    height?: number
}

export function VesselsComparisonChart({ height = 300 }: VesselsComparisonChartProps) {
    return (
        <ResponsiveContainer width="100%" height={height}>
            <AreaChart data={data} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                <XAxis dataKey="name" axisLine={false} tickLine={false} />
                <YAxis axisLine={false} tickLine={false} />
                <Tooltip
                    content={({ active, payload, label }) => {
                        if (active && payload && payload.length) {
                            return (
                                <div className="rounded-lg border bg-background p-2 shadow-sm">
                                    <div className="font-medium">{label}</div>
                                    {payload.map((entry, index) => (
                                        <div key={`item-${index}`} className="flex items-center text-sm">
                                            <span className="mr-2 h-3 w-3 rounded-full" style={{ backgroundColor: entry.color }} />
                                            <span>
                                                {entry.name}: {entry.value} unidades
                                            </span>
                                        </div>
                                    ))}
                                </div>
                            )
                        }
                        return null
                    }}
                />
                <Area type="monotone" dataKey="carguero" stackId="1" stroke="#2563eb" fill="#2563eb" fillOpacity={0.6} />
                <Area type="monotone" dataKey="petrolero" stackId="1" stroke="#0891b2" fill="#0891b2" fillOpacity={0.6} />
                <Area type="monotone" dataKey="pasajeros" stackId="1" stroke="#4f46e5" fill="#4f46e5" fillOpacity={0.6} />
            </AreaChart>
        </ResponsiveContainer>
    )
}
