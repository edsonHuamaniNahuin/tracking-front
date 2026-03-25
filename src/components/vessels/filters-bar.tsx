"use client"

import { useState, useEffect } from "react"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Search } from "lucide-react"
import { ITEMS_PER_PAGE_OPTIONS } from "@/utils/statics"

interface FiltersBarProps {
    /** Valores actuales de los filtros */
    nameFilter: string
    onNameFilterChange: (value: string) => void
    imoFilter: string
    onImoFilterChange: (value: string) => void

    itemsPerPage: number
    onItemsPerPageChange: (value: number) => void
}

/**
 * Este componente ahora muestra:
 * - Un input para “Buscar por nombre”
 * - Un input para “Buscar por IMO”
 * - Un selector “Ítems por página”
 *
 * Aplica debounce a cada input de texto para evitar llamar al padre en cada pulsación.
 */
export function FiltersBar({
    nameFilter,
    onNameFilterChange,
    imoFilter,
    onImoFilterChange,
    itemsPerPage,
    onItemsPerPageChange,
}: FiltersBarProps) {
    // Estados locales para debounce de cada campo:
    const [localName, setLocalName] = useState(nameFilter)
    const [localImo, setLocalImo] = useState(imoFilter)

    // Cuando cambie `localName`, después de 500 ms llamamos a onNameFilterChange()
    useEffect(() => {
        const timer = setTimeout(() => {
            onNameFilterChange(localName.trim())
        }, 500)

        return () => clearTimeout(timer)
    }, [localName])

    // Cuando cambie `localImo`, después de 500 ms llamamos a onImoFilterChange()
    useEffect(() => {
        const timer = setTimeout(() => {
            onImoFilterChange(localImo.trim())
        }, 500)

        return () => clearTimeout(timer)
    }, [localImo])

    return (
        <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-end justify-between">
            {/* INPUT para filtrar por name */}
            <div className="relative flex-1 max-w-xs">
                <Input
                    placeholder="Buscar por nombre"
                    value={localName}
                    onChange={(e) => setLocalName(e.target.value)}
                    className="pl-10"
                />
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
            </div>

            {/* INPUT para filtrar por IMO */}
            <div className="relative flex-1 max-w-xs">
                <Input
                    placeholder="Buscar por IMO"
                    value={localImo}
                    onChange={(e) => setLocalImo(e.target.value)}
                    className="pl-10"
                />
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
            </div>

            {/* SELECT para items per page */}
            <div className="flex items-center space-x-2">
                <span className="text-sm text-muted-foreground whitespace-nowrap">Ítems por página:</span>
                <Select
                    value={itemsPerPage.toString()}
                    onValueChange={(value) => onItemsPerPageChange(Number(value))}
                >
                    <SelectTrigger className="w-20">
                        <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                        {ITEMS_PER_PAGE_OPTIONS.map((opt) => (
                            <SelectItem key={opt} value={opt.toString()}>
                                {opt}
                            </SelectItem>
                        ))}
                    </SelectContent>
                </Select>
            </div>
        </div>
    )
}
