// src/components/fleets/fleet-form-modal.tsx
import { useState, useEffect } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import type { Fleet, StoreFleetRequest } from '@/types/fleet'

const PRESET_COLORS = [
  '#3B82F6', '#10B981', '#F59E0B', '#EF4444',
  '#8B5CF6', '#06B6D4', '#F97316', '#84CC16',
]

interface FleetFormModalProps {
  open: boolean
  fleet?: Fleet | null
  onClose: () => void
  onSave: (data: StoreFleetRequest) => Promise<void>
}

export function FleetFormModal({ open, fleet, onClose, onSave }: FleetFormModalProps) {
  const [name, setName]               = useState('')
  const [description, setDescription] = useState('')
  const [color, setColor]             = useState('#3B82F6')
  const [saving, setSaving]           = useState(false)
  const [error, setError]             = useState<string | null>(null)

  useEffect(() => {
    if (open) {
      setName(fleet?.name ?? '')
      setDescription(fleet?.description ?? '')
      setColor(fleet?.color ?? '#3B82F6')
      setError(null)
    }
  }, [open, fleet])

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!name.trim()) { setError('El nombre es obligatorio.'); return }
    setSaving(true)
    setError(null)
    try {
      await onSave({ name: name.trim(), description: description.trim() || undefined, color })
      onClose()
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : (err as { response?: { data?: { message?: string } } })?.response?.data?.message
      setError(msg ?? 'Error al guardar la flota.')
    } finally {
      setSaving(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={v => { if (!v) onClose() }}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{fleet ? 'Editar flota' : 'Nueva flota'}</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4 py-2">
          <div className="space-y-1">
            <Label htmlFor="fleet-name">Nombre *</Label>
            <Input
              id="fleet-name"
              value={name}
              onChange={e => setName(e.target.value)}
              placeholder="Ej: Flota Norte"
              maxLength={100}
              autoFocus
            />
          </div>

          <div className="space-y-1">
            <Label htmlFor="fleet-desc">Descripción</Label>
            <Textarea
              id="fleet-desc"
              value={description}
              onChange={e => setDescription(e.target.value)}
              placeholder="Descripción opcional..."
              rows={2}
              maxLength={500}
            />
          </div>

          <div className="space-y-2">
            <Label>Color de identificación</Label>
            <div className="flex items-center gap-2 flex-wrap">
              {PRESET_COLORS.map(c => (
                <button
                  key={c}
                  type="button"
                  className={`w-7 h-7 rounded-full border-2 transition-transform ${color === c ? 'border-foreground scale-110' : 'border-transparent'}`}
                  style={{ backgroundColor: c }}
                  onClick={() => setColor(c)}
                />
              ))}
              <input
                type="color"
                value={color}
                onChange={e => setColor(e.target.value)}
                className="w-7 h-7 rounded cursor-pointer border"
                title="Color personalizado"
              />
            </div>
          </div>

          {error && <p className="text-sm text-destructive">{error}</p>}

          <DialogFooter>
            <Button type="button" variant="outline" onClick={onClose} disabled={saving}>
              Cancelar
            </Button>
            <Button type="submit" disabled={saving}>
              {saving ? 'Guardando...' : fleet ? 'Guardar cambios' : 'Crear flota'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
