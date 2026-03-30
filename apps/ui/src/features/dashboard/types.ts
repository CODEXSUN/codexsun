import type { LucideIcon } from "lucide-react"

export type DashboardReadiness =
  | "active"
  | "foundation"
  | "scaffold"
  | "preview"
  | "planned"

export type DashboardWorkspaceLink = {
  id: string
  name: string
  route: string
  summary: string
  icon: LucideIcon
  matchRoutes?: string[]
}

export type DashboardMenuItem = DashboardWorkspaceLink & {
  matchRoutes?: string[]
}

export type DashboardMenuGroup = {
  id: string
  label: string
  shared: boolean
  route?: string
  items: DashboardMenuItem[]
}

export type DashboardAppDefinition = {
  id: string
  name: string
  summary: string
  route: string
  icon: LucideIcon
  badge: string
  readiness: DashboardReadiness
  workspaceTitle: string
  workspaceSummary: string
  heroSummary: string
  accentClassName: string
  workspacePaths: {
    backendRoot: string
    frontendRoot: string
    helperRoot: string
    sharedRoot: string
    migrationRoot: string
    seederRoot: string
  }
  modules: DashboardWorkspaceLink[]
  menuGroups: DashboardMenuGroup[]
  quickActions: DashboardWorkspaceLink[]
}

export type DashboardServiceDefinition = {
  id: string
  name: string
  summary: string
  readiness: DashboardReadiness
  icon: LucideIcon
}

export type DashboardLocationMeta = {
  section: string
  title: string
  description: string
  app: DashboardAppDefinition | null
}

export type DashboardUser = {
  displayName: string
  email: string
  avatarUrl: string | null
  actorType: string
  isSuperAdmin: boolean
}

export type DashboardNotification = {
  id: string
  title: string
  message: string
  createdAt: string
  isRead: boolean
  href?: string
}
