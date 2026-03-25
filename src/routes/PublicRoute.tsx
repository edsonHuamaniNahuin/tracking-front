// src/routes/PublicRoute.tsx
import { Navigate, Outlet } from 'react-router-dom'
import useAuth from '@/hooks/useAuth'
import { Loader2Icon } from 'lucide-react'

export default function PublicRoute() {
  const { user, initializing } = useAuth()

  if (initializing) {
    return (
      <div className="flex items-center justify-center h-full">
        <Loader2Icon className="h-8 w-8 animate-spin text-gray-500" />
      </div>
    )
  }

  return user ? <Navigate to="/" replace /> : <Outlet />
}
