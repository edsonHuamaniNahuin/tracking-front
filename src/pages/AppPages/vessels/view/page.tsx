import React, { useState, useEffect } from "react"
import { useParams, useNavigate } from "react-router-dom"
import { vesselService } from "@/services/vessel.service"
import type { Vessel } from "@/types/models/vessel"
import {
    Card, CardHeader, CardTitle, CardContent,
} from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { Button } from "@/components/ui/button"
import { Ship, ArrowLeft, Edit, Trash2, Loader2 } from "lucide-react"
import { ConfirmDialog } from "@/components/vessels/confirm-dialog"
import { NotificationToast } from "@/components/vessels/notification-toast"
import { formatDateTimeMedium } from "@/utils/date"

export default function VesselViewPage() {
    const { id } = useParams()
    const vesselId = Number(id)
    const navigate = useNavigate()

    const [vessel, setVessel] = useState<Vessel | null>(null)
    const [isLoading, setIsLoading] = useState(true)
    const [isDeleting, setIsDeleting] = useState(false)
    const [confirmOpen, setConfirmOpen] = useState(false)
    const [notification, setNotification] = useState<{ message: string; type: "success" | "error" } | null>(null)

    useEffect(() => {
        vesselService.getVessel(vesselId)
            .then(res => setVessel(res.data))
            .catch(() => setNotification({ message: "No encontrado", type: "error" }))
            .finally(() => setIsLoading(false))
    }, [vesselId])

    const onDelete = async () => {
        setIsDeleting(true)
        try {
            await vesselService.deleteVessel(vesselId)
            setNotification({ message: "Eliminado OK", type: "success" })
            setTimeout(() => navigate("/vessels"), 1000)
        } catch {
            setNotification({ message: "Error al eliminar", type: "error" })
        } finally {
            setConfirmOpen(false)
            setIsDeleting(false)
        }
    }

    if (isLoading) {
        return <div className="container mx-auto py-6 text-center"><Loader2 className="animate-spin h-6 w-6" /></div>
    }
    if (!vessel) {
        return <div className="container mx-auto py-6">No se encontró la unidad</div>
    }

    const fmt = (s: string) => formatDateTimeMedium(s)

    return (
        <div className="container mx-auto py-6 space-y-6">
            <div className="flex items-center justify-between">
                <div className="flex items-center">
                    <Button variant="ghost" size="icon" onClick={() => navigate("/vessels")} className="mr-2">
                        <ArrowLeft className="h-5 w-5" />
                    </Button>
                    <h1 className="text-3xl font-bold flex items-center">
                        <Ship className="mr-2" /> {vessel.name}
                    </h1>
                </div>
                <div className="space-x-2">
                    <Button variant="outline" onClick={() => navigate(`/vessels/${vesselId}/edit`)}>
                        <Edit className="mr-1 h-4 w-4" /> Editar
                    </Button>
                    <Button variant="destructive" onClick={() => setConfirmOpen(true)}>
                        <Trash2 className="mr-1 h-4 w-4" /> Eliminar
                    </Button>
                </div>
            </div>

            <Card>
                <CardHeader>
                    <CardTitle>Detalles</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div>ID: {vessel.id}</div>
                    <div>IMO: {vessel.imo}</div>
                    <div>Tipo: {vessel.vessel_type && vessel.vessel_type.name ? vessel.vessel_type.name : "No definido"}</div>
                    <div>Estado: <Badge>{vessel.vessel_status && vessel.vessel_status.name ? vessel.vessel_status.name : "No definido"}</Badge></div>
                    <Separator />
                    <div>Creado: {fmt(vessel.created_at)}</div>
                    <div>Actualizado: {fmt(vessel.updated_at)}</div>
                    {vessel.deleted_at && <div>Eliminado: {fmt(vessel.deleted_at)}</div>}
                </CardContent>
            </Card>

            <ConfirmDialog
                isOpen={confirmOpen}
                onClose={() => setConfirmOpen(false)}
                onConfirm={onDelete}
                title="Eliminar Unidad"
                description={`¿Seguro de eliminar "${vessel.name}"?`}
            />

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
