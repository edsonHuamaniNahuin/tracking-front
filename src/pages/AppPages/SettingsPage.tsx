import { useEffect, useState } from 'react'
import {
  Settings2, Globe, Save, Loader2, CheckCircle2, AlertCircle, Plus, Trash2
} from 'lucide-react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Separator } from '@/components/ui/separator'
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import {
  Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger,
} from '@/components/ui/dialog'
import settingsService, { type SystemSetting } from '@/services/settings.service'
import { setSystemTimezone, getSystemTimezone } from '@/utils/date'

const TIMEZONES = [
  'America/Lima',
  'America/Bogota',
  'America/Guayaquil',
  'America/Santiago',
  'America/Buenos_Aires',
  'America/Sao_Paulo',
  'America/Mexico_City',
  'America/New_York',
  'America/Chicago',
  'America/Denver',
  'America/Los_Angeles',
  'America/Caracas',
  'America/La_Paz',
  'America/Montevideo',
  'America/Asuncion',
  'Europe/Madrid',
  'Europe/London',
  'UTC',
]

export default function SettingsPage() {
  const [settings, setSettings] = useState<Record<string, SystemSetting[]>>({})
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [status, setStatus] = useState<{ type: 'success' | 'error'; message: string } | null>(null)

  // Nuevo setting
  const [dialogOpen, setDialogOpen] = useState(false)
  const [newSetting, setNewSetting] = useState({ key: '', value: '', label: '', group: 'general' })

  // Cambios pendientes
  const [changes, setChanges] = useState<Record<string, string>>({})

  useEffect(() => {
    loadSettings()
  }, [])

  useEffect(() => {
    if (status) {
      const timer = setTimeout(() => setStatus(null), 4000)
      return () => clearTimeout(timer)
    }
  }, [status])

  async function loadSettings() {
    try {
      setLoading(true)
      const data = await settingsService.getAll()
      setSettings(data)
      setChanges({})
    } catch {
      setStatus({ type: 'error', message: 'Error al cargar la configuración' })
    } finally {
      setLoading(false)
    }
  }

  function handleChange(key: string, value: string) {
    setChanges(prev => ({ ...prev, [key]: value }))
  }

  function getCurrentValue(setting: SystemSetting): string {
    if (changes[setting.key] !== undefined) return changes[setting.key]
    return String(setting.value)
  }

  async function handleSave() {
    const pending = Object.entries(changes)
    if (pending.length === 0) return

    setSaving(true)
    setStatus(null)

    try {
      const settingsToUpdate = pending.map(([key, value]) => ({ key, value }))
      await settingsService.batchUpdate(settingsToUpdate)

      // Aplicar timezone si cambió
      if (changes['timezone']) {
        setSystemTimezone(changes['timezone'])
      }

      setStatus({ type: 'success', message: `${pending.length} configuración(es) guardada(s) correctamente` })
      await loadSettings()
    } catch {
      setStatus({ type: 'error', message: 'Error al guardar la configuración' })
    } finally {
      setSaving(false)
    }
  }

  async function handleAddSetting() {
    if (!newSetting.key || !newSetting.value) return
    setSaving(true)
    try {
      await settingsService.update(newSetting.key, newSetting.value)
      setDialogOpen(false)
      setNewSetting({ key: '', value: '', label: '', group: 'general' })
      setStatus({ type: 'success', message: `Configuración "${newSetting.key}" creada` })
      await loadSettings()
    } catch {
      setStatus({ type: 'error', message: 'Error al crear la configuración' })
    } finally {
      setSaving(false)
    }
  }

  const hasChanges = Object.keys(changes).length > 0

  function renderSettingInput(setting: SystemSetting) {
    const value = getCurrentValue(setting)

    if (setting.key === 'timezone') {
      return (
        <Select value={value} onValueChange={(v) => handleChange(setting.key, v)}>
          <SelectTrigger className="w-full max-w-xs">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {TIMEZONES.map((tz) => (
              <SelectItem key={tz} value={tz}>{tz}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      )
    }

    if (setting.type === 'boolean') {
      return (
        <Select value={value} onValueChange={(v) => handleChange(setting.key, v)}>
          <SelectTrigger className="w-full max-w-xs">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="true">Sí</SelectItem>
            <SelectItem value="false">No</SelectItem>
          </SelectContent>
        </Select>
      )
    }

    return (
      <Input
        value={value}
        onChange={(e) => handleChange(setting.key, e.target.value)}
        className="max-w-xs"
      />
    )
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full min-h-[60vh]">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    )
  }

  const groups = Object.entries(settings)

  return (
    <div className="mx-auto max-w-4xl space-y-6 p-4 md:p-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2">
            <Settings2 className="h-6 w-6" />
            Configuración del Sistema
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            Configuraciones globales que aplican a toda la plataforma
          </p>
        </div>
        <div className="flex gap-2">
          <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
            <DialogTrigger asChild>
              <Button variant="outline" size="sm">
                <Plus className="h-4 w-4 mr-1" /> Nueva
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Nueva Configuración</DialogTitle>
                <DialogDescription>
                  Agrega una nueva configuración al sistema
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4 py-2">
                <div className="space-y-2">
                  <Label>Clave (key)</Label>
                  <Input
                    value={newSetting.key}
                    onChange={(e) => setNewSetting(p => ({ ...p, key: e.target.value }))}
                    placeholder="ej: app_name"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Valor</Label>
                  <Input
                    value={newSetting.value}
                    onChange={(e) => setNewSetting(p => ({ ...p, value: e.target.value }))}
                    placeholder="ej: Mi Aplicación"
                  />
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setDialogOpen(false)}>Cancelar</Button>
                <Button onClick={handleAddSetting} disabled={saving || !newSetting.key || !newSetting.value}>
                  {saving ? <Loader2 className="h-4 w-4 animate-spin mr-1" /> : null}
                  Crear
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>

          <Button onClick={handleSave} disabled={saving || !hasChanges} size="sm">
            {saving ? <Loader2 className="h-4 w-4 animate-spin mr-1" /> : <Save className="h-4 w-4 mr-1" />}
            Guardar cambios
          </Button>
        </div>
      </div>

      {/* Alerts */}
      {status && (
        <Alert variant={status.type === 'error' ? 'destructive' : 'default'}>
          {status.type === 'success' ? <CheckCircle2 className="h-4 w-4" /> : <AlertCircle className="h-4 w-4" />}
          <AlertTitle>{status.type === 'success' ? 'Éxito' : 'Error'}</AlertTitle>
          <AlertDescription>{status.message}</AlertDescription>
        </Alert>
      )}

      {/* Timezone info card */}
      <Card className="border-blue-200 bg-blue-50/50 dark:border-blue-900 dark:bg-blue-950/20">
        <CardContent className="flex items-center gap-3 py-3">
          <Globe className="h-5 w-5 text-blue-600 dark:text-blue-400 shrink-0" />
          <div className="text-sm">
            <span className="font-medium">Zona horaria activa: </span>
            <code className="px-1.5 py-0.5 rounded bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200 font-mono text-xs">
              {getSystemTimezone()}
            </code>
            <span className="text-muted-foreground ml-2">
              — Todas las fechas del sistema se muestran en esta zona horaria
            </span>
          </div>
        </CardContent>
      </Card>

      {/* Settings groups */}
      {groups.map(([groupName, groupSettings]) => (
        <Card key={groupName}>
          <CardHeader className="pb-3">
            <CardTitle className="text-lg capitalize">{groupName}</CardTitle>
            <CardDescription>
              {groupName === 'general' && 'Configuraciones generales del sistema'}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {groupSettings.map((setting, i) => (
              <div key={setting.key}>
                {i > 0 && <Separator className="mb-4" />}
                <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4">
                  <div className="flex-1 min-w-0">
                    <Label className="font-medium">
                      {setting.label || setting.key}
                    </Label>
                    {setting.description && (
                      <p className="text-xs text-muted-foreground mt-0.5">{setting.description}</p>
                    )}
                    <p className="text-[10px] text-muted-foreground font-mono mt-0.5">key: {setting.key}</p>
                  </div>
                  <div className="shrink-0">
                    {renderSettingInput(setting)}
                  </div>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      ))}

      {groups.length === 0 && (
        <Card>
          <CardContent className="py-12 text-center text-muted-foreground">
            No hay configuraciones registradas. Haz clic en "Nueva" para crear una.
          </CardContent>
        </Card>
      )}
    </div>
  )
}
