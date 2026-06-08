'use client'

import { createContext, useContext, useMemo, useState } from 'react'
import { Menu } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { AppDrawer } from '@/features/navigation/components/app-drawer'

interface AppShellContextValue {
  openDrawer: () => void
  closeDrawer: () => void
}

const AppShellContext = createContext<AppShellContextValue | null>(null)

export function AppShell({ children }: { children: React.ReactNode }) {
  const [open, setOpen] = useState(false)

  const value = useMemo(
    () => ({
      openDrawer: () => setOpen(true),
      closeDrawer: () => setOpen(false),
    }),
    []
  )

  return (
    <AppShellContext.Provider value={value}>
      {children}
      <AppDrawer open={open} onClose={() => setOpen(false)} />
    </AppShellContext.Provider>
  )
}

export function useAppShell() {
  const context = useContext(AppShellContext)
  if (!context) {
    throw new Error('useAppShell must be used inside AppShell.')
  }
  return context
}

export function DrawerToggleButton({ className }: { className?: string }) {
  const { openDrawer } = useAppShell()

  return (
    <Button
      type="button"
      variant="ghost"
      size="icon"
      className={className}
      onClick={openDrawer}
      aria-label="Open navigation"
    >
      <Menu className="h-6 w-6" />
    </Button>
  )
}
