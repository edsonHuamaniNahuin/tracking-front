"use client"

import { useEffect, useState, useRef } from "react"

interface SimpleLeafletTestProps {
    height?: number
}

export function SimpleLeafletTest({ height = 400 }: SimpleLeafletTestProps) {
    const [isClient, setIsClient] = useState(false)
    const [mapStatus, setMapStatus] = useState<string>("Inicializando...")
    const mapRef = useRef<HTMLDivElement>(null)

    useEffect(() => {
        setIsClient(true)
    }, [])

    useEffect(() => {
        if (!isClient || !mapRef.current) return

        const initMap = async () => {
            try {
                setMapStatus("Cargando Leaflet...")
                const L = (await import("leaflet")).default

                setMapStatus("Configurando iconos...")
                // Configurar iconos por defecto de Leaflet
                L.Icon.Default.mergeOptions({
                    iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
                    iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
                    shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
                })

                setMapStatus("Creando mapa...")
                // Crear mapa centrado en el Caribe
                const map = L.map(mapRef.current!).setView([20.0, -75.0], 6)

                setMapStatus("Agregando tiles...")
                // Agregar capas de tiles
                const osmLayer = L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
                    attribution: '© OpenStreetMap contributors'
                })
                osmLayer.addTo(map)

                setMapStatus("Agregando marcadores de prueba...")
                // Agregar algunos marcadores de prueba
                const testMarkers = [
                    { lat: 23.5, lng: -78.2, name: "Prueba 1" },
                    { lat: 19.8, lng: -75.5, name: "Prueba 2" },
                    { lat: 21.3, lng: -80.1, name: "Prueba 3" }
                ]

                testMarkers.forEach((marker) => {
                    L.marker([marker.lat, marker.lng])
                        .addTo(map)
                        .bindPopup(`<b>${marker.name}</b><br>Coordenadas: ${marker.lat}, ${marker.lng}`)
                })

                setMapStatus("✅ Mapa cargado correctamente!")
            } catch (error) {
                console.error('Error initializing test map:', error)
                setMapStatus(`❌ Error: ${error instanceof Error ? error.message : 'Error desconocido'}`)
            }
        }

        initMap()
    }, [isClient])

    // Solo renderizar en el cliente
    if (!isClient) {
        return (
            <div className="flex items-center justify-center" style={{ height }}>
                <div className="animate-pulse">
                    <div className="h-8 w-8 bg-gray-300 rounded"></div>
                </div>
            </div>
        )
    }

    return (
        <div style={{ height }} className="relative rounded-lg overflow-hidden border">
            <div ref={mapRef} className="w-full h-full" />
            <div className="absolute top-4 left-4 bg-white/90 backdrop-blur-sm p-2 rounded text-sm">
                {mapStatus}
            </div>
        </div>
    )
}
