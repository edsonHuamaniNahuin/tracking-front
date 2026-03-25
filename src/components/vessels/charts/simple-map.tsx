"use client"

import { useEffect, useState, useRef } from "react"
import type { VesselPosition } from "@/types/models/dashboardStats"

interface SimpleMapProps {
    data: VesselPosition[]
    height?: number
}

export function SimpleMap({ data, height = 400 }: SimpleMapProps) {
    const [isClient, setIsClient] = useState(false)
    const mapRef = useRef<HTMLDivElement>(null)

    useEffect(() => {
        setIsClient(true)
    }, [])

    useEffect(() => {
        if (!isClient || !mapRef.current) return

        const initMap = async () => {
            try {
                const L = (await import("leaflet")).default

                // Configurar iconos por defecto
                L.Icon.Default.mergeOptions({
                    iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
                    iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
                    shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
                })

                // Crear mapa simple
                const map = L.map(mapRef.current!)

                // Agregar tiles
                L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
                    attribution: '© OpenStreetMap contributors'
                }).addTo(map)

                // Agregar marcadores usando iconos estándar
                const validData = data.filter(vessel => {
                    const lat = parseFloat(vessel.latitude)
                    const lng = parseFloat(vessel.longitude)
                    return !isNaN(lat) && !isNaN(lng) && lat >= -90 && lat <= 90 && lng >= -180 && lng <= 180
                })

                console.log('Marcadores válidos:', validData.length)

                if (validData.length > 0) {
                    const markers = validData.map(vessel => {
                        const lat = parseFloat(vessel.latitude)
                        const lng = parseFloat(vessel.longitude)

                        return L.marker([lat, lng])
                            .bindPopup(`
                                <div>
                                    <h3><strong>${vessel.name}</strong></h3>
                                    <p>Tipo: ${vessel.type}</p>
                                    <p>Estado: ${vessel.status}</p>
                                    <p>IMO: ${vessel.imo}</p>
                                </div>
                            `)
                            .addTo(map)
                    })

                    // Ajustar vista
                    const group = L.featureGroup(markers)
                    map.fitBounds(group.getBounds().pad(0.1))
                } else {
                    // Vista por defecto
                    map.setView([20.0, -75.0], 6)
                }

                // Forzar tamaño
                setTimeout(() => map.invalidateSize(), 100)

            } catch (error) {
                console.error('Error en mapa simple:', error)
            }
        }

        initMap()
    }, [isClient, data])

    if (!isClient) {
        return <div style={{ height }} className="bg-gray-100 rounded flex items-center justify-center">Cargando mapa...</div>
    }

    return (
        <div style={{ height }} className="relative rounded-lg overflow-hidden border">
            <div ref={mapRef} className="w-full h-full" />
        </div>
    )
}
