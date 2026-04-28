// src/components/fleets/fleet-assign-vessel-modal.tsx
import { useState, useEffect } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Badge } from '@/components/ui/badge'
import { Ship } from 'lucide-react'
import { vesselService } from '@/services/vessel.service'
import type { Vessel } from '@/types/models/vessel'
import type { Fleet } from '@/types/fleet'

interface FleetAssignVesselModalProps {
  open: boolean
  fleet: Fleet | null
  onClose: () => void
  onAssign: (vesselId: number) => Promise<void>
  onRemove: (vesselId: number) => Promise<void>
}

export function FleetAssignVesselModal({
  open, fleet, onClose, onAssign, onRemove,
}: FleetAssignVesselModalProps) {
  const [vessels, setVessels]       = useState<Vessel[]>([])
  const [loading, setLoading]       = useState(false)
  const [busyId, setBusyId]         = useState<number | null>(null)
  const [error, setError]           = useState<string | null>(null)

  useEffect(() => {
    if (!open) return
    setLoading(true)
    vesselService.getVessels({ page: 1, per_page: 500, own_only: true })
      .then(res => setVessels(res.data ?? []))
      .catch(() => setError('No se pudieron cargar las unidades.'))
      .finally(() => setLoading(false))
  }, [open])

  const fleetVesselIds = new Set(fleet?.vessels?.map(v => v.id) ?? [])

  async function toggle(vessel: Vessel) {
    if (!fleet) return
    setBusyId(vessel.id)
    setError(null)
    try {
      if (fleetVesselIds.has(vessel.id)) {
        await onRemove(vessel.id)
      } else {
        await onAssign(vessel.id)
      }
    } catch (err: any) {
      setError(err?.response?.data?.message ?? 'Error al modificar la flota.')
    } finally {
      setBusyId(null)
    }
  }

  return (
    <Dialog open={open} onOpenChange={v => { if (!v) onClose() }}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>
            Gestionar unidades —{' '}
            <span style={{ color: fleet?.color }}>{fleet?.name}</span>
          </DialogTitle>
        </DialogHeader>

        {loading && <p className="text-sm text-muted-foreground py-4 text-center">Cargando...</p>}
        {error   && <p className="text-sm text-destructive">{error}</p>}

        {!loading && (
          <ScrollArea className="h-72">
            <div className="space-y-1 pr-2">
              {vessels.map(vessel => {
                const inFleet = fleetVesselIds.has(vessel.id)
                return (
                  <div
                    key={vessel.id}
                    className="flex items-center justify-between px-3 py-2 rounded-md hover:bg-muted/50 text-sm"
                  >
                    <div className="flex items-center gap-2 min-w-0">
                      <Ship className="w-4 h-4 shrink-0 text-muted-foreground" />
                      <span className="truncate font-medium">{vessel.name}</span>
                      {vessel.vessel_type && (
                        <Badge variant="outline" className="text-[10px] shrink-0">
                          {vessel.vessel_type.name}
                        </Badge>
                      )}
                    </div>
                    <Button
                      size="sm"
                      variant={inFleet ? 'destructive' : 'outline'}
                      className="ml-2 h-7 text-xs shrink-0"
                      disabled={busyId === vessel.id}
                      onClick={() => toggle(vessel)}
                    >
                      {busyId === vessel.id ? '...' : inFleet ? 'Quitar' : 'Agregar'}
                    </Button>
                  </div>
                )
              })}
              {vessels.length === 0 && (
                <p className="text-center text-muted-foreground py-8 text-sm">
                  No tienes unidades registradas.
                </p>
              )}
            </div>
          </ScrollArea>
        )}

        <DialogFooter>
          <Button variant="outline" onClick={onClose}>Cerrar</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
