"use client"

import { Button } from "@/components/ui/button"
import { ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight } from "lucide-react"

interface PaginationControlsProps {
    currentPage: number
    totalPages: number
    totalItems: number
    from: number
    to: number
    onPageChange: (page: number) => void
    isLoading: boolean
}

export function PaginationControls({
    currentPage,
    totalPages,
    totalItems,
    from,
    to,
    onPageChange,
    isLoading,
}: PaginationControlsProps) {
    const getPageNumbers = () => {
        const pages: number[] = []
        const maxVisible = 5

        if (totalPages <= maxVisible) {
            for (let i = 1; i <= totalPages; i++) {
                pages.push(i)
            }
        } else {
            let start = Math.max(1, currentPage - 2)
            const end = Math.min(totalPages, start + maxVisible - 1)

            if (end - start < maxVisible - 1) {
                start = Math.max(1, end - maxVisible + 1)
            }
            for (let i = start; i <= end; i++) {
                pages.push(i)
            }
        }

        return pages
    }

    if (totalPages <= 1) return null

    return (
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
            <p className="text-sm text-muted-foreground">
                Mostrando {from} a {to} de {totalItems} resultados
            </p>

            <div className="flex items-center space-x-2">
                {/* Primera página */}
                <Button
                    variant="outline"
                    size="sm"
                    onClick={() => onPageChange(1)}
                    disabled={currentPage === 1 || isLoading}
                    className="hidden sm:flex"
                >
                    <ChevronsLeft className="h-4 w-4" />
                </Button>

                {/* Página anterior */}
                <Button
                    variant="outline"
                    size="sm"
                    onClick={() => onPageChange(currentPage - 1)}
                    disabled={currentPage === 1 || isLoading}
                >
                    <ChevronLeft className="h-4 w-4 mr-1" />
                    Anterior
                </Button>

                {/* Números de página */}
                <div className="flex items-center space-x-1">
                    {getPageNumbers().map((page) => (
                        <Button
                            key={page}
                            variant={currentPage === page ? "default" : "outline"}
                            size="sm"
                            onClick={() => {
                                if (page !== currentPage && !isLoading) {
                                    onPageChange(page)
                                }
                            }}
                            disabled={isLoading}
                            className="w-10"
                        >
                            {page}
                        </Button>
                    ))}
                </div>

                {/* Página siguiente */}
                <Button
                    variant="outline"
                    size="sm"
                    onClick={() => onPageChange(currentPage + 1)}
                    disabled={currentPage === totalPages || isLoading}
                >
                    Siguiente
                    <ChevronRight className="h-4 w-4 ml-1" />
                </Button>

                {/* Última página */}
                <Button
                    variant="outline"
                    size="sm"
                    onClick={() => onPageChange(totalPages)}
                    disabled={currentPage === totalPages || isLoading}
                    className="hidden sm:flex"
                >
                    <ChevronsRight className="h-4 w-4" />
                </Button>
            </div>
        </div>
    )
}
