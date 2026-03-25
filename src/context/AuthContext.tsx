// src/context/AuthContext.tsx

import React, { createContext, useState, useEffect } from 'react'
import type { AuthContextResponse, LoginRequest, LoginResponse } from '@/types/auth'
import { authService } from '@/services/auth.service'
import type { User } from '@/types/user'
import api from '@/services/api'
import settingsService from '@/services/settings.service'
import { setSystemTimezone } from '@/utils/date'




export const AuthContext = createContext<AuthContextResponse | undefined>(undefined)

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [initializing, setInitializing] = useState<boolean>(true)




  /**
   * Interceptor: en caso de 401, cerramos sesión directamente.
   */
  useEffect(() => {
    const interceptor = api.interceptors.response.use(
      response => response,
      err => {
        if (err.response?.status === 401) {
          clearSession()
        }
        return Promise.reject(err)
      }
    )
    return () => api.interceptors.response.eject(interceptor)
  }, [])

  /** Carga la zona horaria del sistema desde la API */
  async function loadSystemTimezone() {
    try {
      const setting = await settingsService.get('timezone')
      setSystemTimezone(String(setting.value))
    } catch {
      // Mantiene el default America/Lima
    }
  }

  /**
   * Al montar: carga token, user y expiración desde localStorage.
   * Si ha expirado, solicita al usuario re-login.
   */
  useEffect(() => {
    (async () => {
      const token = localStorage.getItem('access_token')
      const stored = localStorage.getItem('user')
      const expiresAt = Number(localStorage.getItem('expires_at'))

      if (token && stored && expiresAt) {
        // ¿Sigue vigente?
        if (Date.now() < expiresAt) {
          const u = JSON.parse(stored) as User
          setSession(token, u, undefined)
          setUser(u)
          await loadSystemTimezone()
        } else {
          clearSession()
        }
      }
      setInitializing(false)
    })()
  }, [])

  /**
   * Guarda token, usuario y expiración en Storage y en headers.
   */
  function setSession(token: string, u: User, expiresIn?: number) {
    localStorage.setItem('access_token', token)
    localStorage.setItem('user', JSON.stringify(u))
    if (expiresIn) {
      const expiresAt = Date.now() + expiresIn * 1000
      localStorage.setItem('expires_at', expiresAt.toString())
    }
    api.defaults.headers.Authorization = `Bearer ${token}`
  }

  /**
   * Elimina datos de sesión de Storage y headers.
   */
  function clearSession() {
    localStorage.removeItem('access_token')
    localStorage.removeItem('user')
    localStorage.removeItem('expires_at')
    delete api.defaults.headers.Authorization
    setUser(null)
  }

  /**
   * Realiza login: guarda sesión con expiración y setea user.
   */

  async function login(request: LoginRequest) {
    setLoading(true)
    setError(null)

    try {
      const resp: LoginResponse = await authService.login(request)
      if (!resp.data) return
      const { access_token, user: u, expires_in } = resp.data
      setSession(access_token, u, expires_in)
      setUser(u)
      await loadSystemTimezone()
    } catch (err: any) {
      setError(err.response.data.message || 'Error al iniciar sesión')
      clearSession()
    } finally {
      setLoading(false)
    }

  }
  /**
   * Logout explícito.
   */
  async function logout() {
    await authService.logout()
    clearSession()
  }
  /* async function logout() {
    try {
      await authService.logout()
    } catch (e) {
      // da igual que falle: igual limpiamos
    } finally {
      clearSession()
    }
  } */

  return (
    <AuthContext.Provider value={{ user, initializing, loading, error, login, logout }}>
      {children}
    </AuthContext.Provider>
  )
}
