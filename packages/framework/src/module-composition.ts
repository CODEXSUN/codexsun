import { satisfies, valid } from 'semver'
import type { FrameworkModule } from './module-contracts.js'
import { ModuleCompositionError, type ModuleIssue, ModuleRegistryError } from './module-errors.js'
import {
  collectExtensionIssues,
  resolveModuleExtensions,
  type ResolvedModuleExtension,
} from './module-extensions.js'
import { parseModuleManifest } from './module-parser.js'

export type ModuleRegistryState = 'collecting' | 'planned'

export class ModuleCompositionPlan {
  readonly extensions: readonly ResolvedModuleExtension[]
  readonly modules: readonly FrameworkModule[]

  constructor(modules: readonly FrameworkModule[], extensions: readonly ResolvedModuleExtension[]) {
    this.extensions = Object.freeze([...extensions])
    this.modules = Object.freeze(modules.map(snapshotModule))
    Object.freeze(this)
  }
}

export class ModuleRegistry {
  private readonly modules = new Map<string, FrameworkModule>()
  private registryState: ModuleRegistryState = 'collecting'

  get state(): ModuleRegistryState {
    return this.registryState
  }

  register(input: unknown): void {
    if (this.registryState !== 'collecting') {
      throw new ModuleRegistryError('REGISTRY_LOCKED', 'The module registry is already planned.')
    }

    const module = parseModuleManifest(input)

    if (this.modules.has(module.id)) {
      throw new ModuleRegistryError(
        'DUPLICATE_MODULE',
        `The module "${module.id}" is already registered.`,
      )
    }

    this.modules.set(module.id, module)
  }

  get(id: string): FrameworkModule | undefined {
    return this.modules.get(id)
  }

  getModules(): readonly FrameworkModule[] {
    return [...this.modules.values()].sort(byModuleId)
  }

  createCompositionPlan(platformVersion: string): ModuleCompositionPlan {
    if (!valid(platformVersion)) {
      throw new ModuleRegistryError('INVALID_MANIFEST', 'The platform version is invalid.')
    }

    const issues = this.collectCompositionIssues(platformVersion)
    if (issues.length > 0) throw new ModuleCompositionError(issues)

    const modules = this.resolveOrder()
    const plan = new ModuleCompositionPlan(modules, resolveModuleExtensions(modules))
    this.registryState = 'planned'
    return plan
  }

  resolveCompositionOrder(platformVersion = '0.1.0'): readonly FrameworkModule[] {
    return this.createCompositionPlan(platformVersion).modules
  }

  private collectCompositionIssues(platformVersion: string): ModuleIssue[] {
    const issues: ModuleIssue[] = []
    const modules = this.getModules()
    issues.push(...collectExtensionIssues(modules))
    issues.push(...collectEventIssues(modules))

    for (const module of modules) {
      if (!satisfies(platformVersion, module.platformVersionRange)) {
        issues.push(
          issue(
            'INCOMPATIBLE_PLATFORM',
            module.id,
            `Module "${module.id}" does not support platform ${platformVersion}.`,
          ),
        )
      }

      for (const dependency of module.dependencies) {
        const registered = this.modules.get(dependency.id)
        if (!registered) {
          issues.push(
            issue(
              'MISSING_DEPENDENCY',
              module.id,
              `Module "${module.id}" requires missing module "${dependency.id}".`,
            ),
          )
        } else if (!satisfies(registered.version, dependency.versionRange)) {
          issues.push(
            issue(
              'INCOMPATIBLE_DEPENDENCY',
              module.id,
              `Module "${module.id}" requires "${dependency.id}" at "${dependency.versionRange}", but version "${registered.version}" is registered.`,
            ),
          )
        }
      }
    }

    const cycle = this.findCycle()
    if (cycle) {
      issues.push(
        issue('DEPENDENCY_CYCLE', cycle[0], `Module dependency cycle: ${cycle.join(' -> ')}.`),
      )
    }

    return issues
  }

  private resolveOrder(): FrameworkModule[] {
    const ordered: FrameworkModule[] = []
    const visited = new Set<string>()

    const visit = (module: FrameworkModule) => {
      if (visited.has(module.id)) return
      for (const dependency of [...module.dependencies].sort(byDependencyId)) {
        visit(this.modules.get(dependency.id)!)
      }
      visited.add(module.id)
      ordered.push(module)
    }

    for (const module of this.getModules()) visit(module)
    return ordered
  }

  private findCycle(): string[] | undefined {
    const visited = new Set<string>()
    const path: string[] = []

    const visit = (module: FrameworkModule): string[] | undefined => {
      const pathIndex = path.indexOf(module.id)
      if (pathIndex >= 0) return [...path.slice(pathIndex), module.id]
      if (visited.has(module.id)) return undefined

      path.push(module.id)
      for (const dependency of module.dependencies) {
        const target = this.modules.get(dependency.id)
        const cycle = target ? visit(target) : undefined
        if (cycle) return cycle
      }
      path.pop()
      visited.add(module.id)
      return undefined
    }

    for (const module of this.getModules()) {
      const cycle = visit(module)
      if (cycle) return cycle
    }
    return undefined
  }
}

function collectEventIssues(modules: readonly FrameworkModule[]): ModuleIssue[] {
  const issues: ModuleIssue[] = []
  const publishers = new Map<string, { moduleId: string; version: string }[]>()

  for (const module of modules) {
    for (const event of module.publishes) {
      const declarations = publishers.get(event.id) ?? []
      declarations.push({ moduleId: module.id, version: event.version })
      publishers.set(event.id, declarations)
    }
  }

  for (const [eventId, declarations] of publishers) {
    if (declarations.length <= 1) continue
    for (const declaration of declarations) {
      issues.push(
        issue(
          'DUPLICATE_EVENT_PUBLISHER',
          declaration.moduleId,
          `Event "${eventId}" has more than one publisher.`,
        ),
      )
    }
  }

  for (const module of modules) {
    for (const consumed of module.consumes) {
      const declarations = publishers.get(consumed.id) ?? []
      if (declarations.length === 0) {
        issues.push(
          issue(
            'MISSING_EVENT_PUBLISHER',
            module.id,
            `Module "${module.id}" consumes event "${consumed.id}" without a publisher.`,
          ),
        )
        continue
      }
      if (declarations.length > 1) continue

      const publisher = declarations[0]!
      if (!satisfies(publisher.version, consumed.versionRange)) {
        issues.push(
          issue(
            'INCOMPATIBLE_EVENT',
            module.id,
            `Module "${module.id}" requires event "${consumed.id}" at "${consumed.versionRange}", but version "${publisher.version}" is published.`,
          ),
        )
      }
      if (
        publisher.moduleId !== module.id &&
        !module.dependencies.some(({ id }) => id === publisher.moduleId)
      ) {
        issues.push(
          issue(
            'EVENT_DEPENDENCY_REQUIRED',
            module.id,
            `Module "${module.id}" must depend on event publisher "${publisher.moduleId}".`,
          ),
        )
      }
    }
  }

  return issues
}

function issue(code: ModuleIssue['code'], moduleId: string, message: string): ModuleIssue {
  return { code, message, moduleId }
}

function byModuleId(left: FrameworkModule, right: FrameworkModule): number {
  return left.id.localeCompare(right.id)
}

function byDependencyId(left: { id: string }, right: { id: string }): number {
  return left.id.localeCompare(right.id)
}

function snapshotModule(module: FrameworkModule): FrameworkModule {
  return Object.freeze({
    ...module,
    capabilities: Object.freeze([...module.capabilities]),
    configuration: Object.freeze(module.configuration.map((value) => Object.freeze({ ...value }))),
    consumes: Object.freeze(module.consumes.map((value) => Object.freeze({ ...value }))),
    dependencies: Object.freeze(module.dependencies.map((value) => Object.freeze({ ...value }))),
    dataSchema: module.dataSchema ? Object.freeze({ ...module.dataSchema }) : undefined,
    extensionPoints: Object.freeze(
      module.extensionPoints.map((value) => Object.freeze({ ...value })),
    ),
    extensions: Object.freeze(module.extensions.map((value) => Object.freeze({ ...value }))),
    lifecycle: Object.freeze({ ...module.lifecycle }),
    publicContracts: Object.freeze(
      module.publicContracts.map((value) => Object.freeze({ ...value })),
    ),
    publishes: Object.freeze(module.publishes.map((value) => Object.freeze({ ...value }))),
  })
}
