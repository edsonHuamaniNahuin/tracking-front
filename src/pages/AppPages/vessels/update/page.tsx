// src/pages/vessels/VesselUpdatePage.tsx
import React, { useState, useEffect, useCallback } from "react"
import { useNavigate, useParams } from "react-router-dom"
import { vesselService } from "@/services/vessel.service"
import { vesselTypeService } from "@/services/vesselType.service"
import { vesselStatusService } from "@/services/vesselStatus.service"
import type { VesselStatus } from "@/types/models/vesselStatus"
import type { VesselType } from "@/types/models/vesselType"

import type { VesselUpdateRequest } from "@/types/requests/vesselUpdateRequest"
import {
    Card, CardHeader, CardTitle, CardDescription, CardContent,
} from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import {
    Select, SelectTrigger, SelectValue, SelectContent, SelectItem,
} from "@/components/ui/select"
import { Button } from "@/components/ui/button"
import {
    Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter,
} from "@/components/ui/dialog"
import {
    ArrowLeft, Ship, Upload, Loader2,
    Cpu, Eye, EyeOff, Copy, RefreshCw, Power, Check,
    Wifi, WifiOff, Activity, Clock, MonitorDot, Settings2,
} from "lucide-react"
import { NotificationToast } from "@/components/vessels/notification-toast"

export default function VesselUpdatePage() {
    const { id } = useParams<{ id: string }>()
    const vesselId = Number(id)
    const navigate = useNavigate()

    const [isLoading, setIsLoading] = useState(true)
    const [isSubmitting, setIsSubmitting] = useState(false)
    const [notification, setNotification] = useState<{ message: string; type: "success" | "error" } | null>(null)
    const [vesselTypes, setVesselTypes] = useState<VesselType[]>([])
    const [vesselStatuses, setVesselStatuses] = useState<VesselStatus[]>([])
    const [form, setForm] = useState({
        name: "",
        imo: "",
        vesselTypeId: "",
        vesselStatusId: "",
        description: "",
        photoUrl: "",
    })
    const [errors, setErrors] = useState({
        name: "",
        imo: "",
        vesselTypeId: "",
        vesselStatusId: "",
    })
    const [preview, setPreview] = useState<string | null>(null)

    // ── Estado de la sección Dispositivo IoT ────────────────────────────────
    const [deviceToken, setDeviceToken] = useState<string | null>(null)
    const [hasToken, setHasToken] = useState(false)
    const [tokenVisible, setTokenVisible] = useState(false)
    const [copied, setCopied] = useState(false)
    const [configCopied, setConfigCopied] = useState(false)
    const [espModalOpen, setEspModalOpen] = useState(false)
    const [espWifiSsid, setEspWifiSsid] = useState('')
    const [espWifiPass, setEspWifiPass] = useState('')
    const [isLoadingToken, setIsLoadingToken] = useState(false)
    const [isRegenerating, setIsRegenerating] = useState(false)
    const [isRebooting, setIsRebooting] = useState(false)
    const [confirmRegen, setConfirmRegen] = useState(false)
    const [confirmReboot, setConfirmReboot] = useState(false)

    // ── Estado de conexión ESP32 ─────────────────────────────────────────────
    const [deviceStatus, setDeviceStatus] = useState<Awaited<ReturnType<typeof vesselService.getDeviceStatus>> | null>(null)
    const [isCheckingStatus, setIsCheckingStatus] = useState(false)
    const [statusChecked, setStatusChecked] = useState(false)

    const checkDeviceStatus = async () => {
        setIsCheckingStatus(true)
        try {
            const data = await vesselService.getDeviceStatus(vesselId)
            setDeviceStatus(data)
            setStatusChecked(true)
        } catch {
            setNotification({ message: "Error al consultar el estado del dispositivo", type: "error" })
        } finally {
            setIsCheckingStatus(false)
        }
    }

    const loadDeviceToken = useCallback(async () => {
        setIsLoadingToken(true)
        try {
            const data = await vesselService.getDeviceToken(vesselId)
            setDeviceToken(data.device_token)
            setHasToken(data.has_token)
        } catch {
            // Silencioso: el token puede no existir todavía
        } finally {
            setIsLoadingToken(false)
        }
    }, [vesselId])

    const handleRegenerate = async () => {
        if (!confirmRegen) { setConfirmRegen(true); return }
        setIsRegenerating(true)
        setConfirmRegen(false)
        try {
            const data = await vesselService.regenerateDeviceToken(vesselId)
            setDeviceToken(data.device_token)
            setHasToken(true)
            setTokenVisible(true)
            setNotification({ message: "Token regenerado. Cópialo ahora.", type: "success" })
        } catch {
            setNotification({ message: "Error al regenerar el token", type: "error" })
        } finally {
            setIsRegenerating(false)
        }
    }

    const handleReboot = async () => {
        if (!confirmReboot) { setConfirmReboot(true); return }
        setIsRebooting(true)
        setConfirmReboot(false)
        try {
            await vesselService.rebootDevice(vesselId)
            setNotification({ message: "Comando de reinicio enviado al dispositivo.", type: "success" })
        } catch {
            setNotification({ message: "Error al enviar el comando de reinicio", type: "error" })
        } finally {
            setIsRebooting(false)
        }
    }

    const handleCopy = () => {
        if (!deviceToken) return
        navigator.clipboard.writeText(deviceToken).then(() => {
            setCopied(true)
            setTimeout(() => setCopied(false), 2000)
        })
    }

    const handleOpenEspModal = () => {
        setEspWifiSsid('')
        setEspWifiPass('')
        setConfigCopied(false)
        setEspModalOpen(true)
    }

    const buildEspConfig = () => {
        const apiBase = (import.meta.env.VITE_API_URL || import.meta.env.VITE_API_NETWORK || import.meta.env.VITE_API_LOCAL || '').replace(/\/v1$/, '')
        return {
            token: deviceToken || '',
            api_url: `${apiBase}/v1/device/ping`,
            interval: deviceStatus?.send_interval ?? 10,
            vessel_name: form.name || '',
            ...(espWifiSsid ? { wifi_ssid: espWifiSsid } : {}),
            ...(espWifiPass ? { wifi_pass: espWifiPass } : {}),
        }
    }

    const handleCopyEspConfig = () => {
        const config = buildEspConfig()
        navigator.clipboard.writeText(JSON.stringify(config)).then(() => {
            setConfigCopied(true)
            setTimeout(() => setConfigCopied(false), 3000)
        })
    }

    const maskedToken = deviceToken
        ? `sk-${"•".repeat(deviceToken.length - 4)}${deviceToken.slice(-4)}`
        : null

    useEffect(() => {
        (async () => {
            try {
                const [typesRes, statusesRes, vesselRes] = await Promise.all([
                    vesselTypeService.getTypes({ page: 1, per_page: 100 }),
                    vesselStatusService.getStatuses({ page: 1, per_page: 100 }),
                    vesselService.getVessel(vesselId),
                ])
                setVesselTypes(typesRes.data)
                setVesselStatuses(statusesRes.data)
                const v = vesselRes.data
                // Validar vessel_type y vessel_status
                const vesselTypeId = v.vessel_type && v.vessel_type.id ? v.vessel_type.id.toString() : (typesRes.data[0]?.id?.toString() || "")
                const vesselStatusId = v.vessel_status && v.vessel_status.id ? v.vessel_status.id.toString() : (statusesRes.data[0]?.id?.toString() || "")
                setForm({
                    name: v.name,
                    imo: v.imo || "",
                    vesselTypeId,
                    vesselStatusId,
                    description: (v as any).description || "",
                    photoUrl: (v as any).photoUrl || "",
                })
                setPreview((v as any).photoUrl || null)
            } catch (e) {
                setNotification({ message: "Error al cargar datos", type: "error" })
            } finally {
                setIsLoading(false)
            }
        })()
        loadDeviceToken()
    }, [vesselId, loadDeviceToken])

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        const { name, value } = e.target
        setForm((f) => ({ ...f, [name]: value }))
        setErrors((err) => ({ ...err, [name]: "" }))
    }

    const handleSelect = (field: string, value: string) => {
        setForm((f) => ({ ...f, [field]: value }))
        setErrors((err) => ({ ...err, [field]: "" }))
    }

    const handleImage = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0]
        if (!file) return
        const url = URL.createObjectURL(file)
        setPreview(url)
        setForm((f) => ({ ...f, photoUrl: url }))
    }

    const validate = () => {
        const errs = { name: "", imo: "", vesselTypeId: "", vesselStatusId: "" }
        let ok = true
        if (!form.name.trim()) { errs.name = "Requerido"; ok = false }
        if (!/^IMO\d+$/.test(form.imo)) { errs.imo = "Formato: IMO123"; ok = false }
        if (!form.vesselTypeId) { errs.vesselTypeId = "Requerido"; ok = false }
        if (!form.vesselStatusId) { errs.vesselStatusId = "Requerido"; ok = false }
        setErrors(errs)
        return ok
    }

    const onSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        if (!validate()) return
        setIsSubmitting(true)
        try {
            const payload: VesselUpdateRequest = {
                name: form.name,
                imo: form.imo,
                vessel_type_id: Number(form.vesselTypeId),
                vessel_status_id: Number(form.vesselStatusId),
                description: form.description,
                photoUrl: form.photoUrl,
            }
            await vesselService.updateVessel(vesselId, payload)
            setNotification({ message: "Actualizado OK", type: "success" })
            setTimeout(() => navigate(`/vessels/${vesselId}`), 1200)
        } catch {
            setNotification({ message: "Error al guardar", type: "error" })
        } finally {
            setIsSubmitting(false)
        }
    }

    if (isLoading) {
        return (
            <div className="container mx-auto py-6 text-center">
                <Loader2 className="animate-spin h-6 w-6" />
            </div>
        )
    }

    return (
        <div className="container mx-auto py-6 space-y-6">
            <div className="flex items-center">
                <Button variant="ghost" size="icon" onClick={() => navigate(`/vessels/${vesselId}`)}>
                    <ArrowLeft className="h-5 w-5" />
                </Button>
                <h1 className="text-3xl font-bold ml-2 flex items-center">
                    <Ship className="mr-2" /> Editar Embarcación
                </h1>
            </div>

            <Card>
                <CardHeader>
                    <CardTitle>Datos de la embarcación</CardTitle>
                    <CardDescription>Modifica y guarda los cambios</CardDescription>
                </CardHeader>
                <CardContent>
                    <form onSubmit={onSubmit} className="space-y-6">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            {/* Nombre */}
                            <div className="space-y-2">
                                <Label htmlFor="name">Nombre</Label>
                                <Input
                                    id="name"
                                    name="name"
                                    value={form.name}
                                    onChange={handleChange}
                                    className={errors.name ? "border-destructive" : ""}
                                />
                                {errors.name && <p className="text-sm text-destructive">{errors.name}</p>}
                            </div>

                            {/* IMO */}
                            <div className="space-y-2">
                                <Label htmlFor="imo">IMO</Label>
                                <Input
                                    id="imo"
                                    name="imo"
                                    value={form.imo}
                                    onChange={handleChange}
                                    placeholder="IMO123456"
                                    className={errors.imo ? "border-destructive" : ""}
                                />
                                {errors.imo && <p className="text-sm text-destructive">{errors.imo}</p>}
                            </div>

                            {/* Vessel Type */}
                            <div className="space-y-2">
                                <Label htmlFor="vesselType">Tipo</Label>
                                <Select
                                    value={form.vesselTypeId}
                                    onValueChange={(v) => handleSelect("vesselTypeId", v)}
                                >
                                    <SelectTrigger id="vesselType">
                                        <SelectValue placeholder="Selecciona un tipo" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {vesselTypes.map((t) => (
                                            <SelectItem key={t.id} value={t.id.toString()}>
                                                {t.name}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                                {errors.vesselTypeId && <p className="text-sm text-destructive">{errors.vesselTypeId}</p>}
                            </div>

                            {/* Vessel Status */}
                            <div className="space-y-2">
                                <Label htmlFor="vesselStatus">Estado</Label>
                                <Select
                                    value={form.vesselStatusId}
                                    onValueChange={(v) => handleSelect("vesselStatusId", v)}
                                >
                                    <SelectTrigger id="vesselStatus">
                                        <SelectValue placeholder="Selecciona un estado" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {vesselStatuses.map((s) => (
                                            <SelectItem key={s.id} value={s.id.toString()}>
                                                {s.name}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                                {errors.vesselStatusId && <p className="text-sm text-destructive">{errors.vesselStatusId}</p>}
                            </div>
                        </div>

                        {/* Descripción */}
                        <div className="space-y-2">
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
                        <div className="space-y-2">
                            <Label htmlFor="photo">Fotografía</Label>
                            <div className="border-2 border-dashed rounded-lg p-4 h-40 flex items-center justify-center relative">
                                {preview ? (
                                    <img src={preview} alt="preview" className="h-full object-contain" />
                                ) : (
                                    <Upload className="h-8 w-8 text-muted-foreground" />
                                )}
                                <input
                                    id="photo"
                                    type="file"
                                    accept="image/*"
                                    onChange={handleImage}
                                    className="absolute inset-0 opacity-0 cursor-pointer"
                                    style={{ zIndex: 10 }}
                                    tabIndex={-1}
                                />
                            </div>
                        </div>

                        {/* Botones */}
                        <div className="flex justify-end space-x-2 pt-4">
                            <Button variant="outline" onClick={() => navigate(`/vessels/${vesselId}`)}>
                                Cancelar
                            </Button>
                            <Button type="submit" disabled={isSubmitting}>
                                {isSubmitting && <Loader2 className="animate-spin mr-2 h-4 w-4" />}
                                Guardar
                            </Button>
                        </div>
                    </form>
                </CardContent>
            </Card>

            {/* ── Dispositivo IoT ─────────────────────────────────────── */}
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <Cpu className="h-5 w-5" />
                        Dispositivo IoT
                    </CardTitle>
                    <CardDescription>
                        Token de autenticación del microcontrolador y control remoto.
                    </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">

                    {/* Token actual */}
                    <div className="space-y-2">
                        <Label>Token del dispositivo</Label>
                        {isLoadingToken ? (
                            <div className="flex items-center gap-2 text-muted-foreground text-sm">
                                <Loader2 className="animate-spin h-4 w-4" /> Cargando…
                            </div>
                        ) : hasToken && deviceToken ? (
                            <div className="flex items-center gap-2">
                                <Input
                                    readOnly
                                    value={tokenVisible ? deviceToken : (maskedToken ?? "")}
                                    className="font-mono text-sm flex-1"
                                />
                                <Button
                                    type="button"
                                    variant="ghost"
                                    size="icon"
                                    title={tokenVisible ? "Ocultar" : "Revelar"}
                                    onClick={() => setTokenVisible(v => !v)}
                                >
                                    {tokenVisible ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                                </Button>
                                <Button
                                    type="button"
                                    variant="ghost"
                                    size="icon"
                                    title="Copiar token"
                                    onClick={handleCopy}
                                >
                                    {copied ? <Check className="h-4 w-4 text-green-500" /> : <Copy className="h-4 w-4" />}
                                </Button>
                            </div>
                        ) : (
                            <p className="text-sm text-muted-foreground italic">
                                Sin token asignado. Genera uno con el botón de abajo.
                            </p>
                        )}
                    </div>

                    {/* Snippet de uso para el firmware */}
                    <div className="space-y-1">
                        <Label className="text-xs text-muted-foreground uppercase tracking-wide">
                            Uso en firmware (Arduino / ESP32)
                        </Label>
                        <pre className="text-xs bg-muted rounded-md p-3 overflow-x-auto select-all">
{`POST /api/v1/device/ping
X-Device-Token: ${tokenVisible && deviceToken ? deviceToken : "<device_token>"}
Content-Type: application/json

{
  "lat": 10.481, "lon": -66.902,
  "speed": 7.4, "course": 270,
  "fuel_level": 72.5, "rpm": 1800, "voltage": 12.6
}`}
                        </pre>
                    </div>

                    {/* Botón configurar ESP32 */}
                    {hasToken && deviceToken && (
                        <Button
                            type="button"
                            variant="outline"
                            className="border-blue-300 text-blue-700 hover:bg-blue-50"
                            onClick={handleOpenEspModal}
                        >
                            <Settings2 className="h-4 w-4 mr-2" />
                            Configurar ESP32
                        </Button>
                    )}

                    {/* Acciones */}
                    <div className="flex flex-wrap gap-3 pt-2">
                        {/* Regenerar token */}
                        <Button
                            type="button"
                            variant={confirmRegen ? "destructive" : "outline"}
                            disabled={isRegenerating}
                            onClick={handleRegenerate}
                        >
                            {isRegenerating
                                ? <><Loader2 className="animate-spin mr-2 h-4 w-4" />Regenerando…</>
                                : confirmRegen
                                    ? "¿Confirmar? (El token anterior quedará inválido)"
                                    : <><RefreshCw className="mr-2 h-4 w-4" />{hasToken ? "Regenerar token" : "Generar token"}</>
                            }
                        </Button>
                        {confirmRegen && (
                            <Button type="button" variant="ghost" onClick={() => setConfirmRegen(false)}>
                                Cancelar
                            </Button>
                        )}

                        {/* Reiniciar dispositivo */}
                        {hasToken && (
                            <>
                                <Button
                                    type="button"
                                    variant={confirmReboot ? "destructive" : "outline"}
                                    disabled={isRebooting}
                                    onClick={handleReboot}
                                >
                                    {isRebooting
                                        ? <><Loader2 className="animate-spin mr-2 h-4 w-4" />Enviando…</>
                                        : confirmReboot
                                            ? "¿Confirmar reinicio remoto?"
                                            : <><Power className="mr-2 h-4 w-4" />Reiniciar dispositivo</>
                                    }
                                </Button>
                                {confirmReboot && (
                                    <Button type="button" variant="ghost" onClick={() => setConfirmReboot(false)}>
                                        Cancelar
                                    </Button>
                                )}
                            </>
                        )}
                    </div>
                </CardContent>
            </Card>

            {/* ── Estado de Conexión ESP32 ────────────────────────────── */}
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <Activity className="h-5 w-5" />
                        Estado de Conexión GPS / ESP32
                    </CardTitle>
                    <CardDescription>
                        Verifica si el dispositivo está online y enviando datos al servidor.
                    </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                    <Button
                        type="button"
                        variant="outline"
                        onClick={checkDeviceStatus}
                        disabled={isCheckingStatus}
                    >
                        {isCheckingStatus
                            ? <><Loader2 className="animate-spin mr-2 h-4 w-4" />Consultando…</>
                            : <><Activity className="mr-2 h-4 w-4" />Verificar conexión</>}
                    </Button>

                    {statusChecked && deviceStatus && (
                        <div className="rounded-lg border p-4 space-y-3">
                            {/* Online / Offline */}
                            <div className="flex items-center gap-3">
                                {deviceStatus.is_online ? (
                                    <>
                                        <span className="relative flex h-3 w-3">
                                            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75" />
                                            <span className="relative inline-flex rounded-full h-3 w-3 bg-green-500" />
                                        </span>
                                        <span className="font-semibold text-green-600 flex items-center gap-1">
                                            <Wifi className="h-4 w-4" /> Dispositivo ONLINE
                                        </span>
                                    </>
                                ) : (
                                    <>
                                        <span className="relative flex h-3 w-3">
                                            <span className="relative inline-flex rounded-full h-3 w-3 bg-red-500" />
                                        </span>
                                        <span className="font-semibold text-red-600 flex items-center gap-1">
                                            <WifiOff className="h-4 w-4" /> Dispositivo OFFLINE
                                        </span>
                                    </>
                                )}
                            </div>

                            {/* Grid de datos */}
                            <div className="grid grid-cols-2 gap-3 text-sm">
                                {deviceStatus.last_seen_ago && (
                                    <div className="flex flex-col gap-0.5">
                                        <span className="text-xs text-muted-foreground flex items-center gap-1">
                                            <Clock className="h-3 w-3" /> Último ping
                                        </span>
                                        <span className="font-mono font-medium">{deviceStatus.last_seen_ago}</span>
                                    </div>
                                )}
                                {deviceStatus.device_ip && (
                                    <div className="flex flex-col gap-0.5">
                                        <span className="text-xs text-muted-foreground flex items-center gap-1">
                                            <MonitorDot className="h-3 w-3" /> IP del dispositivo
                                        </span>
                                        <span className="font-mono font-medium">{deviceStatus.device_ip}</span>
                                    </div>
                                )}
                                {deviceStatus.firmware_version && (
                                    <div className="flex flex-col gap-0.5">
                                        <span className="text-xs text-muted-foreground">Firmware</span>
                                        <span className="font-mono font-medium">{deviceStatus.firmware_version}</span>
                                    </div>
                                )}
                                {deviceStatus.device_uptime_human && (
                                    <div className="flex flex-col gap-0.5">
                                        <span className="text-xs text-muted-foreground">Uptime</span>
                                        <span className="font-mono font-medium">{deviceStatus.device_uptime_human}</span>
                                    </div>
                                )}
                                <div className="flex flex-col gap-0.5">
                                    <span className="text-xs text-muted-foreground">Intervalo de envío</span>
                                    <span className="font-mono font-medium">{deviceStatus.send_interval}s</span>
                                </div>
                                {deviceStatus.pending_command && (
                                    <div className="flex flex-col gap-0.5">
                                        <span className="text-xs text-muted-foreground">Comando pendiente</span>
                                        <span className="font-mono font-medium text-amber-600">{deviceStatus.pending_command}</span>
                                    </div>
                                )}
                            </div>

                            {/* Última posición GPS */}
                            {deviceStatus.last_position && (
                                <div className="border-t pt-3 space-y-2">
                                    <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Última posición GPS</p>
                                    <div className="grid grid-cols-2 gap-2 text-sm">
                                        <div className="flex flex-col gap-0.5">
                                            <span className="text-xs text-muted-foreground">Latitud</span>
                                            <span className="font-mono">{deviceStatus.last_position.latitude.toFixed(6)}°</span>
                                        </div>
                                        <div className="flex flex-col gap-0.5">
                                            <span className="text-xs text-muted-foreground">Longitud</span>
                                            <span className="font-mono">{deviceStatus.last_position.longitude.toFixed(6)}°</span>
                                        </div>
                                    </div>
                                    {/* UTM */}
                                    <div className="rounded-md bg-muted px-3 py-2 space-y-1">
                                        <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">UTM WGS84</p>
                                        <p className="font-mono text-sm">{deviceStatus.last_position.utm.label}</p>
                                        <div className="grid grid-cols-3 gap-2 text-xs text-muted-foreground">
                                            <div><span className="font-medium">Zona: </span>{deviceStatus.last_position.utm.zone}</div>
                                            <div><span className="font-medium">E: </span>{deviceStatus.last_position.utm.easting.toLocaleString()} m</div>
                                            <div><span className="font-medium">N: </span>{deviceStatus.last_position.utm.northing.toLocaleString()} m</div>
                                        </div>
                                    </div>
                                    {/* Quad tile */}
                                    <div className="rounded-md bg-muted px-3 py-2 space-y-1">
                                        <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Quad Tile (zoom {deviceStatus.last_position.quad_tile.zoom})</p>
                                        <p className="font-mono text-xs break-all select-all">{deviceStatus.last_position.quad_tile.quadkey}</p>
                                        <p className="text-xs text-muted-foreground">Tile X: {deviceStatus.last_position.quad_tile.tile_x} · Tile Y: {deviceStatus.last_position.quad_tile.tile_y}</p>
                                    </div>
                                </div>
                            )}

                            {!deviceStatus.is_online && (
                                <p className="text-xs text-muted-foreground border-t pt-2">
                                    El dispositivo no ha enviado datos recientemente. Verifica que el ESP32 esté encendido, con WiFi conectado y que el LED azul parpadee 1 vez/seg (esperando GPS) o esté fijo (enviando).
                                </p>
                            )}
                        </div>
                    )}

                    {statusChecked && !deviceStatus && (
                        <p className="text-sm text-muted-foreground">No se pudo obtener el estado.</p>
                    )}
                </CardContent>
            </Card>

            {notification && (
                <NotificationToast
                    message={notification.message}
                    type={notification.type}
                    onClose={() => setNotification(null)}
                />
            )}

            {/* ── Modal Configurar ESP32 ──────────────────────────────── */}
            <Dialog open={espModalOpen} onOpenChange={setEspModalOpen}>
                <DialogContent className="sm:max-w-lg">
                    <DialogHeader>
                        <DialogTitle className="flex items-center gap-2">
                            <Settings2 className="h-5 w-5 text-blue-600" />
                            Configurar ESP32
                        </DialogTitle>
                        <DialogDescription>
                            Completa los datos de red WiFi y genera la configuración para pegar en el portal del ESP32.
                        </DialogDescription>
                    </DialogHeader>

                    <div className="space-y-4 py-2">
                        {/* Red WiFi */}
                        <div className="rounded-lg border border-amber-200 bg-amber-50/50 p-3 space-y-3">
                            <p className="text-xs font-semibold text-amber-800 uppercase tracking-wide flex items-center gap-1">
                                <Wifi className="h-3.5 w-3.5" /> Red WiFi (no se guarda en servidor)
                            </p>
                            <div className="grid grid-cols-2 gap-3">
                                <div className="space-y-1">
                                    <Label htmlFor="esp-ssid" className="text-xs">Nombre de red (SSID)</Label>
                                    <Input
                                        id="esp-ssid"
                                        placeholder="Mi_WiFi_5G"
                                        value={espWifiSsid}
                                        onChange={(e) => setEspWifiSsid(e.target.value)}
                                    />
                                </div>
                                <div className="space-y-1">
                                    <Label htmlFor="esp-pass" className="text-xs">Contraseña WiFi</Label>
                                    <Input
                                        id="esp-pass"
                                        type="password"
                                        placeholder="••••••••"
                                        value={espWifiPass}
                                        onChange={(e) => setEspWifiPass(e.target.value)}
                                    />
                                </div>
                            </div>
                        </div>

                        {/* Parámetros del dispositivo (solo lectura) */}
                        <div className="space-y-2">
                            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Parámetros del dispositivo</p>
                            <div className="grid grid-cols-1 gap-2 text-sm">
                                <div className="flex justify-between items-center bg-muted/50 rounded px-3 py-1.5">
                                    <span className="text-muted-foreground text-xs">Token</span>
                                    <span className="font-mono text-xs">{deviceToken ? deviceToken.slice(0, 8) + '…' + deviceToken.slice(-4) : '—'}</span>
                                </div>
                                <div className="flex justify-between items-center bg-muted/50 rounded px-3 py-1.5">
                                    <span className="text-muted-foreground text-xs">API URL</span>
                                    <span className="font-mono text-xs truncate ml-2">{((import.meta.env.VITE_API_URL || import.meta.env.VITE_API_NETWORK || import.meta.env.VITE_API_LOCAL || '') as string).replace(/\/v1$/, '') + '/v1/device/ping'}</span>
                                </div>
                                <div className="flex justify-between items-center bg-muted/50 rounded px-3 py-1.5">
                                    <span className="text-muted-foreground text-xs">Intervalo</span>
                                    <span className="font-mono text-xs">{deviceStatus?.send_interval ?? 10}s</span>
                                </div>
                                <div className="flex justify-between items-center bg-muted/50 rounded px-3 py-1.5">
                                    <span className="text-muted-foreground text-xs">Embarcación</span>
                                    <span className="font-mono text-xs">{form.name || '—'}</span>
                                </div>
                            </div>
                        </div>

                        {/* Preview JSON */}
                        <div className="space-y-1">
                            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">JSON que se copiará</p>
                            <pre className="text-[11px] bg-muted rounded-md p-2.5 overflow-x-auto font-mono max-h-32 overflow-y-auto">
{JSON.stringify(buildEspConfig(), null, 2)}
                            </pre>
                        </div>
                    </div>

                    <DialogFooter>
                        <Button variant="outline" onClick={() => setEspModalOpen(false)}>
                            Cerrar
                        </Button>
                        <Button
                            onClick={handleCopyEspConfig}
                            className={configCopied ? "bg-green-600 hover:bg-green-600" : ""}
                        >
                            {configCopied
                                ? <><Check className="h-4 w-4 mr-1.5" />Copiado al portapapeles</>
                                : <><Copy className="h-4 w-4 mr-1.5" />Copiar configuración</>
                            }
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    )
}
