import * as React from "react"
import { useLocation, useNavigate } from "react-router-dom"

import type {
  DashboardAppDefinition,
  DashboardLocationMeta,
  DashboardNotification,
  DashboardServiceDefinition,
  DashboardUser,
} from "./types"

type DashboardShellContextValue = {
  apps: DashboardAppDefinition[]
  services: DashboardServiceDefinition[]
  currentApp: DashboardAppDefinition | null
  locationMeta: DashboardLocationMeta
  user: DashboardUser
  notifications: DashboardNotification[]
  unreadCount: number
  links: {
    dashboard: string
    home: string
    settings: string
    systemUpdate: string
  }
  brand: {
    name: string
    tagline: string
  }
  markAllNotificationsRead: () => void
  markNotificationRead: (notificationId: string) => void
  goToNotification: (notificationId: string) => void
  logout: () => void
}

const DashboardShellContext =
  React.createContext<DashboardShellContextValue | null>(null)

type DashboardShellProviderProps = React.PropsWithChildren<{
  apps: DashboardAppDefinition[]
  services: DashboardServiceDefinition[]
  user: DashboardUser
  notifications?: DashboardNotification[]
  links?: Partial<DashboardShellContextValue["links"]>
  brand?: Partial<DashboardShellContextValue["brand"]>
  findAppByPathname: (pathname: string) => DashboardAppDefinition | null
  resolveLocation: (pathname: string) => DashboardLocationMeta
  onLogout?: () => void
}>

export function DashboardShellProvider({
  apps,
  brand,
  children,
  findAppByPathname,
  links,
  notifications = [],
  onLogout,
  resolveLocation,
  services,
  user,
}: DashboardShellProviderProps) {
  const location = useLocation()
  const navigate = useNavigate()
  const [items, setItems] = React.useState(notifications)

  React.useEffect(() => {
    setItems(notifications)
  }, [notifications])

  const currentApp = React.useMemo(
    () => findAppByPathname(location.pathname),
    [findAppByPathname, location.pathname]
  )
  const locationMeta = React.useMemo(
    () => resolveLocation(location.pathname),
    [location.pathname, resolveLocation]
  )
  const unreadCount = items.filter((notification) => !notification.isRead).length

  function markAllNotificationsRead() {
    setItems((currentItems) =>
      currentItems.map((notification) => ({
        ...notification,
        isRead: true,
      }))
    )
  }

  function markNotificationRead(notificationId: string) {
    setItems((currentItems) =>
      currentItems.map((notification) =>
        notification.id === notificationId
          ? {
              ...notification,
              isRead: true,
            }
          : notification
      )
    )
  }

  function goToNotification(notificationId: string) {
    const notification = items.find((item) => item.id === notificationId)

    if (!notification?.href) {
      return
    }

    markNotificationRead(notificationId)
    void navigate(notification.href)
  }

  const resolvedLinks = {
    dashboard: links?.dashboard ?? "/dashboard",
    home: links?.home ?? "/",
    settings: links?.settings ?? "/dashboard/settings",
    systemUpdate: links?.systemUpdate ?? "/dashboard/system-update",
  }
  const resolvedBrand = {
    name: brand?.name ?? "Codexsun",
    tagline: brand?.tagline ?? "Enterprise suite shell",
  }

  return (
    <DashboardShellContext.Provider
      value={{
        apps,
        brand: resolvedBrand,
        currentApp,
        goToNotification,
        links: resolvedLinks,
        locationMeta,
        logout: onLogout ?? (() => undefined),
        markAllNotificationsRead,
        markNotificationRead,
        notifications: items,
        services,
        unreadCount,
        user,
      }}
    >
      {children}
    </DashboardShellContext.Provider>
  )
}

// eslint-disable-next-line react-refresh/only-export-components
export function useDashboardShell() {
  const context = React.useContext(DashboardShellContext)

  if (!context) {
    throw new Error(
      "useDashboardShell must be used within DashboardShellProvider."
    )
  }

  return context
}
