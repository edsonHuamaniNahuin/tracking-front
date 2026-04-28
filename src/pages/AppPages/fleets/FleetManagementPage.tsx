// src/pages/AppPages/fleets/FleetManagementPage.tsx
import { useState, useEffect, useCallback } from 'react'
import { Plus, RefreshCw, Ship } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { FleetCard } from '@/components/fleets/fleet-card'
import { FleetFormModal } from '@/components/fleets/fleet-form-modal'
import { FleetAssignVesselModal } from '@/components/fleets/fleet-assign-vessel-modal'
import { fleetService } from '@/services/fleet.service'
import type { Fleet, StoreFleetRequest } from '@/types/fleet'

export default function FleetManagementPage() {
  const [fleets, setFleets]           = useState<Fleet[]>([])
  const [loading, setLoading]         = useState(false)
  const [error, setError]             = useState<string | null>(null)
  const [notification, setNotification] = useState<string | null>(null)

  // Modal crear/editar
  const [formOpen, setFormOpen]         = useState(false)
  const [editingFleet, setEditingFleet] = useState<Fleet | null>(null)

  // Modal gestionar embarcaciones
  const [assignOpen, setAssignOpen]       = useState(false)
  const [assignFleet, setAssignFleet]     = useState<Fleet | null>(null)
  const [assignFleetDetail, setAssignFleetDetail] = useState<Fleet | null>(null)

  // ── Carga ──────────────────────────────────────────────────────────────────
  const load = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      setFleets(await fleetService.list())
    } catch {
      setError('No se pudieron cargar las flotas.')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { load() }, [load])

  function notify(msg: string) {
    setNotification(msg)
    setTimeout(() => setNotification(null), 3000)
  }

  // ── CRUD ───────────────────────────────────────────────────────────────────
  async function handleSave(data: StoreFleetRequest) {
    if (editingFleet) {
      await fleetService.update(editingFleet.id, data)
      notify('Flota actualizada.')
    } else {
      await fleetService.create(data)
      notify('Flota creada.')
    }
    await load()
  }

  async function handleDelete(fleet: Fleet) {
    if (!confirm(`¿Eliminar la flota "${fleet.name}"? Las embarcaciones quedarán sin flota asignada.`)) return
    try {
      await fleetService.delete(fleet.id)
      notify('Flota eliminada.')
      await load()
    } catch {
      setError('No se pudo eliminar la flota.')
    }
  }

  // ── Asignación de embarcaciones ────────────────────────────────────────────
  async function openAssign(fleet: Fleet) {
    setAssignFleet(fleet)
    try {
      const detail = await fleetService.get(fleet.id)
      setAssignFleetDetail(detail)
    } catch {
      setAssignFleetDetail(fleet)
    }
    setAssignOpen(true)
  }

  async function handleAssign(vesselId: number) {
    if (!assignFleet) return
    await fleetService.assignVessel(assignFleet.id, vesselId)
    // Refrescar detalle
    const detail = await fleetService.get(assignFleet.id)
    setAssignFleetDetail(detail)
    await load()
  }

  async function handleRemove(vesselId: number) {
    if (!assignFleet) return
    await fleetService.removeVessel(assignFleet.id, vesselId)
    const detail = await fleetService.get(assignFleet.id)
    setAssignFleetDetail(detail)
    await load()
  }

  // ── Render ─────────────────────────────────────────────────────────────────
  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Gestión de Flotas</h1>
          <p className="text-muted-foreground text-sm mt-1">
            Organiza tus embarcaciones en flotas para una mejor gestión.
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={load} disabled={loading}>
            <RefreshCw className={`w-4 h-4 mr-1 ${loading ? 'animate-spin' : ''}`} />
            Actualizar
          </Button>
          <Button size="sm" onClick={() => { setEditingFleet(null); setFormOpen(true) }}>
            <Plus className="w-4 h-4 mr-1" />
            Nueva flota
          </Button>
        </div>
      </div>

      {/* Notificación */}
      {notification && (
        <div className="bg-green-50 border border-green-200 text-green-800 text-sm px-4 py-2 rounded-md">
          {notification}
        </div>
      )}

      {/* Error */}
      {error && (
        <div className="bg-destructive/10 border border-destructive/20 text-destructive text-sm px-4 py-2 rounded-md">
          {error}
        </div>
      )}

      {/* Grid de flotas */}
      {loading && fleets.length === 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="h-40 bg-muted animate-pulse rounded-xl" />
          ))}
        </div>
      ) : fleets.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-muted-foreground gap-3">
          <Ship className="w-12 h-12 opacity-30" />
          <p className="text-sm">No tienes flotas creadas.</p>
          <Button variant="outline" size="sm" onClick={() => { setEditingFleet(null); setFormOpen(true) }}>
            <Plus className="w-4 h-4 mr-1" /> Crear primera flota
          </Button>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {fleets.map(fleet => (
            <FleetCard
              key={fleet.id}
              fleet={fleet}
              onEdit={f => { setEditingFleet(f); setFormOpen(true) }}
              onDelete={handleDelete}
              onManageVessels={openAssign}
            />
          ))}
        </div>
      )}

      {/* Modal crear/editar */}
      <FleetFormModal
        open={formOpen}
        fleet={editingFleet}
        onClose={() => setFormOpen(false)}
        onSave={handleSave}
      />

      {/* Modal asignar embarcaciones */}
      <FleetAssignVesselModal
        open={assignOpen}
        fleet={assignFleetDetail ?? assignFleet}
        onClose={() => { setAssignOpen(false); setAssignFleet(null); setAssignFleetDetail(null) }}
        onAssign={handleAssign}
        onRemove={handleRemove}
      />
    </div>
  )
}
