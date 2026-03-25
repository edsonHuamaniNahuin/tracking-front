"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"

interface Vessel {
    id: number
    user_id: number
    name: string
    imo: string
    created_at: string
    updated_at: string
    deleted_at: string | null
}

interface VesselFormModalProps {
    vessel: Vessel | null
    isOpen: boolean
    onClose: () => void
    onSave: (data: { name: string; imo: string }) => void
}

export function VesselFormModal({ vessel, isOpen, onClose, onSave }: VesselFormModalProps) {
    const [formData, setFormData] = useState({ name: "", imo: "" })
    const [errors, setErrors] = useState({ name: "", imo: "" })

    useEffect(() => {
        if (vessel) {
            setFormData({ name: vessel.name, imo: vessel.imo })
        } else {
            setFormData({ name: "", imo: "" })
        }
        setErrors({ name: "", imo: "" })
    }, [vessel, isOpen])

    const validateForm = () => {
        const newErrors = { name: "", imo: "" }

        if (!formData.name.trim()) {
            newErrors.name = "El nombre es obligatorio"
        }

        if (!formData.imo.trim()) {
            newErrors.imo = "El IMO es obligatorio"
        } else if (!/^IMO\d+$/.test(formData.imo)) {
            newErrors.imo = "El IMO debe tener el formato IMO seguido de números"
        }

        setErrors(newErrors)
        return !newErrors.name && !newErrors.imo
    }

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault()
        if (validateForm()) {
            onSave(formData)
        }
    }

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="max-w-md">
                <DialogHeader>
                    <DialogTitle>{vessel ? "Editar Embarcación" : "Nueva Embarcación"}</DialogTitle>
                </DialogHeader>

                <form onSubmit={handleSubmit} className="space-y-4">
                    <div className="space-y-2">
                        <Label htmlFor="name">Nombre</Label>
                        <Input
                            id="name"
                            placeholder="Ingresa el nombre de la embarcación"
                            value={formData.name}
                            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                            className={errors.name ? "border-destructive" : ""}
                        />
                        {errors.name && <p className="text-sm text-destructive">{errors.name}</p>}
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="imo">IMO</Label>
                        <Input
                            id="imo"
                            placeholder="IMO123456"
                            value={formData.imo}
                            onChange={(e) => setFormData({ ...formData, imo: e.target.value })}
                            className={errors.imo ? "border-destructive" : ""}
                        />
                        {errors.imo && <p className="text-sm text-destructive">{errors.imo}</p>}
                    </div>

                    <div className="flex justify-end space-x-2 pt-4">
                        <Button type="button" variant="outline" onClick={onClose}>
                            Cancelar
                        </Button>
                        <Button type="submit">Guardar</Button>
                    </div>
                </form>
            </DialogContent>
        </Dialog>
    )
}
