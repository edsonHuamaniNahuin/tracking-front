// src/context/AuthContext.tsx

import React, { createContext, useState, useEffect, useRef, useCallback } from 'react'
import type { AuthContextResponse, LoginRequest, LoginResponse } from '@/types/auth'
import { authService } from '@/services/auth.service'
import type { User } from '@/types/user'
import api from '@/services/api'
import settingsService from '@/services/settings.service'
import { setSystemTimezone } from '@/utils/date'
import { trackingCacheService } from '@/services/trackingCache.service'
import { SessionExpiredModal } from '@/components/auth/SessionExpiredModal'

// Mostrar aviso X ms antes de que expire el token (2 minutos)
const WARNING_BEFORE_EXPIRY_MS = 2 * 60 * 1000

export const AuthContext = createContext<AuthContextResponse | undefined>(undefined)

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser]             = useState<User | null>(null)
  const [loading, setLoading]       = useState(false)
  const [error, setError]           = useState<string | null>(null)
  const [initializing, setInitializing] = useState<boolean>(true)

  // ── Estado del modal de sesión caducada ────────────────────────────────────
  const [showExpiredModal, setShowExpiredModal] = useState(false)
  const [isRefreshing, setIsRefreshing]         = useState(false)
  const [refreshError, setRefreshError]         = useState<string | null>(null)

  // Evitar mostrar el modal múltiples veces si llegan varios 401 simultáneos
  const expiredModalShownRef = useRef(false)

  // Ref con el timer del aviso previo a expiración
  const warningTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  // ── Helpers para programar el aviso ───────────────────────────────────────
  function clearWarningTimer() {
    if (warningTimerRef.current) {
      clearTimeout(warningTimerRef.current)
      warningTimerRef.current = null
    }
  }

  function scheduleExpiryWarning(expiresAt: number) {
    clearWarningTimer()
    const delay = expiresAt - WARNING_BEFORE_EXPIRY_MS - Date.now()
    if (delay <= 0) {
      // Ya estamos dentro de la ventana de aviso (o expirado)
      triggerExpiredModal()
      return
    }
    warningTimerRef.current = setTimeout(() => triggerExpiredModal(), delay)
  }

  function triggerExpiredModal() {
    if (expiredModalShownRef.current) return
    expiredModalShownRef.current = true
    setShowExpiredModal(true)
  }

  // ── Interceptor 401 ───────────────────────────────────────────────────────
  useEffect(() => {
    const interceptor = api.interceptors.response.use(
      response => response,
      err => {
        if (err.response?.status === 401) {
          // Ignorar 401 de rutas de auth — esos flujos gestionan el error
          // directamente y no deben disparar el modal de sesión expirada.
          const url: string = err.config?.url ?? ''
          const isAuthEndpoint = url.includes('/auth/login') || url.includes('/auth/refresh') || url.includes('/auth/logout')
          if (!isAuthEndpoint) {
            triggerExpiredModal()
          }
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

  /** Al montar: restaura sesión desde localStorage. */
  useEffect(() => {
    (async () => {
      const token     = localStorage.getItem('access_token')
      const stored    = localStorage.getItem('user')
      const expiresAt = Number(localStorage.getItem('expires_at'))

      if (token && stored && expiresAt) {
        if (Date.now() < expiresAt) {
          const u = JSON.parse(stored) as User
          setSession(token, u, undefined)
          setUser(u)
          scheduleExpiryWarning(expiresAt)
          await loadSystemTimezone()
        } else {
          // Token ya expirado al cargar → mostrar modal (puede renovar si está en ventana)
          triggerExpiredModal()
          api.defaults.headers.Authorization = `Bearer ${token}` // necesario para /auth/refresh
        }
      }
      setInitializing(false)
    })()
    return () => clearWarningTimer()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  /** Guarda token, usuario y expiración en Storage y headers. */
  function setSession(token: string, u: User, expiresIn?: number) {
    localStorage.setItem('access_token', token)
    localStorage.setItem('user', JSON.stringify(u))
    if (expiresIn !== undefined) {
      const expiresAt = Date.now() + expiresIn * 1000
      localStorage.setItem('expires_at', expiresAt.toString())
      scheduleExpiryWarning(expiresAt)
    }
    api.defaults.headers.Authorization = `Bearer ${token}`
  }

  /** Elimina datos de sesión de Storage y headers (sin limpiar IndexedDB — lo hace performLogout). */
  function clearSessionStorage() {
    clearWarningTimer()
    localStorage.removeItem('access_token')
    localStorage.removeItem('user')
    localStorage.removeItem('expires_at')
    delete api.defaults.headers.Authorization
    setUser(null)
  }

  /** Logout completo: invalida token, borra caché IndexedDB y limpia sesión. */
  const performLogout = useCallback(async () => {
    setShowExpiredModal(false)
    expiredModalShownRef.current = false
    try { await authService.logout() } catch { /* da igual si falla */ }
    await trackingCacheService.clear()   // ← borra toda la caché por seguridad
    clearSessionStorage()
  }, [])

  /** El usuario eligió renovar el token desde el modal. */
  const handleRefreshSession = useCallback(async () => {
    setIsRefreshing(true)
    setRefreshError(null)
    try {
      const resp: LoginResponse = await authService.refreshToken()
      if (!resp.data) throw new Error('Sin datos en la respuesta')
      const { access_token, user: u, expires_in } = resp.data
      setSession(access_token, u, expires_in)
      setUser(u)
      setShowExpiredModal(false)
      expiredModalShownRef.current = false
    } catch {
      setRefreshError(
        'No se pudo renovar la sesión. La ventana de renovación puede haber expirado.'
      )
      // Espera 2s para que el usuario lea el error y luego hace logout
      setTimeout(() => performLogout(), 2000)
    } finally {
      setIsRefreshing(false)
    }
  }, [performLogout])

  /** Login desde la pantalla de acceso. */
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
      setError(err.response?.data?.message || 'Error al iniciar sesión')
      clearSessionStorage()
    } finally {
      setLoading(false)
    }
  }

  /** Logout explícito (botón de cerrar sesión). */
  async function logout() {
    await performLogout()
  }

  /** Comprueba si el usuario tiene un rol específico. */
  function hasRole(role: string): boolean {
    return user?.roles?.includes(role) ?? false
  }

  /** Comprueba si el usuario tiene un permiso específico. */
  function hasPermission(permission: string): boolean {
    return user?.permissions?.includes(permission) ?? false
  }

  return (
    <AuthContext.Provider value={{ user, initializing, loading, error, login, logout, hasRole, hasPermission }}>
      {children}

      {/* Modal de sesión caducada — renderizado aquí para estar siempre disponible */}
      <SessionExpiredModal
        open={showExpiredModal}
        isRefreshing={isRefreshing}
        error={refreshError}
        onContinue={handleRefreshSession}
        onLogout={performLogout}
      />
    </AuthContext.Provider>
  )
}
