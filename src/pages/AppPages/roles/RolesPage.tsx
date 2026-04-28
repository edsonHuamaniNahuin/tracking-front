// src/pages/AppPages/roles/RolesPage.tsx
import { useState, useEffect, useCallback } from 'react'
import {
  ShieldIcon,
  UsersIcon,
  KeyRoundIcon,
  CheckIcon,
  XIcon,
  RefreshCwIcon,
  ChevronDownIcon,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible'
import { Checkbox } from '@/components/ui/checkbox'
import { Separator } from '@/components/ui/separator'
import {
  roleManagementService,
  type RoleWithPermissions,
  type UserWithRoles,
  type Permission,
} from '@/services/roleManagement.service'
import useAuth from '@/hooks/useAuth'

const PROTECTED_ADMIN_EMAIL = 'admin@tracking.com'

const ROLE_COLORS: Record<string, string> = {
  Administrator: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200',
  Manager:       'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200',
  Operator:      'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200',
  Viewer:        'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200',
  Guest:         'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300',
}

export default function RolesPage() {
  const { user: me } = useAuth()

  const [roles, setRoles]               = useState<RoleWithPermissions[]>([])
  const [allPerms, setAllPerms]         = useState<Permission[]>([])
  const [users, setUsers]               = useState<UserWithRoles[]>([])
  const [loading, setLoading]           = useState(false)
  const [saving, setSaving]             = useState<string | null>(null)
  const [notification, setNotification] = useState<string | null>(null)
  const [draft, setDraft]               = useState<Record<string, Set<string>>>({})

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const [r, p, u] = await Promise.all([
        roleManagementService.getRoles(),
        roleManagementService.getPermissions(),
        roleManagementService.getUsers(),
      ])
      setRoles(r)
      setAllPerms(p)
      setUsers(u)
      const initialDraft: Record<string, Set<string>> = {}
      r.forEach(role => { initialDraft[role.name] = new Set(role.permissions.map(p => p.name)) })
      setDraft(initialDraft)
    } catch {
      notify('Error al cargar datos.')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { load() }, [load])

  function notify(msg: string) {
    setNotification(msg)
    setTimeout(() => setNotification(null), 3500)
  }

  function togglePerm(roleName: string, perm: string) {
    setDraft(prev => {
      const next = new Set(prev[roleName] ?? [])
      if (next.has(perm)) next.delete(perm)
      else next.add(perm)
      return { ...prev, [roleName]: next }
    })
  }

  async function saveRolePerms(roleName: string) {
    setSaving(roleName)
    try {
      await roleManagementService.syncRolePermissions(roleName, [...(draft[roleName] ?? [])])
      await load()
      notify(`Permisos de '${roleName}' guardados.`)
    } catch {
      notify('Error al guardar permisos.')
    } finally {
      setSaving(null)
    }
  }

  async function handleAssignRole(userId: number, role: string) {
    try {
      await roleManagementService.assignRole(userId, role)
      await load()
      notify(`Rol '${role}' asignado.`)
    } catch {
      notify('Error al asignar rol.')
    }
  }

  async function handleRevokeRole(userId: number, role: string, email: string) {
    if (email === PROTECTED_ADMIN_EMAIL && role === 'Administrator') return
    try {
      await roleManagementService.revokeRole(userId, role)
      await load()
      notify(`Rol '${role}' revocado.`)
    } catch {
      notify('Error al revocar rol.')
    }
  }

  const isProtectedAdmin = (u: UserWithRoles) => u.email === PROTECTED_ADMIN_EMAIL

  return (
    <div className="w-full px-3 sm:px-6 py-4 sm:py-6 space-y-6 sm:space-y-8">

      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold flex items-center gap-2">
            <ShieldIcon className="h-5 w-5 sm:h-6 sm:w-6 shrink-0" />
            Roles y Permisos
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            Gestiona que puede hacer cada rol y que roles tienen los usuarios.
          </p>
        </div>
        <Button variant="outline" size="sm" onClick={load} disabled={loading} className="w-full sm:w-auto">
          <RefreshCwIcon className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
          Recargar
        </Button>
      </div>

      {notification && (
        <div className="rounded-md border border-green-300 bg-green-50 dark:bg-green-950 dark:border-green-800 px-4 py-2 text-sm text-green-800 dark:text-green-200">
          {notification}
        </div>
      )}

      <section className="space-y-3">
        <h2 className="text-base sm:text-lg font-semibold flex items-center gap-2">
          <KeyRoundIcon className="h-4 w-4 sm:h-5 sm:w-5 shrink-0" />
          Permisos por rol
        </h2>

        {roles.map(role => {
          const draftPerms = draft[role.name] ?? new Set<string>()
          const isDirty = JSON.stringify([...draftPerms].sort()) !==
                          JSON.stringify([...role.permissions.map(p => p.name)].sort())

          return (
            <Collapsible key={role.name}>
              <Card className="overflow-hidden">
                <CardHeader className="py-3 px-3 sm:px-4">
                  <CollapsibleTrigger asChild>
                    <div className="flex items-start sm:items-center justify-between gap-2 cursor-pointer select-none">
                      <div className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-3 min-w-0">
                        <CardTitle className="text-sm sm:text-base leading-tight">{role.name}</CardTitle>
                        <div className="flex flex-wrap items-center gap-1.5">
                          <span className={`text-xs px-2 py-0.5 rounded-full font-medium whitespace-nowrap ${ROLE_COLORS[role.name] ?? 'bg-muted text-muted-foreground'}`}>
                            {role.permissions.length} permisos
                          </span>
                          {isDirty && (
                            <span className="text-xs text-yellow-600 dark:text-yellow-400 font-medium whitespace-nowrap">
                              sin guardar
                            </span>
                          )}
                        </div>
                      </div>
                      <ChevronDownIcon className="h-4 w-4 text-muted-foreground shrink-0 mt-0.5 sm:mt-0 transition-transform [[data-state=open]_&]:rotate-180" />
                    </div>
                  </CollapsibleTrigger>
                </CardHeader>

                <CollapsibleContent>
                  <CardContent className="pt-0 pb-4 px-3 sm:px-4 space-y-4">
                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-y-2 gap-x-4">
                      {allPerms.map(perm => (
                        <label
                          key={perm.name}
                          className="flex items-center gap-2 text-sm cursor-pointer min-w-0"
                        >
                          <Checkbox
                            checked={draftPerms.has(perm.name)}
                            onCheckedChange={() => togglePerm(role.name, perm.name)}
                            disabled={role.name === 'Administrator'}
                            className="shrink-0"
                          />
                          <span className={`leading-tight ${role.name === 'Administrator' ? 'text-muted-foreground' : ''}`}>
                            {perm.label}
                          </span>
                        </label>
                      ))}
                    </div>

                    {role.name !== 'Administrator' ? (
                      <div className="flex flex-col-reverse sm:flex-row justify-end gap-2 pt-1">
                        <Button
                          variant="outline"
                          size="sm"
                          className="w-full sm:w-auto"
                          onClick={() => setDraft(prev => ({
                            ...prev,
                            [role.name]: new Set(role.permissions.map(p => p.name)),
                          }))}
                          disabled={!isDirty}
                        >
                          Descartar
                        </Button>
                        <Button
                          size="sm"
                          className="w-full sm:w-auto"
                          onClick={() => saveRolePerms(role.name)}
                          disabled={!isDirty || saving === role.name}
                        >
                          {saving === role.name ? 'Guardando...' : 'Guardar permisos'}
                        </Button>
                      </div>
                    ) : (
                      <p className="text-xs text-muted-foreground">
                        El rol Administrator siempre tiene todos los permisos y no puede editarse.
                      </p>
                    )}
                  </CardContent>
                </CollapsibleContent>
              </Card>
            </Collapsible>
          )
        })}
      </section>

      <Separator />

      <section className="space-y-3">
        <h2 className="text-base sm:text-lg font-semibold flex items-center gap-2">
          <UsersIcon className="h-4 w-4 sm:h-5 sm:w-5 shrink-0" />
          Usuarios y roles asignados
        </h2>

        <div className="space-y-2">
          {users.map(u => (
            <Card key={u.id}>
              <CardContent className="py-3 px-3 sm:px-4">
                <div className="flex flex-col gap-2">
                  <div className="min-w-0">
                    <p className="font-medium text-sm truncate">
                      {u.name}
                      {isProtectedAdmin(u) && (
                        <span className="ml-2 text-xs text-red-600 dark:text-red-400 font-normal">
                          (admin protegido)
                        </span>
                      )}
                    </p>
                    <p className="text-xs text-muted-foreground truncate">{u.email}</p>
                  </div>

                  <div className="flex flex-wrap items-center gap-1.5">
                    {u.roles.map(role => (
                      <span
                        key={role}
                        className={`inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded-full font-medium ${ROLE_COLORS[role] ?? 'bg-muted text-muted-foreground'}`}
                      >
                        {role}
                        {!(isProtectedAdmin(u) && role === 'Administrator') && u.email !== me?.email && (
                          <button
                            onClick={() => handleRevokeRole(u.id, role, u.email)}
                            className="hover:text-red-500 ml-0.5"
                            title={`Quitar rol ${role}`}
                          >
                            <XIcon className="h-3 w-3" />
                          </button>
                        )}
                      </span>
                    ))}

                    {roles
                      .filter(r => !u.roles.includes(r.name))
                      .map(r => (
                        <button
                          key={r.name}
                          onClick={() => handleAssignRole(u.id, r.name)}
                          className="inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded-full border border-dashed border-muted-foreground/40 text-muted-foreground hover:border-primary hover:text-primary transition-colors"
                          title={`Asignar rol ${r.name}`}
                        >
                          <CheckIcon className="h-3 w-3" />
                          {r.name}
                        </button>
                      ))}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </section>
    </div>
  )
}
