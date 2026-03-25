"use client"

import { useState, useEffect, useCallback } from "react"
import { FiltersBar } from "@/components/vessels/filters-bar"
import { VesselTable } from "@/components/vessels/vessel-table"
import { PaginationControls } from "@/components/vessels/pagination-controls"
import { 
    
 } from "@/components/vessels/vessel-detail-modal"
import { VesselFormModal } from "@/components/vessels/vessel-form-modal"
import { ConfirmDialog } from "@/components/vessels/confirm-dialog"
import { NotificationToast } from "@/components/vessels/notification-toast"
import { ErrorBanner } from "@/components/vessels/error-banner"
import { Button } from "@/components/ui/button"
import { Plus } from "lucide-react"
import { vesselService } from "@/services/vessel.service"
import type { Vessel } from "@/types/models/vessel"
import type { PaginatedResponse } from "@/types/paginateResponse"
import { DEFAULT_LOADING_ROWS } from "@/utils/statics"
import { VesselSearchRequest } from "@/types/requests/vesselSearchRequest"
import { useNavigate } from "react-router-dom"

export default function VesselsPage() {

    const [apiData, setApiData] = useState<PaginatedResponse<Vessel> | null>(null)

    /** Loading general */
    const [isLoading, setIsLoading] = useState(false)

    /** Para ver detalle / editar / eliminar */
    const [selectedVessel, setSelectedVessel] = useState<Vessel | null>(null)
    const [isDetailModalOpen, setIsDetailModalOpen] = useState(false)
    const [isFormModalOpen, setIsFormModalOpen] = useState(false)
    const [isConfirmDialogOpen, setIsConfirmDialogOpen] = useState(false)
    const [vesselToDelete, setVesselToDelete] = useState<Vessel | null>(null)

    /** Mensajes de notificación / error */
    const [notification, setNotification] = useState<{ message: string; type: "success" | "error" } | null>(null)
    const [error, setError] = useState<string | null>(null)

    /** Filtros de búsqueda */
    const [nameFilter, setNameFilter] = useState("")
    const [imoFilter, setImoFilter] = useState("")

    /** Paginación */
    const [currentPage, setCurrentPage] = useState(1)
    const [itemsPerPage, setItemsPerPage] = useState(5)

    /** Cuando se edita/crea embarcación */
    const [editingVessel, setEditingVessel] = useState<Vessel | null>(null)


    const navigate = useNavigate()


    // ─────────────────────────────────────────────────
    // Función centralizada para pedir datos al backend:
    const loadVessels = useCallback(
        async (page: number, perPage: number, name?: string, imo?: string) => {
            setIsLoading(true)
            try {
                const params: VesselSearchRequest = {
                    page,
                    per_page: perPage,
                }
                if (name) params.name = name
                if (imo) params.imo = imo

                const response = await vesselService.getVessels(params)
                setApiData(response)
                setError(null)
            } catch (err) {
                console.error(err)
                setError("Error al cargar las embarcaciones desde el servidor")
            } finally {
                setIsLoading(false)
            }
        },
        []
    )
    // ─────────────────────────────────────────────────

    /** Al montar por primera vez, pedimos la página 1 */
    useEffect(() => {
        loadVessels(1, itemsPerPage, nameFilter, imoFilter)
    }, [loadVessels, itemsPerPage, nameFilter, imoFilter])

    // ─────────────────────────────────────────────────
    /** Cambia de página (botones) */
    const handlePageChange = (page: number) => {
        if (apiData && !isLoading) {
            setCurrentPage(page)
            loadVessels(page, itemsPerPage, nameFilter, imoFilter)
        }
    }

    /** Cambia “items per page” */
    const handlePerPageChange = (perPage: number) => {
        if (!isLoading) {
            setItemsPerPage(perPage)
            setCurrentPage(1)
            loadVessels(1, perPage, nameFilter, imoFilter)
        }
    }

    /** Se dispara desde FiltersBar cuando cambia “name” */
    const handleNameFilterChange = (value: string) => {
        setNameFilter(value)
        setCurrentPage(1)
    }

    /** Se dispara desde FiltersBar cuando cambia “imo” */
    const handleImoFilterChange = (value: string) => {
        setImoFilter(value)
        setCurrentPage(1)
    }

    /** Ver detalles */
    const handleView = (v: Vessel) => {
        // setSelectedVessel(vessel)
        // setIsDetailModalOpen(true)
        navigate(`/vessels/${v.id}`)
    }

    /** Editar */
    const handleEdit = (v: Vessel) => {
        // setEditingVessel(vessel)
        // setIsFormModalOpen(true)
        navigate(`/vessels/${v.id}/edit`)
    }

    /** Solicita confirmación para borrar */
    const handleDelete = (vessel: Vessel) => {
        setVesselToDelete(vessel)
        setIsConfirmDialogOpen(true)
    }

    /** Confirmación de borrado */
    const confirmDelete = async () => {
        if (!vesselToDelete || isLoading) return

        setIsLoading(true)
        try {
            await vesselService.deleteVessel(vesselToDelete.id)
            showNotification("Embarcación eliminada exitosamente", "success")
            // Cargar la misma página de nuevo:
            loadVessels(currentPage, itemsPerPage, nameFilter, imoFilter)
            setIsConfirmDialogOpen(false)
            setVesselToDelete(null)
        } catch (err) {
            console.error(err)
            showNotification("Error al eliminar la embarcación", "error")
        } finally {
            setIsLoading(false)
        }
    }

    /** Guardar (crear o actualizar) */
    /* const handleSave = async (vesselData: { name: string; imo: string }) => {
        if (isLoading) return
        setIsLoading(true)
        try {
            if (editingVessel) {
                // Actualizar
                await vesselService.updateVessel(editingVessel.id, {
                    name: vesselData.name,
                    imo: vesselData.imo,
                })
                showNotification("Embarcación actualizada exitosamente", "success")
            } else {
                // Crear
                await vesselService.createVessel({
                    name: vesselData.name,
                    imo: vesselData.imo,
                })
                showNotification("Embarcación creada exitosamente", "success")
            }
            // Recargar datos en la página actual
            loadVessels(currentPage, itemsPerPage, nameFilter, imoFilter)
            setIsFormModalOpen(false)
            setEditingVessel(null)
        } catch (err) {
            console.error(err)
            showNotification("Error al guardar la embarcación", "error")
        } finally {
            setIsLoading(false)
        }
    } */

    /** Muestra un toast */
    const showNotification = (message: string, type: "success" | "error") => {
        setNotification({ message, type })
        setTimeout(() => setNotification(null), 3000)
    }
    // ─────────────────────────────────────────────────

    return (
        <div className="container mx-auto py-6 space-y-6">
            {/* ✴ Error Banner */}
            {error && <ErrorBanner message={error} onClose={() => setError(null)} />}

            {/* ✴ Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">Embarcaciones</h1>
                    <p className="text-muted-foreground">Gestiona tu flota de embarcaciones</p>
                </div>
                <Button onClick={() => navigate("/vessels/create")}>
                    <Plus className="mr-2 h-4 w-4" />
                    Nueva Embarcación
                </Button>
            </div>

            {/* ✴ Filters: ahora con nameFilter y imoFilter */}
            <FiltersBar
                nameFilter={nameFilter}
                onNameFilterChange={handleNameFilterChange}
                imoFilter={imoFilter}
                onImoFilterChange={handleImoFilterChange}
                itemsPerPage={itemsPerPage}
                onItemsPerPageChange={handlePerPageChange}
            />

            {/* ✴ Tabla: le pasamos loadingRowsCount igual a itemsPerPage */}
            <VesselTable
                vessels={apiData?.data || []}
                onView={handleView}
                onEdit={handleEdit}
                onDelete={handleDelete}
                isLoading={isLoading}
                loadingRowsCount={apiData?.meta.per_page ?? DEFAULT_LOADING_ROWS}
            />

            {/* ✴ Paginación: deshabilita botones si isLoading o en bordes */}
            {apiData && (
                <PaginationControls
                    currentPage={apiData.meta.current_page}
                    totalPages={apiData.meta.last_page}
                    totalItems={apiData.meta.total}
                    from={apiData.meta.from ?? 0}
                    to={apiData.meta.to ?? 0}
                    onPageChange={handlePageChange}
                    isLoading={isLoading}              // ← nuevo prop
                />
            )}

            {/* ✴ Modales */}
           {/*  <VesselDetailModal
                vessel={selectedVessel}
                isOpen={isDetailModalOpen}
                onClose={() => setIsDetailModalOpen(false)}
            />
 */}
          {/*   <VesselFormModal
                vessel={editingVessel}
                isOpen={isFormModalOpen}
                onClose={() => {
                    setIsFormModalOpen(false)
                    setEditingVessel(null)
                }}
                onSave={handleSave}
            /> */}

            <ConfirmDialog
                isOpen={isConfirmDialogOpen}
                onClose={() => setIsConfirmDialogOpen(false)}
                onConfirm={confirmDelete}
                title="Eliminar Embarcación"
                description={`¿Estás seguro de eliminar la embarcación "${vesselToDelete?.name}"?`}
            />

            {/* ✴ Toast de notificaciones */}
            {notification && (
                <NotificationToast
                    message={notification.message}
                    type={notification.type}
                    onClose={() => setNotification(null)}
                />
            )}
        </div>
    )
}
