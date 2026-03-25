import * as Dialog from "@radix-ui/react-dialog";
import { Button } from "@/components/ui/button";

export interface LogoutConfirmDialogProps {
  open: boolean;
  onClose(): void;
  onConfirm(): void;
}

export function LogoutConfirmDialog({
  open,
  onClose,
  onConfirm,
}: LogoutConfirmDialogProps) {
  return (
    <Dialog.Root open={open} onOpenChange={onClose}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 z-10 bg-black/50" />

        <Dialog.Content
          className="
            fixed top-1/2 left-1/2
            max-w-sm w-full
            -translate-x-1/2 -translate-y-1/2
            rounded-lg bg-white p-6 shadow-lg
            z-20
          "
        >
          <Dialog.Title>Confirmar cierre de sesión</Dialog.Title>
          <Dialog.Description className="mt-1 text-sm text-gray-500">
            ¿Estás seguro de que quieres cerrar tu sesión actual?
          </Dialog.Description>

          <div className="mt-6 flex justify-end space-x-2">
            {/* Este botón cierra SOLO el diálogo */}
            <Dialog.Close asChild>
              <Button variant="outline">Cancelar</Button>
            </Dialog.Close>

            <Button
              onClick={() => {
                onConfirm();
                onClose();
              }}
            >
              Cerrar sesión
            </Button>
          </div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
