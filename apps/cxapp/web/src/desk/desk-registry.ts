import type { LucideIcon } from "lucide-react"
import {
  Blocks,
  BadgePercent,
  Boxes,
  Building2,
  Cable,
  ClipboardList,
  Cog,
  ContactRound,
  Database,
  Flag,
  Globe,
  Landmark,
  PackageCheck,
  Package,
  Palette,
  LayoutDashboard,
  LineChart,
  MapPin,
  MonitorSmartphone,
  PlugZap,
  ReceiptText,
  Ruler,
  Scale,
  Settings2,
  Server,
  ShieldCheck,
  Sparkles,
  TerminalSquare,
  Truck,
  Users,
  Wallet,
  Workflow,
  Warehouse,
} from "lucide-react"

import type { AppManifest, AppSuite } from "@framework/application/app-manifest"
import { billingWorkspaceItems } from "@billing/shared"
import { coreCommonModuleMenuGroups, coreWorkspaceItems } from "@core/shared"
import { ecommerceWorkspaceItems } from "@ecommerce/shared"
import { frappeWorkspaceItems } from "@frappe/shared"
import { docsCategories } from "@/registry/data/catalog"
import { registryBlockCategories } from "@/registry/data/blocks"
import { docsTemplateCategories } from "@/docs/data/templates"
import { registryPageCategories, registryPages } from "@/registry/data/pages"
import type {
  DashboardAppDefinition,
  DashboardLocationMeta,
  DashboardMenuGroup,
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

function createTechnicalWorkspaceModules(
  app: AppManifest,
  root: string
): DashboardWorkspaceLink[] {
  const modules: DashboardWorkspaceLink[] = [
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

function createWorkspaceModules(app: AppManifest): DashboardWorkspaceLink[] {
  const root = `/dashboard/apps/${app.id}`

  if (app.id === "ui") {
    return [
      {
        id: `${app.id}-overview`,
        name: "Overview",
        route: root,
        summary: "Browse the UI system through component, block, and full-page channels.",
        icon: LayoutDashboard,
      },
      {
        id: `${app.id}-components`,
        name: "Components",
        route: `${root}/components`,
        summary: "Governed component variants grouped by category.",
        icon: Blocks,
      },
      {
        id: `${app.id}-design-settings`,
        name: "Design Settings",
        route: `${root}/design-settings`,
        summary: "Set project default component names, aliases, and default variants.",
        icon: Settings2,
      },
      {
        id: `${app.id}-blocks`,
        name: "Blocks",
        route: `${root}/blocks`,
        summary: "Use combined multi-component blocks for common application flows.",
        icon: ClipboardList,
        matchRoutes: [`${root}/form-blocks`],
      },
      {
        id: `${app.id}-pages`,
        name: "Pages",
        route: `${root}/pages`,
        summary: "Full page design-system variants and starter templates.",
        icon: MonitorSmartphone,
      },
      {
        id: `${app.id}-build-readiness`,
        name: "Build Readiness",
        route: `${root}/build-readiness`,
        summary: "Confirm the core component channels needed to build applications are present.",
        icon: PackageCheck,
      },
      ...docsCategories.map((category) => ({
        id: `${app.id}-components-${category.id}`,
        name: category.name,
        route: `${root}/components-${category.id}`,
        summary: category.description,
        icon: Blocks,
        matchRoutes: category.items.map((entryId) => `${root}/${entryId}`),
      })),
      ...registryBlockCategories.map((category) => ({
        id: `${app.id}-blocks-${category.id}`,
        name: category.name,
        route: `${root}/blocks-${category.id}`,
        summary: category.description,
        icon: ClipboardList,
      })),
      ...docsTemplateCategories.map((category) => ({
        id: `${app.id}-pages-template-${category.slug}`,
        name: `${category.name} Templates`,
        route: `${root}/pages-template-${category.slug}`,
        summary: `${category.name} imported starter templates.`,
        icon: MonitorSmartphone,
      })),
      ...registryPageCategories.map((category) => ({
        id: `${app.id}-pages-${category.id}`,
        name: category.name,
        route: `${root}/pages-${category.id}`,
        summary: category.description,
        icon: MonitorSmartphone,
      })),
      ...registryPages.map((page) => ({
        id: `${app.id}-pages-entry-${page.id}`,
        name: page.name,
        route: `${root}/pages-entry-${page.id}`,
        summary: page.summary,
        icon: MonitorSmartphone,
      })),
    ]
  }

  if (app.id === "core") {
    const coreWorkspaceIconMap: Record<string, LucideIcon> = {
      overview: LayoutDashboard,
      companies: Building2,
      contacts: Users,
      "common-modules": Blocks,
      "common-countries": Flag,
      "common-states": MapPin,
      "common-districts": Building2,
      "common-cities": Landmark,
      "common-pincodes": MapPin,
      "common-contactGroups": ContactRound,
      "common-contactTypes": ShieldCheck,
      "common-productGroups": Boxes,
      "common-productCategories": PackageCheck,
      "common-productTypes": Package,
      "common-brands": Building2,
      "common-colours": Palette,
      "common-sizes": Ruler,
      "common-styles": Package,
      "common-units": Scale,
      "common-hsnCodes": BadgePercent,
      "common-taxes": BadgePercent,
      "common-warehouses": Warehouse,
      "common-transports": Truck,
      "common-destinations": MapPin,
      "common-orderTypes": Package,
      "common-currencies": Wallet,
      "common-paymentTerms": Wallet,
      "common-storefrontTemplates": Sparkles,
      "common-sliderThemes": Palette,
      setup: Cog,
      "core-settings": Settings2,
    }

    return [
      ...coreWorkspaceItems.map((item) => ({
        id: `${app.id}-${item.id}`,
        name: item.name,
        route: item.route,
        summary: item.summary,
        icon: coreWorkspaceIconMap[item.id] ?? Blocks,
        matchRoutes:
          item.id === "contacts"
            ? [
                "/dashboard/apps/core/contacts/new",
                "/dashboard/apps/core/contacts/:contactId/edit",
              ]
            : undefined,
      })),
      ...createTechnicalWorkspaceModules(app, root),
    ]
  }

  if (app.id === "ecommerce") {
    const ecommerceWorkspaceIconMap: Record<string, LucideIcon> = {
      overview: LayoutDashboard,
      catalog: PackageCheck,
      storefront: MonitorSmartphone,
      orders: ReceiptText,
      customers: Users,
      settings: Settings2,
    }

    return [
      ...ecommerceWorkspaceItems.map((item) => ({
        id: `${app.id}-${item.id}`,
        name: item.name,
        route: item.route,
        summary: item.summary,
        icon: ecommerceWorkspaceIconMap[item.id] ?? Blocks,
      })),
      ...createTechnicalWorkspaceModules(app, root),
    ]
  }

  if (app.id === "frappe") {
    const frappeWorkspaceIconMap: Record<string, LucideIcon> = {
      overview: LayoutDashboard,
      connection: PlugZap,
      todos: ClipboardList,
      items: PackageCheck,
      "purchase-receipts": ReceiptText,
    }

    return [
      ...frappeWorkspaceItems.map((item) => ({
        id: `${app.id}-${item.id}`,
        name: item.name,
        route: item.route,
        summary: item.summary,
        icon: frappeWorkspaceIconMap[item.id] ?? Blocks,
      })),
      ...createTechnicalWorkspaceModules(app, root),
    ]
  }

  if (app.id === "billing") {
    const billingWorkspaceIconMap: Record<string, LucideIcon> = {
      "chart-of-accounts": Building2,
      categories: Building2,
      "voucher-groups": Blocks,
      "voucher-types": ReceiptText,
      "voucher-register": ReceiptText,
      "payment-vouchers": ReceiptText,
      "receipt-vouchers": ReceiptText,
      "sales-vouchers": ReceiptText,
      "purchase-vouchers": ReceiptText,
      "contra-vouchers": ReceiptText,
      "journal-vouchers": ReceiptText,
      "credit-note": ReceiptText,
      "debit-note": ReceiptText,
      stock: Warehouse,
      statements: ClipboardList,
      "day-book": ClipboardList,
      "double-entry": Workflow,
      "trial-balance": LineChart,
      "profit-and-loss": LineChart,
      "balance-sheet": LineChart,
      "bill-outstanding": LineChart,
      "support-ledger-guide": ClipboardList,
    }

    return [
      ...billingWorkspaceItems.map((item) => ({
        id: `${app.id}-${item.id}`,
        name: item.name,
        route: item.route,
        summary: item.summary,
        icon: billingWorkspaceIconMap[item.id] ?? Blocks,
        matchRoutes:
          item.id === "sales-vouchers"
            ? [
                "/dashboard/billing/sales-vouchers/new",
                "/dashboard/billing/sales-vouchers/:voucherId/edit",
              ]
            : undefined,
      })),
      ...createTechnicalWorkspaceModules(app, root),
    ]
  }

  return [
    {
      id: `${app.id}-overview`,
      name: "Overview",
      route: root,
      summary: app.description,
      icon: LayoutDashboard,
    },
    ...createTechnicalWorkspaceModules(app, root),
  ]
}

function createUiMenuGroups(
  app: AppManifest,
  modules: DashboardWorkspaceLink[]
): DashboardMenuGroup[] {
  const root = `/dashboard/apps/${app.id}`

  return [
    {
      id: `${app.id}-system-group`,
      label: "System",
      shared: true,
      route: root,
      items: modules.filter((item) =>
        [
          root,
          `${root}/design-settings`,
          `${root}/build-readiness`,
        ].includes(item.route)
      ),
    },
    {
      id: `${app.id}-components-group`,
      label: "Components",
      shared: false,
      route: `${root}/components`,
      items: modules.filter((item) =>
        [
          `${root}/components`,
          ...docsCategories.map((category) => `${root}/components-${category.id}`),
        ].includes(item.route)
      ),
    },
    {
      id: `${app.id}-blocks-group`,
      label: "Blocks",
      shared: false,
      route: `${root}/blocks`,
      items: modules.filter((item) =>
        [
          `${root}/blocks`,
          ...registryBlockCategories.map((category) => `${root}/blocks-${category.id}`),
        ].includes(item.route)
      ),
    },
    {
      id: `${app.id}-pages-group`,
      label: "Pages",
      shared: false,
      route: `${root}/pages`,
      items: modules.filter((item) =>
        [
          `${root}/pages`,
          ...registryPageCategories.map((category) => `${root}/pages-${category.id}`),
          ...registryPages.map((page) => `${root}/pages-entry-${page.id}`),
          ...docsTemplateCategories.map((category) => `${root}/pages-template-${category.slug}`),
        ].includes(item.route)
      ),
    },
  ]
}

function toDeskApp(app: AppManifest): DeskAppDefinition {
  const modules = createWorkspaceModules(app)
  const menuGroups =
    app.id === "ui"
      ? createUiMenuGroups(app, modules)
      : app.id === "core"
        ? [
            {
              id: `${app.id}-foundation`,
              label: "Core",
              shared: false,
              items: modules.filter((item) =>
                [
                  `/dashboard/apps/${app.id}`,
                  `/dashboard/apps/${app.id}/contacts`,
                ].includes(item.route)
              ),
            },
            {
              id: `${app.id}-common`,
              label: "Common",
              shared: false,
              route: `/dashboard/apps/${app.id}/common-modules`,
              items: coreCommonModuleMenuGroups.map((group) => {
                const firstRoute = group.items[0]?.route ?? `/dashboard/apps/${app.id}/common-modules`
                const firstItem = modules.find((item) => item.route === firstRoute)

                return {
                  id: `${app.id}-common-${group.id}`,
                  name: group.label,
                  route: firstRoute,
                  summary: `${group.label} common masters in the core workspace.`,
                  icon: firstItem?.icon ?? Blocks,
                  children: modules.filter((item) =>
                    group.items.some((groupItem) => groupItem.route === item.route)
                  ),
                }
              }),
            },
            {
              id: `${app.id}-settings`,
              label: "Settings",
              shared: false,
              items: modules.filter((item) =>
                [
                  `/dashboard/apps/${app.id}/companies`,
                  `/dashboard/apps/${app.id}/setup`,
                  `/dashboard/apps/${app.id}/core-settings`,
                ].includes(item.route)
              ),
            },
            {
              id: `${app.id}-workspace`,
              label: "Workspace",
              shared: true,
              items: modules.filter((item) =>
                [
                  `/dashboard/apps/${app.id}/backend`,
                  `/dashboard/apps/${app.id}/structure`,
                  `/dashboard/apps/${app.id}/api`,
                  `/dashboard/apps/${app.id}/database`,
                ].includes(item.route)
              ),
            },
          ]
      : app.id === "ecommerce"
        ? [
            {
              id: `${app.id}-commerce`,
              label: "Commerce",
              shared: false,
              items: modules.filter((item) =>
                [
                  `/dashboard/apps/${app.id}`,
                  `/dashboard/apps/${app.id}/catalog`,
                  `/dashboard/apps/${app.id}/storefront`,
                  `/dashboard/apps/${app.id}/orders`,
                  `/dashboard/apps/${app.id}/customers`,
                  `/dashboard/apps/${app.id}/settings`,
                ].includes(item.route)
              ),
            },
            {
              id: `${app.id}-workspace`,
              label: "Workspace",
              shared: true,
              items: modules.filter((item) =>
                [
                  `/dashboard/apps/${app.id}/backend`,
                  `/dashboard/apps/${app.id}/structure`,
                  `/dashboard/apps/${app.id}/web`,
                  `/dashboard/apps/${app.id}/api`,
                  `/dashboard/apps/${app.id}/database`,
                ].includes(item.route)
              ),
            },
          ]
      : app.id === "frappe"
        ? [
            {
              id: `${app.id}-connector`,
              label: "Connector",
              shared: false,
              items: modules.filter((item) =>
                [
                  `/dashboard/apps/${app.id}`,
                  `/dashboard/apps/${app.id}/connection`,
                  `/dashboard/apps/${app.id}/todos`,
                  `/dashboard/apps/${app.id}/items`,
                  `/dashboard/apps/${app.id}/purchase-receipts`,
                ].includes(item.route)
              ),
            },
            {
              id: `${app.id}-workspace`,
              label: "Workspace",
              shared: true,
              items: modules.filter((item) =>
                [
                  `/dashboard/apps/${app.id}/backend`,
                  `/dashboard/apps/${app.id}/structure`,
                  `/dashboard/apps/${app.id}/web`,
                  `/dashboard/apps/${app.id}/api`,
                  `/dashboard/apps/${app.id}/database`,
                ].includes(item.route)
              ),
            },
          ]
      : app.id === "billing"
        ? [
            {
              id: `${app.id}-system`,
              label: "System",
              shared: true,
              items: modules.filter((item) =>
                [
                  `/dashboard/billing/categories`,
                  `/dashboard/billing/chart-of-accounts`,
                  `/dashboard/billing/voucher-groups`,
                  `/dashboard/billing/voucher-types`,
                ].includes(item.route)
              ),
            },
            {
              id: `${app.id}-books`,
              label: "Books",
              shared: false,
              items: modules.filter((item) =>
                [
                  `/dashboard/billing/voucher-register`,
                ].includes(item.route)
              ),
            },
            {
              id: `${app.id}-vouchers`,
              label: "Vouchers",
              shared: false,
              items: modules.filter((item) =>
                [
                  `/dashboard/billing/sales-vouchers`,
                  `/dashboard/billing/purchase-vouchers`,
                  `/dashboard/billing/payment-vouchers`,
                  `/dashboard/billing/receipt-vouchers`,
                  `/dashboard/billing/journal-vouchers`,
                ].includes(item.route)
              ),
            },
            {
              id: `${app.id}-accounts`,
              label: "Accounts",
              shared: false,
              items: modules.filter((item) =>
                [
                  `/dashboard/billing/contra-vouchers`,
                  `/dashboard/billing/credit-note`,
                  `/dashboard/billing/debit-note`,
                ].includes(item.route)
              ),
            },
            {
              id: `${app.id}-inventory`,
              label: "Inventory",
              shared: false,
              items: modules.filter((item) =>
                [
                  `/dashboard/billing/stock`,
                ].includes(item.route)
              ),
            },
            {
              id: `${app.id}-reports`,
              label: "Reports",
              shared: false,
              items: modules.filter((item) =>
                [
                  `/dashboard/billing/statements`,
                  `/dashboard/billing/profit-and-loss`,
                  `/dashboard/billing/balance-sheet`,
                  `/dashboard/billing/trial-balance`,
                  `/dashboard/billing/bill-outstanding`,
                  `/dashboard/billing/day-book`,
                  `/dashboard/billing/double-entry`,
                ].includes(item.route)
              ),
            },
            ...coreCommonModuleMenuGroups.map((group) => ({
              id: `${app.id}-${group.id}`,
              label: group.label,
              shared: false,
              items: modules.filter((item) =>
                group.items.some((groupItem) => groupItem.route === item.route)
              ),
            })),
            {
              id: `${app.id}-workspace`,
              label: "Workspace",
              shared: true,
              items: modules.filter((item) =>
                [
                  `/dashboard/apps/${app.id}/backend`,
                  `/dashboard/apps/${app.id}/structure`,
                  `/dashboard/apps/${app.id}/web`,
                  `/dashboard/apps/${app.id}/api`,
                  `/dashboard/apps/${app.id}/database`,
                ].includes(item.route)
              ),
            },
            {
              id: `${app.id}-support`,
              label: "Support",
              shared: true,
              items: modules.filter((item) =>
                [
                  `/dashboard/billing/support/ledger-guide`,
                ].includes(item.route)
              ),
            },
          ]
      : [
          {
            id: `${app.id}-workspace`,
            label: app.name,
            shared: false,
            items: modules,
          },
        ]

  return {
    id: app.id,
    name: app.name,
    summary: app.description,
    route: app.id === "billing" ? "/dashboard/billing" : `/dashboard/apps/${app.id}`,
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
    menuGroups,
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

function getBestRouteMatch<T extends { route: string; matchRoutes?: string[] }>(
  items: T[],
  pathname: string
) {
  return [...items]
    .filter((item) => matchesDeskRoute(pathname, item.route, item.matchRoutes))
    .sort((left, right) => {
      const leftLength = Math.max(left.route.length, ...(left.matchRoutes ?? []).map((route) => route.length))
      const rightLength = Math.max(
        right.route.length,
        ...(right.matchRoutes ?? []).map((route) => route.length)
      )

      return rightLength - leftLength
    })[0] ?? null
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

  const activeMenuItem = getBestRouteMatch(
    app.menuGroups.flatMap((group) => group.items),
    pathname
  )
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

