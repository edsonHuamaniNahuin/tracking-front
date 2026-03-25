// src/routes/PrivateRoute.tsx
import { Navigate, Outlet } from 'react-router-dom'
import useAuth from '@/hooks/useAuth'
import { Loader2Icon } from 'lucide-react'

export default function PrivateRoute() {
  const { user, initializing } = useAuth()


  if (initializing) {
    return (
      <div className="flex items-center justify-center h-full">
        <Loader2Icon className="h-8 w-8 animate-spin text-gray-500" />
      </div>
    )
  }
  return user ? <Outlet /> : <Navigate to="/signin" replace />
}
