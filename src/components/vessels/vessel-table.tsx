"use client"

import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { DEFAULT_LOADING_ROWS } from "@/utils/statics"
import { Eye, Edit, Trash2 } from "lucide-react"
import { formatDate as formatDateUtil } from "@/utils/date"

import type { Vessel } from "@/types/models/vessel"

interface VesselTableProps {
    vessels: Vessel[]
    onView: (vessel: Vessel) => void
    onEdit: (vessel: Vessel) => void
    onDelete: (vessel: Vessel) => void
    isLoading?: boolean
    loadingRowsCount?: number
}

export function VesselTable({ vessels, onView, onEdit, onDelete, isLoading, loadingRowsCount = DEFAULT_LOADING_ROWS }: VesselTableProps) {
    const formatDate = (dateString: string) => {
        return formatDateUtil(dateString, {
            day: "2-digit",
            month: "2-digit",
            year: "numeric",
        })
    }

    if (isLoading) {
        return (
            <div className="rounded-md border overflow-x-auto">
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead className="w-12">
                                <Checkbox />
                            </TableHead>
                            <TableHead>ID</TableHead>
                            <TableHead>Nombre</TableHead>
                            <TableHead>IMO</TableHead>
                            <TableHead>Fecha Creación</TableHead>
                            <TableHead>Fecha Actualización</TableHead>
                            <TableHead className="text-right">Acciones</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {[...Array(loadingRowsCount)].map((_, index) => (
                            <TableRow key={index}>
                                <TableCell>
                                    <div className="h-4 w-4 bg-muted animate-pulse rounded" />
                                </TableCell>
                                <TableCell>
                                    <div className="h-4 w-12 bg-muted animate-pulse rounded" />
                                </TableCell>
                                <TableCell>
                                    <div className="h-4 w-32 bg-muted animate-pulse rounded" />
                                </TableCell>
                                <TableCell>
                                    <div className="h-4 w-20 bg-muted animate-pulse rounded" />
                                </TableCell>
                                <TableCell>
                                    <div className="h-4 w-20 bg-muted animate-pulse rounded" />
                                </TableCell>
                                <TableCell>
                                    <div className="h-4 w-20 bg-muted animate-pulse rounded" />
                                </TableCell>
                                <TableCell>
                                    <div className="flex justify-end space-x-2">
                                        <div className="h-8 w-8 bg-muted animate-pulse rounded" />
                                        <div className="h-8 w-8 bg-muted animate-pulse rounded" />
                                        <div className="h-8 w-8 bg-muted animate-pulse rounded" />
                                    </div>
                                </TableCell>
                            </TableRow>
                        ))}
                    </TableBody>
                </Table>
            </div>
        )
    }

    return (
        <div className="rounded-md border overflow-x-auto">
            <Table>
                <TableHeader>
                    <TableRow>
                        <TableHead className="w-12">
                            <Checkbox />
                        </TableHead>
                        <TableHead>ID</TableHead>
                        <TableHead>Nombre</TableHead>
                        <TableHead>IMO</TableHead>
                        <TableHead>Fecha Creación</TableHead>
                        <TableHead>Fecha Actualización</TableHead>
                        <TableHead className="text-right">Acciones</TableHead>
                    </TableRow>
                </TableHeader>
                <TableBody>
                    {vessels.length === 0 ? (
                        <TableRow>
                            <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                                No se encontraron unidades
                            </TableCell>
                        </TableRow>
                    ) : (
                        vessels.map((vessel) => (
                            <TableRow key={vessel.id} className="hover:bg-muted/50">
                                <TableCell>
                                    <Checkbox />
                                </TableCell>
                                <TableCell className="font-medium">{vessel.id}</TableCell>
                                <TableCell className="max-w-xs truncate" title={vessel.name}>
                                    {vessel.name}
                                </TableCell>
                                <TableCell>{vessel.imo}</TableCell>
                                <TableCell>{formatDate(vessel.created_at)}</TableCell>
                                <TableCell>{formatDate(vessel.updated_at)}</TableCell>
                                <TableCell className="text-right">
                                    <div className="flex justify-end space-x-2">
                                        <Button variant="ghost" size="icon" onClick={() => onView(vessel)} className="h-8 w-8">
                                            <Eye className="h-4 w-4" />
                                        </Button>
                                        <Button variant="ghost" size="icon" onClick={() => onEdit(vessel)} className="h-8 w-8">
                                            <Edit className="h-4 w-4" />
                                        </Button>
                                        <Button
                                            variant="ghost"
                                            size="icon"
                                            onClick={() => onDelete(vessel)}
                                            className="h-8 w-8 text-destructive hover:text-destructive"
                                        >
                                            <Trash2 className="h-4 w-4" />
                                        </Button>
                                    </div>
                                </TableCell>
                            </TableRow>
                        ))
                    )}
                </TableBody>
            </Table>
        </div>
    )
}
