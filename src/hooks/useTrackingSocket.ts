/**
 * useTrackingSocket
 *
 * Suscribe al canal privado de Reverb (Laravel Echo) para recibir en
 * tiempo real los nuevos registros de posición GPS de una embarcación.
 *
 * Canal: private-vessel.{vesselId}.tracking
 * Evento (broadcastAs): tracking.created
 *
 * Sólo se conecta cuando `enabled=true` y hay un `vesselId` válido.
 * Se desconecta automáticamente al desactivarse o al desmontar.
 */

import { useEffect, useRef, useState } from 'react'
import type { Tracking } from '@/types/tracking'

interface UseTrackingSocketOptions {
    vesselId: number | null
    enabled: boolean
    onNewTracking: (tracking: Partial<Tracking>) => void
}

interface UseTrackingSocketReturn {
    /** true mientras la conexión Echo está establecida y autenticada */
    isConnected: boolean
}

/**
 * Deriva la URL base del servidor (sin /api/v1) para llegar a /broadcasting/auth.
 * Ejemplos:
 *   "http://127.0.0.1:8001/api/v1" → "http://127.0.0.1:8001"
 *   "https://api.example.com/api/v1" → "https://api.example.com"
 */
function getServerOrigin(): string {
    const apiUrl: string =
        import.meta.env.VITE_API_URL ?? import.meta.env.VITE_API_LOCAL ?? ''
    // Quitar "/api/v1" (u otras rutas) del final
    return apiUrl.replace(/\/api\/v\d+\/?$/, '').replace(/\/$/, '')
}

export function useTrackingSocket({
    vesselId,
    enabled,
    onNewTracking,
}: UseTrackingSocketOptions): UseTrackingSocketReturn {
    const [isConnected, setIsConnected] = useState(false)

    // Ref estable para que el listener de Echo no capture onNewTracking stale
    const onNewTrackingRef = useRef(onNewTracking)
    useEffect(() => { onNewTrackingRef.current = onNewTracking }, [onNewTracking])

    // Instancia Echo activa (se guarda para hacer leave/disconnect en cleanup)
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const echoRef = useRef<any>(null)
    const channelRef = useRef<string | null>(null)

    useEffect(() => {
        if (!enabled || !vesselId) return

        const token = localStorage.getItem('access_token')
        if (!token) return

        let cancelled = false

        // Carga dinámica para no añadir peso al bundle principal
        Promise.all([
            import('laravel-echo'),
            import('pusher-js'),
        ]).then(([echoMod, pusherMod]) => {
            if (cancelled) return

            // pusher-js necesita estar en window para que Echo lo use
            ;(window as Window & { Pusher?: unknown }).Pusher = pusherMod.default

            const origin = getServerOrigin()

            const echo = new echoMod.default({
                broadcaster: 'reverb',
                key:      import.meta.env.VITE_REVERB_APP_KEY,
                wsHost:   import.meta.env.VITE_REVERB_HOST   ?? 'localhost',
                wsPort:   Number(import.meta.env.VITE_REVERB_PORT   ?? 8080),
                wssPort:  Number(import.meta.env.VITE_REVERB_PORT   ?? 443),
                forceTLS: (import.meta.env.VITE_REVERB_SCHEME ?? 'http') === 'https',
                enabledTransports: ['ws', 'wss'],
                // Endpoint para autorizar el canal privado (usa JWT Bearer).
                // Registrado en routes/api.php como /api/broadcasting/auth
                // (con guard auth:api, fuera del prefijo /v1).
                authEndpoint: `${origin}/api/broadcasting/auth`,
                auth: {
                    headers: { Authorization: `Bearer ${token}` },
                },
            })

            echoRef.current  = echo
            const channelName = `vessel.${vesselId}.tracking`
            channelRef.current = channelName

            echo
                .private(channelName)
                .listen('.tracking.created', (data: Partial<Tracking>) => {
                    if (!cancelled) onNewTrackingRef.current(data)
                })

            // Detectar conexión establecida a través del conector subyacente
            // Pusher/Reverb expone el estado de conexión en el socket
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            const connector = (echo as any).connector
            if (connector?.pusher) {
                connector.pusher.connection.bind('connected', () => {
                    if (!cancelled) setIsConnected(true)
                })
                connector.pusher.connection.bind('disconnected', () => {
                    if (!cancelled) setIsConnected(false)
                })
                connector.pusher.connection.bind('error', () => {
                    if (!cancelled) setIsConnected(false)
                })
            }
        }).catch(() => {
            // Fallo silencioso — el usuario puede seguir usando la app sin WS
            setIsConnected(false)
        })

        return () => {
            cancelled = true
            if (echoRef.current && channelRef.current) {
                echoRef.current.leave(channelRef.current)
            }
            echoRef.current?.disconnect()
            echoRef.current  = null
            channelRef.current = null
            setIsConnected(false)
        }
    // Se reconecta solo cuando cambia vesselId, enabled o el token
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [enabled, vesselId])

    return { isConnected }
}
