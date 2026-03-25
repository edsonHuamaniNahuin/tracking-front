// src/routes/ProfileRoute.tsx
import React, { type FC } from 'react'
import { Outlet } from 'react-router-dom'
import { useAuth } from '@/context/AuthContext'
import AppLayout from '@/layouts/AppLayout'

const ProfileRoute: FC = () => {
  const { token } = useAuth()
  return token ? (
    <AppLayout>
      <Outlet />
    </AppLayout>
  ) : (
    <Outlet />
  )
}

export default ProfileRoute
