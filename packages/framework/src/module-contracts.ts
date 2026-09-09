export interface ModuleDependency {
  id: string
  versionRange: string
}

export interface ModulePublicContract {
  id: string
  version: string
}

export interface ModulePublishedEvent {
  id: string
  version: string
}

export interface ModuleConsumedEvent {
  id: string
  versionRange: string
}

export interface ModuleConfigurationRequirement {
  key: string
  required: boolean
}

export interface ModuleDataSchema {
  checksum: string
  version: string
}

export type ModuleKind = 'adapter' | 'addon' | 'core' | 'feature'

export interface ModuleExtensionPoint {
  cardinality: 'many' | 'one'
  id: string
  version: string
}

export interface ModuleExtensionContribution {
  id: string
  order: number
  pointId: string
  pointVersionRange: string
}

export interface ModuleLifecycleContext {
  moduleId: string
  signal: AbortSignal
}

export interface ModuleUpgradeContext extends ModuleLifecycleContext {
  previousVersion: string
  targetVersion: string
}

export interface ModuleLifecycle {
  activate(context: ModuleLifecycleContext): Promise<void> | void
  deactivate(context: ModuleLifecycleContext): Promise<void> | void
  install(context: ModuleLifecycleContext): Promise<void> | void
  uninstall(context: ModuleLifecycleContext): Promise<void> | void
  upgrade(context: ModuleUpgradeContext): Promise<void> | void
}

export interface FrameworkModule {
  capabilities: readonly string[]
  configuration: readonly ModuleConfigurationRequirement[]
  consumes: readonly ModuleConsumedEvent[]
  dependencies: readonly ModuleDependency[]
  description: string
  dataSchema?: ModuleDataSchema
  extensionPoints: readonly ModuleExtensionPoint[]
  extensions: readonly ModuleExtensionContribution[]
  id: string
  kind: ModuleKind
  lifecycle: ModuleLifecycle
  owner: string
  platformVersionRange: string
  publicContracts: readonly ModulePublicContract[]
  publishes: readonly ModulePublishedEvent[]
  scope: string
  version: string
}
