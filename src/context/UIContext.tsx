import React, { createContext, useContext, useState, ReactNode } from 'react'

type DialogID = 'logoutConfirm'

interface UIContextType {
  activeDialog: DialogID|null
  openDialog(id: DialogID): void
  closeDialog(): void
}

const UIContext = createContext<UIContextType|undefined>(undefined)

export function UIProvider({ children }: { children: ReactNode }) {
  const [activeDialog, setActiveDialog] = useState<DialogID|null>(null)
  return (
    <UIContext.Provider
      value={{
        activeDialog,
        openDialog:   (id) => setActiveDialog(id),
        closeDialog:  ()   => setActiveDialog(null)
      }}
    >
      {children}
    </UIContext.Provider>
  )
}

export function useUI() {
  const ctx = useContext(UIContext)
  if (!ctx) throw new Error('useUI must be used within UIProvider')
  return ctx
}
