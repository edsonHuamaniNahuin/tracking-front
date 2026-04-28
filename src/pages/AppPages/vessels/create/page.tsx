import React, { useState, useEffect } from "react"
import { useNavigate } from "react-router-dom"
import { vesselService } from "@/services/vessel.service"
import { vesselTypeService } from "@/services/vesselType.service"
import { vesselStatusService } from "@/services/vesselStatus.service"
import type { VesselType } from "@/types/models/vesselType"
import type { VesselStatus } from "@/types/models/vesselStatus"
import type { VesselCreateRequest } from "@/types/requests/vesselCreateRequest"
import { VesselValidator } from "@/utils/validators/vesselValidator"
import {
  Card, CardHeader, CardTitle, CardDescription, CardContent,
} from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import {
  Select, SelectTrigger, SelectValue, SelectContent, SelectItem, SelectGroup, SelectLabel,
} from "@/components/ui/select"
import { Button } from "@/components/ui/button"
import { ArrowLeft, Ship, Upload, Loader2 } from "lucide-react"
import { NotificationToast } from "@/components/vessels/notification-toast"

export default function VesselCreatePage() {
  const navigate = useNavigate()
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [notification, setNotification] = useState<{ message: string; type: "success" | "error" } | null>(null)
  const [vesselTypes, setVesselTypes] = useState<VesselType[]>([])
  const [vesselStatuses, setVesselStatuses] = useState<VesselStatus[]>([])
  const [category, setCategory] = useState<"" | "maritime" | "terrestrial">("")
  const [form, setForm] = useState({
    name: "",
    imo: "",
    vesselTypeId: "",
    vesselStatusId: "",
    description: "",
    photoUrl: "",
  })
  const [errors, setErrors] = useState({
    name: null as string | null,
    imo: null as string | null,
    vesselTypeId: null as string | null,
    vesselStatusId: null as string | null,
  })
  const [preview, setPreview] = useState<string | null>(null)

  useEffect(() => {
    vesselTypeService.getTypes()
      .then(types => setVesselTypes(types))
    vesselStatusService.getStatuses({ page: 1, per_page: 100 })
      .then(r => setVesselStatuses(r.data))
  }, [])

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target
    setForm(f => ({ ...f, [name]: value }))


    let errorMsg: string | null = null
    switch (name) {
      case "name":
        errorMsg = VesselValidator.validateName(value)
        break
      case "imo":
        errorMsg = VesselValidator.validateImo(value)
        break
      case "description":
        errorMsg = VesselValidator.validateDescription(value)
        break
    }
    setErrors(err => ({ ...err, [name]: errorMsg }))
  }

  const handleSelectChange = (field: "vesselTypeId" | "vesselStatusId", value: string) => {
    setForm(f => ({ ...f, [field]: value }))
    const validator = field === "vesselTypeId"
      ? VesselValidator.validateVesselTypeId
      : VesselValidator.validateVesselStatusId
    setErrors(err => ({ ...err, [field]: validator(value) }))
  }

  const handleImage = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    const url = URL.createObjectURL(file)
    setPreview(url)
    setForm(f => ({ ...f, photoUrl: url }))
    setErrors(err => ({ ...err, photoUrl: VesselValidator.validatePhotoUrl(url) }))
  }

  const validateAll = () => {
    const newErrors = {
      name: VesselValidator.validateName(form.name),
      imo: VesselValidator.validateImo(form.imo),
      vesselTypeId: VesselValidator.validateVesselTypeId(form.vesselTypeId),
      vesselStatusId: VesselValidator.validateVesselStatusId(form.vesselStatusId),
    }
    setErrors(newErrors)
    return Object.values(newErrors).every(e => e === null)
  }

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!validateAll()) return
    setIsSubmitting(true)
    try {
      const payload: VesselCreateRequest = {
        name: form.name,
        imo: form.imo,
        vessel_type_id: Number(form.vesselTypeId),
        vessel_status_id: Number(form.vesselStatusId),
        // description: form.description,
        photoUrl: form.photoUrl,
      }
      await vesselService.createVessel(payload)
      setNotification({ message: "Creado OK", type: "success" })
      setTimeout(() => navigate("/vessels"), 1200)
    } catch {
      setNotification({ message: "Error al crear", type: "error" })
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="container mx-auto py-6 space-y-6">
      {/* Header */}
      <div className="flex items-center">
        <Button variant="ghost" size="icon" onClick={() => navigate("/vessels")}>
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <h1 className="text-3xl font-bold ml-2 flex items-center">
          <Ship className="mr-2" /> Nueva Unidad
        </h1>
      </div>

      {/* Form */}
      <Card>
        <CardHeader>
          <CardTitle>Datos de la unidad</CardTitle>
          <CardDescription>Completa el formulario</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={onSubmit} className="space-y-6">
            <div className="grid md:grid-cols-2 gap-6">
              {/* Nombre */}
              <div>
                <Label htmlFor="name">Nombre</Label>
                <Input
                  id="name"
                  name="name"
                  value={form.name}
                  onChange={handleChange}
                  className={errors.name ? "border-destructive" : ""}
                />
                {errors.name && <p className="text-destructive">{errors.name}</p>}
              </div>

              {/* IMO */}
              <div>
                <Label htmlFor="imo">IMO</Label>
                <Input
                  id="imo"
                  name="imo"
                  value={form.imo}
                  onChange={handleChange}
                  className={errors.imo ? "border-destructive" : ""}
                />
                {errors.imo && <p className="text-destructive">{errors.imo}</p>}
              </div>

              {/* Categoría (paso 1) */}
              <div>
                <Label htmlFor="category">Categoría</Label>
                <Select
                  value={category}
                  onValueChange={(v: "maritime" | "terrestrial") => {
                    setCategory(v)
                    // resetear el tipo al cambiar de categoría
                    setForm(f => ({ ...f, vesselTypeId: "" }))
                    setErrors(err => ({ ...err, vesselTypeId: null }))
                  }}
                >
                  <SelectTrigger id="category">
                    <SelectValue placeholder="Selecciona categoría" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="maritime">🚢 Marítimo</SelectItem>
                    <SelectItem value="terrestrial">🚐 Terrestre</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Tipo (paso 2 — depende de categoría) */}
              <div>
                <Label htmlFor="vesselTypeId">Tipo</Label>
                <Select
                  value={form.vesselTypeId}
                  onValueChange={v => handleSelectChange("vesselTypeId", v)}
                  disabled={!category}
                >
                  <SelectTrigger id="vesselTypeId" className={errors.vesselTypeId ? "border-destructive" : ""}>
                    <SelectValue placeholder={category ? "Selecciona tipo" : "Elige categoría primero"} />
                  </SelectTrigger>
                  <SelectContent>
                    {vesselTypes
                      .filter(t => (t.category ?? 'maritime') === category)
                      .sort((a, b) => a.name.localeCompare(b.name))
                      .map(t => (
                        <SelectItem key={t.id} value={t.id.toString()}>{t.name}</SelectItem>
                      ))}
                  </SelectContent>
                </Select>
                {errors.vesselTypeId && <p className="text-destructive">{errors.vesselTypeId}</p>}
              </div>

              {/* Estado */}
              <div>
                <Label htmlFor="vesselStatusId">Estado</Label>
                <Select
                  value={form.vesselStatusId}
                  onValueChange={v => handleSelectChange("vesselStatusId", v)}
                >
                  <SelectTrigger id="vesselStatusId" className={errors.vesselStatusId ? "border-destructive" : ""}>
                    <SelectValue placeholder="Selecciona" />
                  </SelectTrigger>
                  <SelectContent>
                    {vesselStatuses.map(s => (
                      <SelectItem key={s.id} value={s.id.toString()}>
                        {s.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {errors.vesselStatusId && <p className="text-destructive">{errors.vesselStatusId}</p>}
              </div>
            </div>

            {/* Descripción */}
            <div>
              <Label htmlFor="description">Descripción</Label>
              <Textarea
                id="description"
                name="description"
                value={form.description}
                onChange={handleChange}
                rows={4}
              />
            </div>

            {/* Foto */}
            <div>
              <Label>Fotografía</Label>
              <div className="relative border-dashed border p-4 flex justify-center">
                {preview
                  ? <img src={preview} className="h-40 object-contain" alt="preview" />
                  : <Upload className="h-10 w-10 text-muted mx-auto" />
                }
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleImage}
                  className="absolute inset-0 opacity-0 cursor-pointer"
                />
              </div>
            </div>

            {/* Acciones */}
            <div className="flex justify-end space-x-2">
              <Button variant="outline" onClick={() => navigate("/vessels")}>
                Cancelar
              </Button>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting && <Loader2 className="animate-spin mr-2 h-4 w-4" />}
                Crear
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>

      {notification && (
        <NotificationToast
          message={notification.message}
          type={notification.type}
          onClose={() => setNotification(null)}
        />
      )}
    </div>
  )
}
