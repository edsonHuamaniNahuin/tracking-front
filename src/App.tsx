import React from 'react'
import { HashRouter } from 'react-router-dom'
import { AuthProvider } from '@/context/AuthContext'
import { UIProvider } from '@/context/UIContext'
import { GlobalDialogs } from './components/common/GlobalDialogs'
import AppRoutes from '@/routes/index'

export default function App() {
  return (
    <HashRouter>
      <AuthProvider>
        <UIProvider>
          <GlobalDialogs />
          <AppRoutes />
        </UIProvider>
      </AuthProvider>
    </HashRouter>
  )
}
