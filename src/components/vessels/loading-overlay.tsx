import { Loader2 } from "lucide-react"

export function LoadingOverlay() {
    return (
        <div className="fixed inset-0 bg-background/80 backdrop-blur-sm z-50 flex items-center justify-center">
            <div className="flex flex-col items-center space-y-4">
                <Loader2 className="h-8 w-8 animate-spin" />
                <p className="text-sm text-muted-foreground">Cargando...</p>
            </div>
        </div>
    )
}
