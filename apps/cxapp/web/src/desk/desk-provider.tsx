import { createContext, useContext, useMemo, type ReactNode } from "react"
import { useLocation } from "react-router-dom"

import type { AppSuite } from "@framework/application/app-manifest"
import {
  DashboardShellProvider,
} from "@/features/dashboard/dashboard-shell"
import { useRuntimeBrand } from "@/features/branding/runtime-brand-provider"
import type { DashboardNotification, DashboardUser } from "@/features/dashboard/types"

import {
  createDeskState,
  findDeskAppByPathname,
  getDeskApp,
  resolveDeskLocation,
  type DeskAppDefinition,
} from "./desk-registry"

interface DeskContextValue {
  apps: DeskAppDefinition[]
  services: ReturnType<typeof createDeskState>["services"]
  currentApp: DeskAppDefinition | null
  locationMeta: ReturnType<typeof resolveDeskLocation>
  getApp: (appId: string) => DeskAppDefinition | null
}

const DeskContext = createContext<DeskContextValue | null>(null)

function createInitialNotifications(apps: DeskAppDefinition[]): DashboardNotification[] {
  return apps.slice(0, 3).map((app, index) => ({
    id: `${app.id}-notification`,
    title: `${app.name} workspace ready`,
    message: `The ${app.name} shell is registered and available through the shared dashboard.`,
    createdAt: new Date(Date.now() - index * 3_600_000).toISOString(),
    isRead: index > 0,
    href: app.route,
  }))
}

export function DeskProvider({
  appSuite,
  onLogout,
  user,
  children,
}: {
  appSuite: AppSuite
  onLogout: () => void
  user: DashboardUser
  children: ReactNode
}) {
  const location = useLocation()
  const { brand } = useRuntimeBrand()
  const { apps, services } = useMemo(() => createDeskState(appSuite), [appSuite])
  const notifications = useMemo(() => createInitialNotifications(apps), [apps])
  const currentApp = findDeskAppByPathname(apps, location.pathname)
  const locationMeta = resolveDeskLocation(apps, location.pathname)
  const getApp = (appId: string) => getDeskApp(apps, appId)

  return (
    <DashboardShellProvider
      apps={apps}
      services={services}
      user={user}
      notifications={notifications}
      findAppByPathname={(pathname) => findDeskAppByPathname(apps, pathname)}
      resolveLocation={(pathname) => resolveDeskLocation(apps, pathname)}
      onLogout={onLogout}
      links={{
        dashboard: user.isSuperAdmin ? "/dashboard/admin" : "/dashboard",
        home: "/",
        mediaManager: "/dashboard/media",
        settings: "/dashboard/settings",
        systemUpdate: "/dashboard/system-update",
      }}
      brand={{
        name: brand?.brandName ?? appSuite.framework.name,
        tagline: brand?.tagline ?? "Framework runtime with CxApp shell",
      }}
    >
      <DeskContext.Provider
        value={{
          apps,
          services,
          currentApp,
          locationMeta,
          getApp,
        }}
      >
        {children}
      </DeskContext.Provider>
    </DashboardShellProvider>
  )
}

// eslint-disable-next-line react-refresh/only-export-components
export function useDesk() {
  const context = useContext(DeskContext)

  if (!context) {
    throw new Error("useDesk must be used within a DeskProvider.")
  }

  return context
}
