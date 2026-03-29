import type { LucideIcon } from "lucide-react"
import {
  Blocks,
  Building2,
  Cable,
  Cog,
  Database,
  Globe,
  LayoutDashboard,
  MonitorSmartphone,
  PlugZap,
  ReceiptText,
  Server,
  TerminalSquare,
  Workflow,
} from "lucide-react"

import type { AppManifest, AppSuite } from "@framework/application/app-manifest"
import type {
  DashboardAppDefinition,
  DashboardLocationMeta,
  DashboardServiceDefinition,
  DashboardWorkspaceLink,
} from "@/features/dashboard/types"

export type DeskAppDefinition = DashboardAppDefinition
export type DeskServiceDefinition = DashboardServiceDefinition

const appIconMap: Record<string, LucideIcon> = {
  api: Cable,
  billing: ReceiptText,
  cli: TerminalSquare,
  core: Building2,
  cxapp: Blocks,
  ecommerce: MonitorSmartphone,
  frappe: PlugZap,
  site: Globe,
  tally: Database,
  task: Workflow,
  ui: Blocks,
}

const appAccentClassMap: Record<string, string> = {
  api: "from-sky-500/18 via-sky-500/10 to-transparent",
  billing: "from-emerald-500/18 via-green-500/10 to-transparent",
  cli: "from-slate-500/18 via-zinc-500/10 to-transparent",
  core: "from-cyan-500/18 via-sky-500/10 to-transparent",
  cxapp: "from-zinc-500/18 via-slate-500/10 to-transparent",
  ecommerce: "from-amber-500/20 via-orange-500/10 to-transparent",
  frappe: "from-blue-500/18 via-sky-500/10 to-transparent",
  site: "from-violet-500/18 via-indigo-500/10 to-transparent",
  tally: "from-lime-500/18 via-emerald-500/10 to-transparent",
  task: "from-fuchsia-500/18 via-pink-500/10 to-transparent",
  ui: "from-stone-500/18 via-zinc-500/10 to-transparent",
}

const frameworkServices: DeskServiceDefinition[] = [
  {
    id: "config",
    name: "Config",
    summary: "Environment and host configuration owned by framework.",
    readiness: "active",
    icon: Cog,
  },
  {
    id: "database",
    name: "Database",
    summary: "Driver switching for MariaDB, SQLite, and analytics PostgreSQL.",
    readiness: "active",
    icon: Database,
  },
  {
    id: "http",
    name: "HTTP",
    summary: "Native Node host, route assembly, and health endpoints.",
    readiness: "active",
    icon: Cable,
  },
]

const appPriorityOrder = [
  "ecommerce",
  "billing",
  "frappe",
  "site",
  "task",
  "tally",
  "core",
] as const

function getAppReadiness(app: AppManifest): DeskAppDefinition["readiness"] {
  if (app.id === "cxapp") {
    return "active"
  }

  if (app.kind === "platform" || app.kind === "shared") {
    return "foundation"
  }

  if (app.kind === "integration") {
    return "preview"
  }

  return "scaffold"
}

function getAppBadge(app: AppManifest) {
  if (app.id === "cxapp") {
    return "Main shell"
  }

  if (app.kind === "platform") {
    return "Platform"
  }

  if (app.kind === "shared") {
    return "Shared app"
  }

  if (app.kind === "integration") {
    return "Connector"
  }

  if (app.kind === "ops") {
    return "Operations"
  }

  return "Business app"
}

function createWorkspaceModules(app: AppManifest): DashboardWorkspaceLink[] {
  const root = `/dashboard/apps/${app.id}`
  const modules: DashboardWorkspaceLink[] = [
    {
      id: `${app.id}-overview`,
      name: "Overview",
      route: root,
      summary: app.description,
      icon: LayoutDashboard,
    },
    {
      id: `${app.id}-backend`,
      name: "Backend",
      route: `${root}/backend`,
      summary: `Backend runtime rooted at ${app.workspace.backendRoot}.`,
      icon: Server,
    },
    {
      id: `${app.id}-structure`,
      name: "Structure",
      route: `${root}/structure`,
      summary: `Helpers, shared contracts, migrations, and seeders stay under ${app.workspace.label}.`,
      icon: Blocks,
    },
  ]

  if (app.surfaces.web) {
    modules.push({
      id: `${app.id}-web`,
      name: "Web",
      route: `${root}/web`,
      summary: `Frontend shell and pages live in ${app.workspace.frontendRoot}.`,
      icon: Globe,
    })
  }

  if (app.surfaces.internalApi || app.surfaces.externalApi) {
    modules.push({
      id: `${app.id}-api`,
      name: "API",
      route: `${root}/api`,
      summary:
        app.id === "api"
          ? "Internal and external routes are split under apps/api/src."
          : "API traffic is mounted through framework runtime and the api app boundary.",
      icon: Cable,
    })
  }

  modules.push({
    id: `${app.id}-database`,
    name: "Database",
    route: `${root}/database`,
    summary: `App-owned data work stays under ${app.workspace.migrationRoot} and ${app.workspace.seederRoot}.`,
    icon: Database,
  })

  return modules
}

function toDeskApp(app: AppManifest): DeskAppDefinition {
  const modules = createWorkspaceModules(app)

  return {
    id: app.id,
    name: app.name,
    summary: app.description,
    route: `/dashboard/apps/${app.id}`,
    icon: appIconMap[app.id] ?? Blocks,
    badge: getAppBadge(app),
    readiness: getAppReadiness(app),
    workspaceTitle: app.name,
    workspaceSummary: `${app.description} This workspace reads from ${app.workspace.backendRoot} and ${app.workspace.frontendRoot}.`,
    heroSummary: `${app.description} Open this workspace from the desk and continue growing it without crossing app boundaries.`,
    accentClassName:
      appAccentClassMap[app.id] ?? "from-zinc-500/18 via-slate-500/10 to-transparent",
    workspacePaths: {
      backendRoot: app.workspace.backendRoot,
      frontendRoot: app.workspace.frontendRoot,
      helperRoot: app.workspace.helperRoot,
      sharedRoot: app.workspace.sharedRoot,
      migrationRoot: app.workspace.migrationRoot,
      seederRoot: app.workspace.seederRoot,
    },
    modules,
    menuGroups: [
      {
        id: `${app.id}-workspace`,
        label: app.name,
        shared: false,
        items: modules,
      },
    ],
    quickActions: modules.slice(0, 3),
  }
}

export function createDeskState(appSuite: AppSuite) {
  const sortedApps = [...appSuite.apps].sort((left, right) => {
    const leftPriority = appPriorityOrder.indexOf(left.id as (typeof appPriorityOrder)[number])
    const rightPriority = appPriorityOrder.indexOf(right.id as (typeof appPriorityOrder)[number])

    if (leftPriority !== -1 || rightPriority !== -1) {
      if (leftPriority === -1) {
        return 1
      }

      if (rightPriority === -1) {
        return -1
      }

      return leftPriority - rightPriority
    }

    return left.name.localeCompare(right.name)
  })

  return {
    apps: sortedApps.map((app) => toDeskApp(app)),
    services: frameworkServices,
  }
}

export function matchesDeskRoute(
  pathname: string,
  route: string,
  matchRoutes: string[] = []
) {
  if (pathname === route || pathname === `${route}/`) {
    return true
  }

  if (pathname.startsWith(`${route}/`)) {
    return true
  }

  return matchRoutes.some((candidate) =>
    pathname === candidate ||
    pathname === `${candidate}/` ||
    pathname.startsWith(`${candidate}/`)
  )
}

export function getDeskApp(apps: DeskAppDefinition[], appId: string) {
  return apps.find((app) => app.id === appId) ?? null
}

export function findDeskAppByPathname(
  apps: DeskAppDefinition[],
  pathname: string
) {
  const exact = apps.find((app) => pathname === app.route || pathname === `${app.route}/`)

  if (exact) {
    return exact
  }

  return (
    apps.find((app) =>
      app.menuGroups.some((group) =>
        group.items.some((item) =>
          matchesDeskRoute(pathname, item.route, item.matchRoutes)
        )
      )
    ) ?? null
  )
}

export function resolveDeskLocation(
  apps: DeskAppDefinition[],
  pathname: string
): DashboardLocationMeta {
  if (pathname === "/dashboard" || pathname === "/dashboard/") {
    return {
      section: "Desk",
      title: "Application desk",
      description: "Framework shell and app launcher.",
      app: null,
    }
  }

  if (pathname === "/dashboard/admin" || pathname === "/dashboard/admin/") {
    return {
      section: "Admin",
      title: "Application Desk",
      description: "Framework control, governance, and system oversight.",
      app: null,
    }
  }

  if (pathname === "/dashboard/settings" || pathname.startsWith("/dashboard/settings/")) {
    return {
      section: "Framework",
      title: "Settings",
      description: "Cross-app settings and suite governance.",
      app: null,
    }
  }

  if (
    pathname === "/dashboard/system-update" ||
    pathname.startsWith("/dashboard/system-update/")
  ) {
    return {
      section: "Framework",
      title: "System update",
      description: "Version status, build health, and deployment checkpoints.",
      app: null,
    }
  }

  const app = findDeskAppByPathname(apps, pathname)

  if (!app) {
    return {
      section: "Workspace",
      title: "Application",
      description: "Shared admin shell.",
      app: null,
    }
  }

  const activeMenuItem =
    app.menuGroups
      .flatMap((group) => group.items)
      .find((item) => matchesDeskRoute(pathname, item.route, item.matchRoutes)) ??
    null
  const isAppRoot = pathname === app.route || pathname === `${app.route}/`

  return {
    section: app.name,
    title: isAppRoot ? app.workspaceTitle : activeMenuItem?.name ?? app.workspaceTitle,
    description:
      isAppRoot
        ? app.workspaceSummary
        : activeMenuItem?.summary ?? app.workspaceSummary,
    app,
  }
}
