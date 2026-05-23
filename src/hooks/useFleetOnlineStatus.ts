/**
 * useFleetOnlineStatus
 *
 * Detecta en tiempo real qué embarcaciones están en línea usando
 * un ÚNICO canal WebSocket (private-fleet.tracking) — escalable sin
 * importar cuántas embarcaciones existan.
 *
 * Lógica:
 *   - Al montar: inicializa el estado desde last_position_at (HTTP)
 *   - ONLINE:  evento .tracking.created  → marca el vessel como en línea
 *   - OFFLINE: evento .device.went_offline → marca el vessel sin señal
 *
 * Sin polling. Sin timers. Solo eventos del servidor.
 */

import { useEffect, useRef, useState } from 'react'

const OFFLINE_THRESHOLD_MS = 3 * 60 * 1000 // 3 minutos (para inicialización HTTP)

interface VesselPosition {
    id: number
    last_position_at: string | null
}

interface UseFleetOnlineStatusReturn {
    /** true si el vessel recibió un tracking en los últimos 3 minutos (inicial) o el server no ha enviado offline */
    isOnline: (vesselId: number) => boolean
    /** true mientras la suscripción WebSocket está activa */
    isConnected: boolean
}

function getServerOrigin(): string {
    const apiUrl: string =
        import.meta.env.VITE_API_URL ?? import.meta.env.VITE_API_LOCAL ?? ''
    return apiUrl.replace(/\/api\/v\d+\/?$/, '').replace(/\/$/, '')
}

export function useFleetOnlineStatus(
    initialPositions: VesselPosition[] = [],
): UseFleetOnlineStatusReturn {
    // Set de vessel_ids actualmente en línea
    const [onlineIds, setOnlineIds] = useState<Set<number>>(new Set())
    const [isConnected, setIsConnected] = useState(false)

    // ── 1. Inicializar desde los datos HTTP ─────────────────────────────────
    const initializedRef = useRef(false)
    useEffect(() => {
        if (initializedRef.current || !initialPositions.length) return
        initializedRef.current = true

        const now = Date.now()
        const online = new Set<number>()

        for (const pos of initialPositions) {
            if (pos.last_position_at) {
                const ts = new Date(pos.last_position_at).getTime()
                if (now - ts < OFFLINE_THRESHOLD_MS) online.add(pos.id)
            }
        }

        setOnlineIds(online)
    }, [initialPositions])

    // ── 2. Suscripción WebSocket al canal de flota ──────────────────────────
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const echoRef = useRef<any>(null)

    useEffect(() => {
        const token = localStorage.getItem('access_token')
        if (!token) return

        let cancelled = false

        Promise.all([
            import('laravel-echo'),
            import('pusher-js'),
        ]).then(([echoMod, pusherMod]) => {
            if (cancelled) return

            ;(window as Window & { Pusher?: unknown }).Pusher = pusherMod.default

            const origin = getServerOrigin()

            const echo = new echoMod.default({
                broadcaster: 'reverb',
                key:      import.meta.env.VITE_REVERB_APP_KEY,
                wsHost:   import.meta.env.VITE_REVERB_HOST   ?? 'localhost',
                wsPort:   Number(import.meta.env.VITE_REVERB_PORT ?? 8080),
                wssPort:  Number(import.meta.env.VITE_REVERB_PORT ?? 443),
                forceTLS: (import.meta.env.VITE_REVERB_SCHEME ?? 'http') === 'https',
                enabledTransports: ['ws', 'wss'],
                authEndpoint: `${origin}/api/broadcasting/auth`,
                auth: {
                    headers: { Authorization: `Bearer ${token}` },
                },
            })

            echoRef.current = echo

            echo
                .private('fleet.tracking')
                // Dispositivo en línea: llegó un nuevo tracking
                .listen('.tracking.created', (payload: { vessel_id: number }) => {
                    setOnlineIds(prev => {
                        if (prev.has(payload.vessel_id)) return prev
                        const next = new Set(prev)
                        next.add(payload.vessel_id)
                        return next
                    })
                })
                // Dispositivo sin señal: el scheduler lo detectó y emite este evento
                .listen('.device.went_offline', (payload: { vessel_id: number }) => {
                    setOnlineIds(prev => {
                        if (!prev.has(payload.vessel_id)) return prev
                        const next = new Set(prev)
                        next.delete(payload.vessel_id)
                        return next
                    })
                })

            echo.connector?.pusher?.connection?.bind('connected', () => {
                if (!cancelled) setIsConnected(true)
            })
            echo.connector?.pusher?.connection?.bind('disconnected', () => {
                if (!cancelled) setIsConnected(false)
            })
        })

        return () => {
            cancelled = true
            if (echoRef.current) {
                echoRef.current.leave('fleet.tracking')
                echoRef.current.disconnect()
                echoRef.current = null
            }
            setIsConnected(false)
        }
    }, []) // eslint-disable-line react-hooks/exhaustive-deps

    return {
        isOnline: (vesselId: number) => onlineIds.has(vesselId),
        isConnected,
    }
}

