import { valid, validRange } from 'semver'
import type { FrameworkModule } from './module-contracts.js'
import type { ModuleIssue, ModuleIssueCode } from './module-errors.js'

const identifierPattern = /^[a-z0-9]+(?:[.-][a-z0-9]+)*$/
const configurationKeyPattern = /^[A-Z][A-Z0-9_]*$/

export function validateModuleManifest(module: FrameworkModule): readonly ModuleIssue[] {
  const issues: ModuleIssue[] = []
  const moduleId = module.id || '<unknown>'

  check(identifierPattern.test(module.id), 'id', moduleId, issues)
  check(Boolean(valid(module.version)), 'version', moduleId, issues)
  check(
    Boolean(validRange(module.platformVersionRange)),
    'platform version range',
    moduleId,
    issues,
  )
  check(Boolean(module.scope.trim()), 'scope', moduleId, issues)
  check(Boolean(module.owner.trim()), 'owner', moduleId, issues)
  check(Boolean(module.description.trim()), 'description', moduleId, issues)
  validateDataSchema(module, issues)
  validateNamedVersions(module.publicContracts, 'contract', moduleId, issues)
  validateNamedVersions(module.publishes, 'published event', moduleId, issues)
  validateConsumedEvents(module, issues)
  validateDependencies(module, issues)
  validateCapabilities(module, issues)
  validateConfiguration(module, issues)
  validateExtensionPoints(module, issues)
  validateExtensions(module, issues)
  validateKind(module, issues)
  validateLifecycle(module, issues)

  return issues
}

function validateDataSchema(module: FrameworkModule, issues: ModuleIssue[]): void {
  if (!module.dataSchema) return
  if (
    !valid(module.dataSchema.version) ||
    !/^sha256:[a-f0-9]{64}$/u.test(module.dataSchema.checksum)
  ) {
    addInvalid(module.id, 'data schema', issues)
  }
}

function validateExtensionPoints(module: FrameworkModule, issues: ModuleIssue[]): void {
  validateUnique(
    module.extensionPoints.map(({ id }) => id),
    'DUPLICATE_EXTENSION_POINT',
    module.id,
    issues,
  )
  for (const point of module.extensionPoints) {
    if (
      !identifierPattern.test(point.id) ||
      !valid(point.version) ||
      !['many', 'one'].includes(point.cardinality)
    ) {
      addInvalid(module.id, 'extension point', issues)
    }
  }
}

function validateExtensions(module: FrameworkModule, issues: ModuleIssue[]): void {
  validateUnique(
    module.extensions.map(({ id }) => id),
    'DUPLICATE_EXTENSION',
    module.id,
    issues,
  )
  for (const extension of module.extensions) {
    if (
      !identifierPattern.test(extension.id) ||
      !identifierPattern.test(extension.pointId) ||
      !validRange(extension.pointVersionRange) ||
      !Number.isSafeInteger(extension.order)
    ) {
      addInvalid(module.id, 'extension', issues)
    }
  }
}

function validateKind(module: FrameworkModule, issues: ModuleIssue[]): void {
  if (!['adapter', 'addon', 'core', 'feature'].includes(module.kind)) {
    addInvalid(module.id, 'kind', issues)
  }
}

function validateDependencies(module: FrameworkModule, issues: ModuleIssue[]): void {
  validateUnique(
    module.dependencies.map(({ id }) => id),
    'DUPLICATE_DEPENDENCY',
    module.id,
    issues,
  )
  for (const dependency of module.dependencies) {
    if (!identifierPattern.test(dependency.id) || !validRange(dependency.versionRange)) {
      addInvalid(module.id, 'dependency', issues)
    }
    if (dependency.id === module.id) {
      issues.push({
        code: 'SELF_DEPENDENCY',
        message: `Module "${module.id}" cannot depend on itself.`,
        moduleId: module.id,
      })
    }
  }
}

function validateCapabilities(module: FrameworkModule, issues: ModuleIssue[]): void {
  validateUnique(module.capabilities, 'DUPLICATE_CAPABILITY', module.id, issues)
  if (module.capabilities.some((capability) => !identifierPattern.test(capability))) {
    addInvalid(module.id, 'capability', issues)
  }
}

function validateConfiguration(module: FrameworkModule, issues: ModuleIssue[]): void {
  validateUnique(
    module.configuration.map(({ key }) => key),
    'DUPLICATE_CONFIGURATION',
    module.id,
    issues,
  )
  if (module.configuration.some(({ key }) => !configurationKeyPattern.test(key))) {
    addInvalid(module.id, 'configuration key', issues)
  }
}

function validateConsumedEvents(module: FrameworkModule, issues: ModuleIssue[]): void {
  validateUnique(
    module.consumes.map(({ id }) => id),
    'DUPLICATE_EVENT',
    module.id,
    issues,
  )
  for (const event of module.consumes) {
    if (!identifierPattern.test(event.id) || !validRange(event.versionRange)) {
      addInvalid(module.id, 'consumed event', issues)
    }
  }
}

function validateNamedVersions(
  values: readonly { id: string; version: string }[],
  field: 'contract' | 'published event',
  moduleId: string,
  issues: ModuleIssue[],
): void {
  validateUnique(
    values.map(({ id }) => id),
    field === 'contract' ? 'DUPLICATE_CONTRACT' : 'DUPLICATE_EVENT',
    moduleId,
    issues,
  )
  if (values.some(({ id, version }) => !identifierPattern.test(id) || !valid(version))) {
    addInvalid(moduleId, field, issues)
  }
}

function validateLifecycle(module: FrameworkModule, issues: ModuleIssue[]): void {
  const functions = Object.values(module.lifecycle)
  if (functions.length !== 5 || functions.some((value) => typeof value !== 'function')) {
    addInvalid(module.id, 'lifecycle', issues)
  }
}

function validateUnique(
  values: readonly string[],
  code: ModuleIssueCode,
  moduleId: string,
  issues: ModuleIssue[],
): void {
  const duplicates = values.filter((value, index) => values.indexOf(value) !== index)
  for (const value of new Set(duplicates)) {
    issues.push({
      code,
      message: `Module "${moduleId}" declares "${value}" more than once.`,
      moduleId,
    })
  }
}

function check(condition: boolean, field: string, moduleId: string, issues: ModuleIssue[]): void {
  if (!condition) addInvalid(moduleId, field, issues)
}

function addInvalid(moduleId: string, field: string, issues: ModuleIssue[]): void {
  issues.push({
    code: 'INVALID_MANIFEST',
    message: `Module "${moduleId}" has an invalid ${field} contract.`,
    moduleId,
  })
}
