import { AlertTriangle, LogOut, RefreshCw } from 'lucide-react'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'

interface SessionExpiredModalProps {
  open: boolean
  isRefreshing: boolean
  error: string | null
  onContinue: () => void
  onLogout: () => void
}

export function SessionExpiredModal({
  open,
  isRefreshing,
  error,
  onContinue,
  onLogout,
}: SessionExpiredModalProps) {
  return (
    <Dialog open={open} onOpenChange={(v) => { if (!v) onLogout() }}>
      <DialogContent
        className="sm:max-w-md"
        // Impedir cerrar con ESC o click fuera sin elegir opción
        onInteractOutside={(e) => e.preventDefault()}
        onEscapeKeyDown={(e) => e.preventDefault()}
      >
        <DialogHeader>
          <div className="flex items-center gap-3 mb-1">
            <span className="flex h-10 w-10 items-center justify-center rounded-full bg-amber-100 dark:bg-amber-900/30">
              <AlertTriangle className="h-5 w-5 text-amber-600 dark:text-amber-400" />
            </span>
            <DialogTitle className="text-lg">Sesión por vencer</DialogTitle>
          </div>
          <DialogDescription className="text-sm text-muted-foreground">
            Tu sesión está a punto de caducar o ya ha expirado.
            ¿Deseas renovarla y continuar trabajando?
          </DialogDescription>
        </DialogHeader>

        {error && (
          <p className="text-sm text-destructive bg-destructive/10 rounded px-3 py-2">
            {error}
          </p>
        )}

        <DialogFooter className="flex-col-reverse sm:flex-row gap-2 sm:gap-2">
          <Button
            variant="outline"
            className="w-full sm:w-auto"
            onClick={onLogout}
            disabled={isRefreshing}
          >
            <LogOut className="h-4 w-4 mr-2" />
            No, cerrar sesión
          </Button>

          <Button
            className="w-full sm:w-auto"
            onClick={onContinue}
            disabled={isRefreshing}
          >
            {isRefreshing ? (
              <>
                <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                Renovando…
              </>
            ) : (
              <>
                <RefreshCw className="h-4 w-4 mr-2" />
                Sí, continuar
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
