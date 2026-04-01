export type FrameworkServiceId =
  | 'database'
  | 'cache'
  | 'jobs'
  | 'realtime'
  | 'files'
  | 'auth'
  | 'config'
  | 'migrations'
  | 'cli'
  | 'skeleton'

export interface FrameworkServiceDefinition {
  id: FrameworkServiceId
  name: string
  summary: string
  readiness: 'scaffold' | 'active'
}

export type SuiteAppId = 'core' | 'ecommerce' | 'billing' | 'crm' | 'site' | 'frappe' | 'task' | 'ui' | 'mcp' | 'custom'

export interface SuiteAppDefinition {
  id: SuiteAppId
  name: string
  summary: string
  mode: 'shared-foundation' | 'standalone-app' | 'presentation-surface'
  readiness: 'scaffold' | 'foundation' | 'active'
}

export const frameworkServices: FrameworkServiceDefinition[] = [
  {
    id: 'database',
    name: 'Database',
    summary: 'Persistence contracts, database adapters, and transaction-safe data access.',
    readiness: 'active',
  },
  {
    id: 'cache',
    name: 'Cache',
    summary: 'Shared caching contracts and future adapter wiring for app-level acceleration.',
    readiness: 'scaffold',
  },
  {
    id: 'jobs',
    name: 'Jobs',
    summary: 'Background job orchestration for async operational workflows.',
    readiness: 'scaffold',
  },
  {
    id: 'realtime',
    name: 'Realtime',
    summary: 'Event delivery for live operational and customer-facing updates.',
    readiness: 'scaffold',
  },
  {
    id: 'files',
    name: 'Files',
    summary: 'Shared file/media storage infrastructure and lifecycle management.',
    readiness: 'active',
  },
  {
    id: 'auth',
    name: 'Authentication',
    summary: 'Framework-level identity, session, and authentication primitives.',
    readiness: 'active',
  },
  {
    id: 'config',
    name: 'Config',
    summary: 'Runtime configuration loading and environment resolution.',
    readiness: 'active',
  },
  {
    id: 'migrations',
    name: 'Migrations',
    summary: 'Schema and seeded data lifecycle management.',
    readiness: 'active',
  },
  {
    id: 'cli',
    name: 'CLI',
    summary: 'Future command surface for app scaffolding, setup, and operations.',
    readiness: 'scaffold',
  },
  {
    id: 'skeleton',
    name: 'Skeleton',
    summary: 'Bootstrapping contracts that let shared hosts evolve into app-specific runtimes.',
    readiness: 'scaffold',
  },
]

export const suiteApps: SuiteAppDefinition[] = [
  {
    id: 'core',
    name: 'Core',
    summary: 'Shared business masters, organization setup, contacts, media, and admin foundations.',
    mode: 'shared-foundation',
    readiness: 'foundation',
  },
  {
    id: 'ecommerce',
    name: 'Ecommerce',
    summary: 'Storefront, shopping, checkout, customer portal, and commerce operations.',
    mode: 'standalone-app',
    readiness: 'active',
  },
  {
    id: 'billing',
    name: 'Billing',
    summary: 'Accounts, inventory, billing, and reporting-focused business application.',
    mode: 'standalone-app',
    readiness: 'scaffold',
  },
  {
    id: 'crm',
    name: 'CRM',
    summary: 'Relationship workflows such as leads, opportunities, and activities.',
    mode: 'standalone-app',
    readiness: 'scaffold',
  },
  {
    id: 'site',
    name: 'Site',
    summary: 'Static presentation surface reusing the shared design system and UI primitives.',
    mode: 'presentation-surface',
    readiness: 'foundation',
  },
  {
    id: 'frappe',
    name: 'Frappe',
    summary: 'ERPNext connection, integration defaults, and operational bridge into the shared framework shell.',
    mode: 'standalone-app',
    readiness: 'active',
  },
  {
    id: 'task',
    name: 'Task',
    summary: 'Checklist-driven assignment, verification, and linked operational follow-through.',
    mode: 'standalone-app',
    readiness: 'active',
  },
  {
    id: 'ui',
    name: 'UI',
    summary: 'UI Framework component documentation, layout primitives, and implementation snippets.',
    mode: 'standalone-app',
    readiness: 'active',
  },
  {
    id: 'custom',
    name: 'Custom Future App',
    summary: 'Future installable app built on the same framework contract and Core foundation.',
    mode: 'standalone-app',
    readiness: 'scaffold',
  },
]
