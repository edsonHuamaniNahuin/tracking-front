// src/services/roleManagement.service.ts
import api from './api'

export interface Permission {
  name: string
  label: string
}

export interface RoleWithPermissions {
  id: number
  name: string
  permissions: Permission[]
}

export interface UserWithRoles {
  id: number
  name: string
  email: string
  avatar: string | null
  roles: string[]
}

export const roleManagementService = {
  getRoles: async (): Promise<RoleWithPermissions[]> => {
    const res = await api.get<{ data: RoleWithPermissions[] }>('/roles')
    return res.data.data
  },

  getPermissions: async (): Promise<Permission[]> => {
    const res = await api.get<{ data: Permission[] }>('/permissions')
    return res.data.data
  },

  getUsers: async (): Promise<UserWithRoles[]> => {
    const res = await api.get<{ data: UserWithRoles[] }>('/users')
    return res.data.data
  },

  assignRole: async (userId: number, role: string): Promise<void> => {
    await api.post(`/users/${userId}/roles`, { role })
  },

  revokeRole: async (userId: number, role: string): Promise<void> => {
    await api.delete(`/users/${userId}/roles/${role}`)
  },

  syncRolePermissions: async (roleName: string, permissions: string[]): Promise<void> => {
    await api.put(`/roles/${roleName}/permissions`, { permissions })
  },
}
