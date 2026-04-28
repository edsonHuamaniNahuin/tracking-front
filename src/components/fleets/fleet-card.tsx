// src/components/fleets/fleet-card.tsx
import { Ship, Pencil, Trash2, Settings2 } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import type { Fleet } from '@/types/fleet'

interface FleetCardProps {
  fleet: Fleet
  onEdit:   (fleet: Fleet) => void
  onDelete: (fleet: Fleet) => void
  onManageVessels: (fleet: Fleet) => void
}

export function FleetCard({ fleet, onEdit, onDelete, onManageVessels }: FleetCardProps) {
  return (
    <Card className="relative overflow-hidden">
      {/* Barra de color */}
      <div className="absolute top-0 left-0 right-0 h-1" style={{ backgroundColor: fleet.color }} />

      <CardHeader className="pb-2 pt-5 px-4">
        <div className="flex items-start justify-between gap-2">
          <div className="flex items-center gap-2 min-w-0">
            <div
              className="w-3 h-3 rounded-full shrink-0"
              style={{ backgroundColor: fleet.color }}
            />
            <CardTitle className="text-sm truncate">{fleet.name}</CardTitle>
          </div>
          <div className="flex gap-1 shrink-0">
            <Button
              variant="ghost" size="icon"
              className="h-6 w-6"
              title="Gestionar unidades"
              onClick={() => onManageVessels(fleet)}
            >
              <Settings2 className="w-3.5 h-3.5" />
            </Button>
            <Button
              variant="ghost" size="icon"
              className="h-6 w-6"
              title="Editar flota"
              onClick={() => onEdit(fleet)}
            >
              <Pencil className="w-3.5 h-3.5" />
            </Button>
            <Button
              variant="ghost" size="icon"
              className="h-6 w-6 text-destructive hover:text-destructive"
              title="Eliminar flota"
              onClick={() => onDelete(fleet)}
            >
              <Trash2 className="w-3.5 h-3.5" />
            </Button>
          </div>
        </div>
      </CardHeader>

      <CardContent className="px-4 pb-4 space-y-2">
        {fleet.description && (
          <p className="text-xs text-muted-foreground line-clamp-2">{fleet.description}</p>
        )}

        <div className="flex items-center gap-1.5">
          <Ship className="w-3.5 h-3.5 text-muted-foreground" />
          <Badge variant="secondary" className="text-xs">
            {fleet.vessels_count ?? 0} unidad{(fleet.vessels_count ?? 0) !== 1 ? 'es' : ''}
          </Badge>
        </div>

        {fleet.user && (
          <p className="text-[11px] text-muted-foreground">
            Propietario: <span className="font-medium">{fleet.user.name}</span>
          </p>
        )}
      </CardContent>
    </Card>
  )
}
