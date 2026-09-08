export type ModuleIssueCode =
  | 'DEPENDENCY_CYCLE'
  | 'DUPLICATE_CAPABILITY'
  | 'DUPLICATE_CONFIGURATION'
  | 'DUPLICATE_CONTRACT'
  | 'DUPLICATE_DEPENDENCY'
  | 'DUPLICATE_EVENT'
  | 'DUPLICATE_EXTENSION'
  | 'DUPLICATE_EXTENSION_POINT'
  | 'DUPLICATE_MODULE'
  | 'EXTENSION_CARDINALITY'
  | 'EXTENSION_DEPENDENCY_REQUIRED'
  | 'INCOMPATIBLE_DEPENDENCY'
  | 'INCOMPATIBLE_EXTENSION_POINT'
  | 'INCOMPATIBLE_PLATFORM'
  | 'INVALID_MANIFEST'
  | 'MISSING_DEPENDENCY'
  | 'MISSING_EXTENSION_POINT'
  | 'REGISTRY_LOCKED'
  | 'SELF_DEPENDENCY'

export interface ModuleIssue {
  code: ModuleIssueCode
  message: string
  moduleId: string
}

export class ModuleRegistryError extends Error {
  constructor(
    readonly code: ModuleIssueCode,
    message: string,
  ) {
    super(message)
    this.name = 'ModuleRegistryError'
  }
}

export class ModuleCompositionError extends Error {
  constructor(readonly issues: readonly ModuleIssue[]) {
    super(issues.map((issue) => issue.message).join('\n'))
    this.name = 'ModuleCompositionError'
  }
}

export type ModuleLifecyclePhase = 'activate' | 'deactivate' | 'install' | 'uninstall' | 'upgrade'

export class ModuleLifecycleError extends Error {
  constructor(
    readonly moduleId: string,
    readonly phase: ModuleLifecyclePhase,
    readonly cause: unknown,
    readonly rollbackErrors: readonly unknown[] = [],
  ) {
    super(`Module "${moduleId}" failed during ${phase}.`, { cause })
    this.name = 'ModuleLifecycleError'
  }
}
