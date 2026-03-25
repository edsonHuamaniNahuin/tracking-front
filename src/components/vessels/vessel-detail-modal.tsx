import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { formatDateTimeMedium } from "@/utils/date"

interface Vessel {
    id: number
    user_id: number
    name: string
    imo: string
    created_at: string
    updated_at: string
    deleted_at: string | null
}

interface VesselDetailModalProps {
    vessel: Vessel | null
    isOpen: boolean
    onClose: () => void
}

export function VesselDetailModal({ vessel, isOpen, onClose }: VesselDetailModalProps) {
    if (!vessel) return null

    const formatDate = (dateString: string) => {
        return formatDateTimeMedium(dateString)
    }

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="max-w-md">
                <DialogHeader>
                    <DialogTitle>Detalles de la Embarcación</DialogTitle>
                </DialogHeader>

                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center justify-between">
                            <span className="truncate">{vessel.name}</span>
                            <Badge variant={vessel.deleted_at ? "destructive" : "secondary"}>
                                {vessel.deleted_at ? "Eliminada" : "Activa"}
                            </Badge>
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="grid grid-cols-1 gap-4">
                            <div>
                                <p className="text-sm font-medium text-muted-foreground">ID</p>
                                <p className="text-sm">{vessel.id}</p>
                            </div>
                            <div>
                                <p className="text-sm font-medium text-muted-foreground">Usuario ID</p>
                                <p className="text-sm">{vessel.user_id}</p>
                            </div>
                            <div>
                                <p className="text-sm font-medium text-muted-foreground">IMO</p>
                                <p className="text-sm">{vessel.imo}</p>
                            </div>
                            <div>
                                <p className="text-sm font-medium text-muted-foreground">Fecha Creación</p>
                                <p className="text-sm">{formatDate(vessel.created_at)}</p>
                            </div>
                            <div>
                                <p className="text-sm font-medium text-muted-foreground">Fecha Actualización</p>
                                <p className="text-sm">{formatDate(vessel.updated_at)}</p>
                            </div>
                            {vessel.deleted_at && (
                                <div>
                                    <p className="text-sm font-medium text-muted-foreground">Fecha Eliminación</p>
                                    <p className="text-sm">{formatDate(vessel.deleted_at)}</p>
                                </div>
                            )}
                        </div>
                    </CardContent>
                </Card>
            </DialogContent>
        </Dialog>
    )
}
