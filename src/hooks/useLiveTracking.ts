import { useState, useEffect, useRef, useCallback } from "react"

interface UseLiveTrackingOptions {
    /** Called on each live tick (including the first one when starting). */
    onTick: () => void
    /** Polling interval in milliseconds. Default: 15 000 (15 s). */
    intervalMs?: number
}

interface UseLiveTrackingReturn {
    isLive: boolean
    toggle: () => void
    /** Seconds remaining until next automatic refresh. 0 when not live. */
    countdown: number
}

export function useLiveTracking({
    onTick,
    intervalMs = 15_000,
}: UseLiveTrackingOptions): UseLiveTrackingReturn {
    const [isLive, setIsLive] = useState(false)
    const [countdown, setCountdown] = useState(0)

    // Keep a stable ref so interval closure never goes stale
    const onTickRef = useRef(onTick)
    useEffect(() => { onTickRef.current = onTick }, [onTick])

    const pollRef = useRef<ReturnType<typeof setInterval> | null>(null)
    const tickRef = useRef<ReturnType<typeof setInterval> | null>(null)

    const stop = useCallback(() => {
        if (pollRef.current) { clearInterval(pollRef.current); pollRef.current = null }
        if (tickRef.current) { clearInterval(tickRef.current); tickRef.current = null }
        setIsLive(false)
        setCountdown(0)
    }, [])

    const start = useCallback(() => {
        setIsLive(true)
        const secs = intervalMs / 1000
        setCountdown(secs)

        // Fire immediately on activation
        onTickRef.current()

        // Repeat every intervalMs
        pollRef.current = setInterval(() => {
            onTickRef.current()
            setCountdown(secs)
        }, intervalMs)

        // Countdown ticker (updates every second)
        tickRef.current = setInterval(() => {
            setCountdown(c => Math.max(0, c - 1))
        }, 1_000)
    }, [intervalMs])

    const toggle = useCallback(() => {
        if (isLive) stop(); else start()
    }, [isLive, start, stop])

    // Clean up on unmount
    useEffect(() => stop, [stop])

    return { isLive, toggle, countdown }
}
