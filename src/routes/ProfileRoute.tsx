// src/routes/ProfileRoute.tsx
import React, { type FC } from 'react'
import { Outlet } from 'react-router-dom'
import useAuth from '@/hooks/useAuth'

const ProfileRoute: FC = () => {
  const { user } = useAuth()
  return <Outlet />
}

export default ProfileRoute
