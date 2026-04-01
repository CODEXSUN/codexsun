import { createContext, useContext, type ReactNode } from 'react'
import { useLocation } from 'react-router-dom'
import {
  deskApps,
  deskServices,
  findDeskAppByPathname,
  getDeskApp,
  resolveDeskLocation,
  type DeskAppDefinition,
} from '@/features/framework/desk/desk-registry'

interface DeskContextValue {
  apps: DeskAppDefinition[]
  services: typeof deskServices
  currentApp: DeskAppDefinition | null
  locationMeta: ReturnType<typeof resolveDeskLocation>
  getApp: typeof getDeskApp
}

const DeskContext = createContext<DeskContextValue | null>(null)

export function DeskProvider({ children }: { children: ReactNode }) {
  const location = useLocation()
  const currentApp = findDeskAppByPathname(location.pathname)
  const locationMeta = resolveDeskLocation(location.pathname)

  return (
    <DeskContext.Provider
      value={{
        apps: deskApps,
        services: deskServices,
        currentApp,
        locationMeta,
        getApp: getDeskApp,
      }}
    >
      {children}
    </DeskContext.Provider>
  )
}

export function useDesk() {
  const context = useContext(DeskContext)

  if (!context) {
    throw new Error('useDesk must be used within a DeskProvider.')
  }

  return context
}
