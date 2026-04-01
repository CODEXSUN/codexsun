import type { LucideIcon } from 'lucide-react'
import {
  Boxes,
  Blocks,
  BookOpenText,
  BriefcaseBusiness,
  Building2,
  ClipboardList,
  Cog,
  Cpu,
  Database,
  FileImage,
  FileText,
  Globe,
  LayoutDashboard,
  Layers3,
  ListTodo,
  Mail,
  Package,
  Receipt,
  Settings2,
  ShieldCheck,
  Shirt,
  ShoppingBag,
  Store,
  Users,
  Wallet,
  Zap,
} from 'lucide-react'
import type { FrameworkServiceDefinition, SuiteAppDefinition, SuiteAppId } from '@framework-core/app-suite'
import { frameworkServices, suiteApps } from '@framework-core/index'
import { coreWorkspaceItems } from '@core-domain/index'
import { ecommerceWorkspaceItems } from '@ecommerce-domain/index'
import { frappeWorkspaceItems } from '@frappe-domain/index'
import { taskWorkspaceItems } from '@task-domain/index'
import { commonModuleMenuGroups, getCommonModuleHref } from '@/features/common-modules/config/common-module-navigation'
import { BILLING_NAV_ITEMS, getBillingNavMatch, resolveBillingNavPath } from '@billing-web/features/billing/lib/billing-navigation'
import { siteWorkspaceItems } from '@/features/site/config/site-content'

export interface DeskWorkspaceLink {
  id: string
  name: string
  route: string
  summary: string
  icon: LucideIcon
}

export interface DeskMenuItem extends DeskWorkspaceLink {
  matchRoutes?: string[]
}

export interface DeskMenuGroup {
  id: string
  label: string
  shared: boolean
  items: DeskMenuItem[]
}

export interface DeskAppDefinition {
  id: SuiteAppId
  name: string
  summary: string
  mode: SuiteAppDefinition['mode']
  readiness: SuiteAppDefinition['readiness']
  route: string
  icon: LucideIcon
  badge: string
  workspaceTitle: string
  workspaceSummary: string
  heroSummary: string
  accentClassName: string
  modules: DeskWorkspaceLink[]
  menuGroups: DeskMenuGroup[]
  quickActions: DeskWorkspaceLink[]
}

export interface DeskServiceDefinition extends FrameworkServiceDefinition {
  icon: LucideIcon
}

const serviceIconMap: Record<FrameworkServiceDefinition['id'], LucideIcon> = {
  database: Database,
  cache: Zap,
  jobs: ClipboardList,
  realtime: Zap,
  files: FileImage,
  auth: ShieldCheck,
  config: Cog,
  migrations: FileText,
  cli: BookOpenText,
  skeleton: Blocks,
}

const workspaceIconMap: Record<string, LucideIcon> = {
  overview: LayoutDashboard,
  companies: Building2,
  contacts: Users,
  media: FileImage,
  'common-modules': Blocks,
  'core-settings': Settings2,
  settings: Settings2,
  tasks: ListTodo,
  groups: Boxes,
  milestones: Layers3,
  templates: FileText,
  bulk: ClipboardList,
  insights: LayoutDashboard,
  audit: ShieldCheck,
  orders: Receipt,
  customers: BriefcaseBusiness,
  products: Package,
  mailbox: Mail,
  todos: ClipboardList,
  items: Package,
  'purchase-receipts': Receipt,
  'storefront-designer': Store,
  'slider-themes': Zap,
  connection: Cog,
}

const appIconMap: Record<SuiteAppId, LucideIcon> = {
  core: Building2,
  ecommerce: ShoppingBag,
  billing: Wallet,
  crm: BriefcaseBusiness,
  site: Globe,
  frappe: Database,
  task: ListTodo,
  ui: Blocks,
  mcp: Cpu,
  custom: Blocks,
}

const appRouteMap: Record<SuiteAppId, string> = {
  core: '/admin/dashboard/core',
  ecommerce: '/admin/dashboard/ecommerce',
  billing: '/admin/dashboard/billing',
  crm: '/admin/dashboard/crm',
  site: '/admin/dashboard/site',
  frappe: '/admin/dashboard/frappe',
  task: '/admin/dashboard/task',
  ui: '/admin/dashboard/ui',
  mcp: '/admin/dashboard/mcp',
  custom: '/admin/dashboard/custom',
}

const appBadgeMap: Record<SuiteAppId, string> = {
  core: 'Shared foundation',
  ecommerce: 'Live app',
  billing: 'Scaffold app',
  crm: 'Scaffold app',
  site: 'Presentation surface',
  frappe: 'Integration app',
  task: 'Operations app',
  ui: 'Documentation',
  mcp: 'Agent boundary',
  custom: 'Extension app',
}

const appAccentClassMap: Record<SuiteAppId, string> = {
  core: 'from-sky-500/18 via-sky-500/10 to-transparent',
  ecommerce: 'from-amber-500/20 via-orange-500/10 to-transparent',
  billing: 'from-emerald-500/18 via-green-500/10 to-transparent',
  crm: 'from-fuchsia-500/18 via-pink-500/10 to-transparent',
  site: 'from-cyan-500/18 via-teal-500/10 to-transparent',
  frappe: 'from-blue-500/18 via-sky-500/10 to-transparent',
  task: 'from-slate-500/18 via-zinc-500/10 to-transparent',
  ui: 'from-zinc-500/18 via-slate-500/10 to-transparent',
  mcp: 'from-orange-500/18 via-amber-500/10 to-transparent',
  custom: 'from-violet-500/18 via-indigo-500/10 to-transparent',
}

const placeholderModules: Record<Exclude<SuiteAppId, 'core' | 'ecommerce' | 'frappe'>, DeskWorkspaceLink[]> = {
  billing: BILLING_NAV_ITEMS.map((item) => ({
    id: `billing-${item.id}`,
    name: item.label,
    route: resolveBillingNavPath(item.path, 'framework'),
    summary: item.summary,
    icon: item.icon,
  })),
  crm: [
    {
      id: 'crm-overview',
      name: 'CRM Overview',
      route: '/admin/dashboard/crm',
      summary: 'Lead, pipeline, and activity workspace shell.',
      icon: BriefcaseBusiness,
    },
    {
      id: 'leads',
      name: 'Leads',
      route: '/admin/dashboard/crm',
      summary: 'Incoming prospects, qualification, and assignment.',
      icon: Users,
    },
    {
      id: 'activities',
      name: 'Activities',
      route: '/admin/dashboard/crm',
      summary: 'Task, note, and follow-up flow for relationship teams.',
      icon: ClipboardList,
    },
  ],
  site: [
    ...siteWorkspaceItems,
  ],
  task: [],
  ui: [
    { id: 'ui-overview', name: 'Introduction', route: '/admin/dashboard/ui', summary: 'Framework introduction.', icon: BookOpenText },
    { id: 'ui-button', name: 'Button', route: '/admin/dashboard/ui/button', summary: 'Button component.', icon: Blocks },
    { id: 'ui-badge', name: 'Badge', route: '/admin/dashboard/ui/badge', summary: 'Badge component.', icon: Blocks },
    { id: 'ui-card', name: 'Card', route: '/admin/dashboard/ui/card', summary: 'Card layout.', icon: Blocks },
    { id: 'ui-input', name: 'Input', route: '/admin/dashboard/ui/input', summary: 'Input field.', icon: Blocks },
  ],
  mcp: [
    {
      id: 'mcp-overview',
      name: 'Agent Interaction',
      route: '/admin/dashboard/mcp',
      summary: 'Launch the agent chat interface to trigger automated workflows.',
      icon: Cpu,
    },
  ],
  custom: [
    {
      id: 'custom-overview',
      name: 'Custom App Overview',
      route: '/admin/dashboard/custom',
      summary: 'Future installable app shell plugged into the same desk.',
      icon: Blocks,
    },
    {
      id: 'hooks',
      name: 'Hooks',
      route: '/admin/dashboard/custom',
      summary: 'Entry points for future extension contracts.',
      icon: Zap,
    },
    {
      id: 'workspace',
      name: 'Workspace',
      route: '/admin/dashboard/custom',
      summary: 'Desk-ready surface once the app is registered.',
      icon: LayoutDashboard,
    },
  ],
}

function toWorkspaceLink<T extends { id: string; name: string; route: string; summary: string }>(item: T): DeskWorkspaceLink {
  return {
    ...item,
    icon: workspaceIconMap[item.id] ?? Blocks,
  }
}

function createMenuItem(item: DeskWorkspaceLink, matchRoutes?: string[]): DeskMenuItem {
  return {
    ...item,
    matchRoutes,
  }
}

function createSharedMenuItem(
  id: string,
  name: string,
  route: string,
  summary: string,
  icon: LucideIcon,
  matchRoutes?: string[],
): DeskMenuItem {
  return { id, name, route, summary, icon, matchRoutes }
}

function getWorkspaceContent(appId: SuiteAppId) {
  if (appId === 'core') {
    return coreWorkspaceItems.map(toWorkspaceLink)
  }

  if (appId === 'ecommerce') {
    return ecommerceWorkspaceItems.map(toWorkspaceLink)
  }

  if (appId === 'frappe') {
    return frappeWorkspaceItems.map(toWorkspaceLink)
  }

  if (appId === 'task') {
    return taskWorkspaceItems.map(toWorkspaceLink)
  }

  return placeholderModules[appId]
}

function getWorkspaceTitle(app: SuiteAppDefinition) {
  if (app.id === 'core') {
    return 'Core'
  }

  if (app.id === 'ecommerce') {
    return 'Ecommerce Desk'
  }

  if (app.id === 'billing') {
    return 'Billing'
  }

  if (app.id === 'crm') {
    return 'CRM'
  }

  if (app.id === 'site') {
    return 'Site'
  }

  if (app.id === 'frappe') {
    return 'Frappe'
  }

  if (app.id === 'task') {
    return 'Task'
  }

  if (app.id === 'ui') {
    return 'UI'
  }

  if (app.id === 'mcp') {
    return 'MCP Agent'
  }

  if (app.id === 'custom') {
    return 'Custom App'
  }

  return app.name
}

function getWorkspaceSummary(app: SuiteAppDefinition) {
  if (app.id === 'core') {
    return 'Shared masters, setup, and admin foundations connected through one desk.'
  }

  if (app.id === 'ecommerce') {
    return 'Storefront, catalog, orders, customers, and merchandising under one app boundary.'
  }

  if (app.id === 'billing') {
    return 'Accounts, inventory, and billing documents prepared as a desk-ready app shell.'
  }

  if (app.id === 'crm') {
    return 'Lead and relationship workflows prepared to plug into the same framework desk.'
  }

  if (app.id === 'site') {
    return 'Portfolio websites, landing pages, project showcases, trust pages, and enquiry funnels for Codexsun.'
  }

  if (app.id === 'frappe') {
    return 'ERPNext connection, company defaults, and integration setup managed from one workspace.'
  }

  if (app.id === 'task') {
    return 'Checklist-based verification and assignment flow managed as its own app workspace.'
  }

  if (app.id === 'ui') {
    return 'Component docs, layout references, and implementation details for shared UI primitives.'
  }

  if (app.id === 'mcp') {
    return 'Model Context Protocol user interface and agent configuration boundary.'
  }

  return 'Future app extension point with workspace hooks, desk icon, and framework contract.'
}

function getHeroSummary(app: SuiteAppDefinition) {
  return `${app.summary} Open the workspace from the desk, then operate inside app-owned modules without leaving the shared shell.`
}

function getMenuGroups(appId: SuiteAppId, modules: DeskWorkspaceLink[]): DeskMenuGroup[] {
  if (appId === 'core') {
    const commonItems = commonModuleMenuGroups.flatMap((group) =>
      group.items.map((item) =>
        createSharedMenuItem(
          item.key,
          item.title,
          getCommonModuleHref(item.key),
          item.description,
          item.icon,
        ),
      ),
    )

    return [
      {
        id: 'core-workspace',
        label: 'Core',
        shared: false,
        items: modules
          .filter((item) => item.id !== 'common-modules')
          .map((item) => createMenuItem(item)),
      },
      {
        id: 'core-common',
        label: 'Common',
        shared: false,
        items: commonItems,
      },
    ]
  }

  if (appId === 'ecommerce') {
    return [
      {
        id: 'ecommerce-workspace',
        label: 'Ecommerce',
        shared: false,
        items: modules.map((item) => createMenuItem(item)),
      },
    ]
  }

  if (appId === 'billing') {
    return [
      {
        id: 'billing-workspace',
        label: 'Billing',
        shared: false,
        items: modules.map((item) => createMenuItem(item)),
      },
    ]
  }

  if (appId === 'crm') {
    return [
      {
        id: 'crm-workspace',
        label: 'CRM',
        shared: false,
        items: modules.map((item) => createMenuItem(item)),
      },
    ]
  }

  if (appId === 'site') {
    return [
      {
        id: 'site-workspace',
        label: 'Site',
        shared: false,
        items: modules.map((item) => createMenuItem(item)),
      },
    ]
  }

  if (appId === 'frappe') {
    return [
      {
        id: 'frappe-workspace',
        label: 'Frappe',
        shared: false,
        items: modules.map((item) => createMenuItem(item)),
      },
    ]
  }

  if (appId === 'task') {
    return [
      {
        id: 'task-workspace',
        label: 'Task',
        shared: false,
        items: modules.map((item) => createMenuItem(item)),
      },
    ]
  }

  if (appId === 'ui') {
    return [
      {
        id: 'ui-workspace',
        label: 'UI',
        shared: false,
        items: modules.map((item) => createMenuItem(item)),
      },
    ]
  }

  if (appId === 'mcp') {
    return [
      {
        id: 'mcp-workspace',
        label: 'MCP Agent',
        shared: false,
        items: modules.map((item) => createMenuItem(item)),
      },
    ]
  }

  return [
    {
      id: 'custom-workspace',
      label: 'Workspace',
      shared: false,
      items: modules.map((item) => createMenuItem(item)),
    },
  ]
}

export function matchesDeskRoute(pathname: string, route: string, matchRoutes: string[] = []) {
  if (pathname === route || pathname === `${route}/`) {
    return true
  }

  if (pathname.startsWith(`${route}/`)) {
    return true
  }

  return matchRoutes.some((candidate) =>
    pathname === candidate || pathname === `${candidate}/` || pathname.startsWith(`${candidate}/`),
  )
}

export const deskServices: DeskServiceDefinition[] = frameworkServices.map((service) => ({
  ...service,
  icon: serviceIconMap[service.id],
}))

export const deskApps: DeskAppDefinition[] = suiteApps.filter((app) => app.id !== 'custom').map((app) => {
  const modules = getWorkspaceContent(app.id)

  return {
    id: app.id,
    name: app.name,
    summary: app.summary,
    mode: app.mode,
    readiness: app.readiness,
    route: appRouteMap[app.id],
    icon: appIconMap[app.id],
    badge: appBadgeMap[app.id],
    workspaceTitle: getWorkspaceTitle(app),
    workspaceSummary: getWorkspaceSummary(app),
    heroSummary: getHeroSummary(app),
    accentClassName: appAccentClassMap[app.id],
    modules,
    menuGroups: getMenuGroups(app.id, modules),
    quickActions: modules.slice(0, 3),
  }
})

export function getDeskApp(appId: SuiteAppId) {
  return deskApps.find((app) => app.id === appId) ?? null
}

export function findDeskAppByPathname(pathname: string) {
  const exact = deskApps.find((app) => pathname === app.route || pathname === `${app.route}/`)
  if (exact) {
    return exact
  }

  return deskApps.find((app) =>
    app.menuGroups.some((group) =>
      group.items.some((item) => matchesDeskRoute(pathname, item.route, item.matchRoutes)),
    ),
  ) ?? null
}

export function resolveDeskLocation(pathname: string) {
  if (pathname === '/admin/dashboard' || pathname === '/admin/dashboard/') {
    return {
      section: 'Desk',
      title: 'Application desk',
      description: 'Framework shell and app launcher',
      app: null as DeskAppDefinition | null,
    }
  }

  if (pathname === '/admin/dashboard/users' || pathname.startsWith('/admin/dashboard/users/')) {
    return {
      section: 'Framework',
      title: 'Users',
      description: 'Platform user accounts, actor types, and access status.',
      app: null as DeskAppDefinition | null,
    }
  }

  if (pathname === '/admin/dashboard/settings' || pathname.startsWith('/admin/dashboard/settings/')) {
    return {
      section: 'Framework',
      title: 'Settings',
      description: 'Cross-app settings and governance.',
      app: null as DeskAppDefinition | null,
    }
  }

  if (pathname === '/admin/dashboard/migration-manager' || pathname.startsWith('/admin/dashboard/migration-manager/')) {
    return {
      section: 'Framework',
      title: 'Migration Manager',
      description: 'Database schema verification, backups, hard reset, and migration control.',
      app: null as DeskAppDefinition | null,
    }
  }

  if (pathname === '/admin/dashboard/environment' || pathname.startsWith('/admin/dashboard/environment/')) {
    return {
      section: 'Framework',
      title: 'Environment',
      description: 'Runtime .env controls, update flow, and restart workflow.',
      app: null as DeskAppDefinition | null,
    }
  }

  if (
    pathname === '/admin/dashboard/system-update'
    || pathname.startsWith('/admin/dashboard/system-update/')
    || pathname === '/admin/dashboard/version'
    || pathname.startsWith('/admin/dashboard/version/')
  ) {
    return {
      section: 'Framework',
      title: 'System Update',
      description: 'System version status, update checks, and restart workflow.',
      app: null as DeskAppDefinition | null,
    }
  }

  const app = findDeskAppByPathname(pathname)
  if (!app) {
    return {
      section: 'Workspace',
      title: 'Application',
      description: 'Shared admin shell',
      app: null as DeskAppDefinition | null,
    }
  }

  const activeMenuItem = app.menuGroups
    .flatMap((group) => group.items)
    .map((item) => (matchesDeskRoute(pathname, item.route, item.matchRoutes) ? item : null))
    .filter((item) => item !== null)
    .sort((a, b) => b.route.length - a.route.length)[0] ?? null
  const isAppRoot = pathname === app.route || pathname === `${app.route}/`
  const billingFallbackItem =
    app.id === 'billing'
      ? getBillingNavMatch(pathname)
      : null
  const resolvedMenuItem = activeMenuItem ?? (billingFallbackItem
    ? {
        name: billingFallbackItem.label,
        summary: billingFallbackItem.summary,
      }
    : null)

  return {
    section: app.name,
    title: isAppRoot ? app.workspaceTitle : resolvedMenuItem?.name ?? app.workspaceTitle,
    description: isAppRoot ? app.workspaceSummary : resolvedMenuItem?.summary ?? app.workspaceSummary,
    app,
  }
}
