import { useEffect } from "react"
import { CheckCircle, XCircle, X } from "lucide-react"
import { Button } from "@/components/ui/button"

interface NotificationToastProps {
    message: string
    type: "success" | "error"
    onClose: () => void
}

export function NotificationToast({ message, type, onClose }: NotificationToastProps) {
    useEffect(() => {
        const timer = setTimeout(onClose, 3000)
        return () => clearTimeout(timer)
    }, [onClose])

    return (
        <div className="fixed top-4 right-4 z-50 animate-in slide-in-from-top-2">
            <div
                className={`flex items-center space-x-2 rounded-lg border p-4 shadow-lg ${type === "success" ? "bg-green-50 border-green-200 text-green-800" : "bg-red-50 border-red-200 text-red-800"
                    }`}
            >
                {type === "success" ? <CheckCircle className="h-5 w-5" /> : <XCircle className="h-5 w-5" />}
                <p className="text-sm font-medium">{message}</p>
                <Button variant="ghost" size="icon" onClick={onClose} className="h-6 w-6 ml-2">
                    <X className="h-4 w-4" />
                </Button>
            </div>
        </div>
    )
}
