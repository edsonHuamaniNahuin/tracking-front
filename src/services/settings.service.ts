import api from './api'

export interface SystemSetting {
  key: string
  value: string | number | boolean | Record<string, unknown>
  type: string
  label: string | null
  description: string | null
  group?: string
}

const settingsService = {
  getAll: async (): Promise<Record<string, SystemSetting[]>> => {
    const response = await api.get('/settings')
    return response.data.data
  },

  get: async (key: string): Promise<SystemSetting> => {
    const response = await api.get(`/settings/${key}`)
    return response.data.data
  },

  update: async (key: string, value: string | number | boolean): Promise<SystemSetting> => {
    const response = await api.put(`/settings/${key}`, { value })
    return response.data.data
  },

  batchUpdate: async (settings: { key: string; value: string | number | boolean }[]): Promise<{ updated_keys: string[] }> => {
    const response = await api.put('/settings', { settings })
    return response.data.data
  },
}

export default settingsService
