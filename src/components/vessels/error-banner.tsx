"use client"

import { AlertCircle, X } from "lucide-react"
import { Button } from "@/components/ui/button"

interface ErrorBannerProps {
    message: string
    onClose: () => void
}

export function ErrorBanner({ message, onClose }: ErrorBannerProps) {
    return (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
            <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                    <AlertCircle className="h-5 w-5 text-red-600" />
                    <p className="text-sm font-medium text-red-800">{message}</p>
                </div>
                <Button variant="ghost" size="icon" onClick={onClose} className="h-6 w-6 text-red-600 hover:text-red-800">
                    <X className="h-4 w-4" />
                </Button>
            </div>
        </div>
    )
}
