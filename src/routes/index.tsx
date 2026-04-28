/**
 * src/routes/index.tsx
 *
 * ÚNICA fuente de verdad para todas las rutas de la aplicación.
 * App.tsx solo contiene providers + <HashRouter> y llama a <AppRoutes />.
 *
 * Para agregar una nueva vista:
 *   1. Añadir un React.lazy() abajo en la sección correspondiente
 *   2. Agregar un <Route> dentro del grupo correcto
 *   Todo lo demás (auth guard, layout, suspense) ya está resuelto.
 */

import React, { Suspense, lazy } from 'react'
import { Routes, Route, Navigate } from 'react-router-dom'
import { Loader2Icon } from 'lucide-react'
import AppLayout from '@/layouts/AppLayout'
import PublicRoute from '@/routes/PublicRoute'
import PrivateRoute from '@/routes/PrivateRoute'

// ── Fallback de carga (lazy chunks) ───────────────────────────────────────────
const PageLoader = () => (
  <div className="flex items-center justify-center h-full min-h-[60vh]">
    <Loader2Icon className="h-8 w-8 animate-spin text-muted-foreground" />
  </div>
)

// ── Páginas públicas ──────────────────────────────────────────────────────────
const SignIn = lazy(() => import('@/pages/AuthPages/PageSignIn'))

// ── Páginas privadas — General ────────────────────────────────────────────────
const HomePage      = lazy(() => import('@/pages/HomePage'))
const DashboardPage = lazy(() => import('@/pages/AppPages/DashboardPage'))
const UserProfilePage = lazy(() => import('@/pages/AppPages/UserProfilePage'))

// ── Páginas privadas — Unidades ─────────────────────────────────────────
const VesselsPage      = lazy(() => import('@/pages/AppPages/vessels/VesselsPage'))
const VesselsChartsPage = lazy(() => import('@/pages/AppPages/vessels/VesselsChartsPage'))
const VesselCreatePage = lazy(() => import('@/pages/AppPages/vessels/create/page'))
const VesselUpdatePage = lazy(() => import('@/pages/AppPages/vessels/update/page'))
const VesselViewPage   = lazy(() => import('@/pages/AppPages/vessels/view/page'))

// ── Páginas privadas — Flotas ──────────────────────────────────────────────
const FleetManagementPage = lazy(() => import('@/pages/AppPages/fleets/FleetManagementPage'))

// ── Páginas privadas — Tracking ───────────────────────────────────────────────
const TrackingMapPage = lazy(() => import('@/pages/AppPages/tracking/TrackingMapPage'))

// ── Páginas privadas — Telemetría ─────────────────────────────────────────────
const TelemetryPage = lazy(() => import('@/pages/AppPages/telemetry/TelemetryPage'))

// ── Páginas privadas — Dispositivo ────────────────────────────────────────────
const DeviceLogsPage = lazy(() => import('@/pages/AppPages/device/DeviceLogsPage'))

// ── Páginas privadas — Configuración ──────────────────────────────────────────
const SettingsPage = lazy(() => import('@/pages/AppPages/SettingsPage'))

// ── Páginas privadas — Roles y Permisos ───────────────────────────────────────
const RolesPage = lazy(() => import('@/pages/AppPages/roles/RolesPage'))

// ─────────────────────────────────────────────────────────────────────────────

export default function AppRoutes() {
  return (
    <Suspense fallback={<PageLoader />}>
      <Routes>
        {/* ── Rutas públicas (redirigen a / si ya estás autenticado) ── */}
        <Route element={<PublicRoute />}>
          <Route path="/signin" element={<SignIn />} />
        </Route>

        {/* ── Rutas privadas (redirigen a /signin si no estás autenticado) ── */}
        <Route element={<PrivateRoute />}>
          <Route element={<AppLayout />}>

            {/* General */}
            <Route path="/"          element={<HomePage />} />
            <Route path="/dashboard" element={<DashboardPage />} />
            <Route path="/user"      element={<UserProfilePage />} />

            {/* Unidades */}
            <Route path="/vessels"              element={<VesselsPage />} />
            <Route path="/vessels/charts"       element={<VesselsChartsPage />} />
            <Route path="/vessels/create"       element={<VesselCreatePage />} />
            <Route path="/vessels/:id/edit"     element={<VesselUpdatePage />} />
            <Route path="/vessels/:id"          element={<VesselViewPage />} />

            {/* Alias /unidades → /vessels */}
            <Route path="/unidades"             element={<Navigate to="/vessels" replace />} />
            <Route path="/unidades/charts"      element={<Navigate to="/vessels/charts" replace />} />
            <Route path="/unidades/create"      element={<Navigate to="/vessels/create" replace />} />

            {/* Flotas */}
            <Route path="/fleets" element={<FleetManagementPage />} />

            {/* Tracking */}
            <Route path="/tracking/map" element={<TrackingMapPage />} />

            {/* Telemetría */}
            <Route path="/telemetry" element={<TelemetryPage />} />

            {/* Dispositivo */}
            <Route path="/device/logs" element={<DeviceLogsPage />} />

            {/* Configuración */}
            <Route path="/settings" element={<SettingsPage />} />

            {/* Roles y Permisos */}
            <Route path="/roles" element={<RolesPage />} />

          </Route>
        </Route>

        {/* Fallback — cualquier ruta desconocida va al dashboard */}
        <Route path="*" element={<Navigate to="/dashboard" replace />} />
      </Routes>
    </Suspense>
  )
}
