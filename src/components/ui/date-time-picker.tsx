"use client"

import { useRef, useEffect, useState } from "react"
import { format } from "date-fns"
import { es } from "date-fns/locale"
import { CalendarIcon } from "lucide-react"
import { Calendar } from "@/components/ui/calendar"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Button } from "@/components/ui/button"
import { ScrollArea } from "@/components/ui/scroll-area"
import { cn } from "@/lib/utils"

interface DateTimePickerProps {
    value: Date
    onChange: (date: Date) => void
    disabled?: (date: Date) => boolean
    className?: string
}

export function DateTimePicker({ value, onChange, disabled, className }: DateTimePickerProps) {
    const [open, setOpen] = useState(false)

    const hours = Array.from({ length: 24 }, (_, i) => i)
    const minutes = Array.from({ length: 60 }, (_, i) => i)

    const selectedHour = value.getHours()
    const selectedMinute = value.getMinutes()

    const hourRefs = useRef<(HTMLButtonElement | null)[]>([])
    const minuteRefs = useRef<(HTMLButtonElement | null)[]>([])

    // Scroll to selected values when popover opens
    useEffect(() => {
        if (!open) return
        const t = setTimeout(() => {
            hourRefs.current[selectedHour]?.scrollIntoView({ block: "center" })
            minuteRefs.current[selectedMinute]?.scrollIntoView({ block: "center" })
        }, 50)
        return () => clearTimeout(t)
    }, [open, selectedHour, selectedMinute])

    const setHour = (h: number) => {
        const next = new Date(value)
        next.setHours(h)
        onChange(next)
    }

    const setMinute = (m: number) => {
        const next = new Date(value)
        next.setMinutes(m)
        onChange(next)
    }

    const handleDaySelect = (day: Date | undefined) => {
        if (!day) return
        const next = new Date(day)
        next.setHours(selectedHour, selectedMinute, 0, 0)
        onChange(next)
    }

    return (
        <Popover open={open} onOpenChange={setOpen}>
            <PopoverTrigger asChild>
                <Button
                    variant="outline"
                    className={cn("h-8 text-xs font-normal justify-start", className)}
                >
                    <CalendarIcon className="mr-1.5 h-3 w-3 text-muted-foreground shrink-0" />
                    {format(value, "dd MMM yyyy, HH:mm", { locale: es })}
                </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0" align="start">
                <Calendar
                    mode="single"
                    selected={value}
                    onSelect={handleDaySelect}
                    disabled={disabled}
                    initialFocus
                    locale={es}
                />
                {/* Separador */}
                <div className="border-t px-3 py-2">
                    <p className="text-xs text-muted-foreground mb-2">Hora</p>
                    <div className="flex gap-2">
                        {/* Horas */}
                        <ScrollArea className="h-36 w-14 rounded border">
                            <div className="flex flex-col p-1 gap-0.5">
                                {hours.map(h => (
                                    <button
                                        key={h}
                                        ref={el => { hourRefs.current[h] = el }}
                                        onClick={() => setHour(h)}
                                        className={cn(
                                            "rounded px-2 py-1 text-xs text-center hover:bg-accent hover:text-accent-foreground transition-colors",
                                            h === selectedHour && "bg-primary text-primary-foreground"
                                        )}
                                    >
                                        {String(h).padStart(2, "0")}
                                    </button>
                                ))}
                            </div>
                        </ScrollArea>
                        <div className="flex items-center text-muted-foreground text-sm">:</div>
                        {/* Minutos */}
                        <ScrollArea className="h-36 w-14 rounded border">
                            <div className="flex flex-col p-1 gap-0.5">
                                {minutes.map(m => (
                                    <button
                                        key={m}
                                        ref={el => { minuteRefs.current[m] = el }}
                                        onClick={() => setMinute(m)}
                                        className={cn(
                                            "rounded px-2 py-1 text-xs text-center hover:bg-accent hover:text-accent-foreground transition-colors",
                                            m === selectedMinute && "bg-primary text-primary-foreground"
                                        )}
                                    >
                                        {String(m).padStart(2, "0")}
                                    </button>
                                ))}
                            </div>
                        </ScrollArea>
                    </div>
                </div>
            </PopoverContent>
        </Popover>
    )
}
