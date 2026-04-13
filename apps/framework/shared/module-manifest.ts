export type ModuleManifestType =
  | "engine"
  | "app"
  | "industry-pack"
  | "client-overlay"
  | "widget-pack"
  | "orchestration"

export type ModuleDependencyKind =
  | "engine"
  | "shared-package"
  | "app"
  | "industry-pack"
  | "client-overlay"
  | "orchestration"

export type ModuleDependency = {
  id: string
  kind: ModuleDependencyKind
  optional?: boolean
}

export type WorkspaceContributionType =
  | "workspace"
  | "module"
  | "page"
  | "report"
  | "widget"
  | "action"

export type WorkspaceContribution = {
  id: string
  type: WorkspaceContributionType
  label: string
  route?: string | null
  appId?: string | null
  parentId?: string | null
  summary?: string | null
  roles?: string[]
  featureFlags?: string[]
}

export type ModuleFeatureFlag = {
  key: string
  label: string
  summary?: string | null
  defaultEnabled?: boolean
  scope: "global" | "industry" | "client" | "role" | "environment"
}

export type ModuleRouteContribution = {
  id: string
  surface: "web" | "internal-api" | "external-api" | "worker" | "cli"
  path: string
  summary?: string | null
}

export type ModuleSettingDeclaration = {
  key: string
  label: string
  valueType: "string" | "number" | "boolean" | "json" | "enum"
  summary?: string | null
  required?: boolean
}

export type ModuleManifest = {
  id: string
  type: ModuleManifestType
  displayName: string
  summary: string
  dependencies: ModuleDependency[]
  featureFlags: ModuleFeatureFlag[]
  workspaceContributions: WorkspaceContribution[]
  routeContributions: ModuleRouteContribution[]
  permissions: string[]
  settings: ModuleSettingDeclaration[]
  widgets: string[]
  builders: string[]
  migrations: string[]
  seeders: string[]
}

export function defineModuleManifest<T extends ModuleManifest>(manifest: T) {
  return manifest
}
