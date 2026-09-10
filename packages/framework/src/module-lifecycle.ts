import type { ModuleCompositionPlan } from './module-composition.js'
import type {
  FrameworkModule,
  ModuleLifecycleContext,
  ModuleUpgradeContext,
} from './module-contracts.js'
import {
  ModuleLifecycleError,
  ModuleLifecycleStateError,
  type ModuleLifecyclePhase,
} from './module-errors.js'

export type ModuleRuntimeState = 'idle' | 'active' | 'stopped' | 'failed'
export type ModuleContextFactory = (module: FrameworkModule) => ModuleLifecycleContext
export type ModuleLifecycleEventStatus = 'completed' | 'failed' | 'started'

export interface ModuleLifecycleEvent {
  moduleId: string
  phase: ModuleLifecyclePhase
  status: ModuleLifecycleEventStatus
}

export type ModuleLifecycleReporter = (event: ModuleLifecycleEvent) => void

export interface ModuleLifecycleReporterError extends ModuleLifecycleEvent {
  readonly cause: unknown
}

export class ModuleLifecycleExecutor {
  private activeModules: FrameworkModule[] = []
  private runtimeState: ModuleRuntimeState = 'idle'
  private operationRunning = false
  private readonly reportingFailures: ModuleLifecycleReporterError[] = []

  constructor(
    private readonly plan: ModuleCompositionPlan,
    private readonly createContext: ModuleContextFactory = defaultContextFactory,
    private readonly report: ModuleLifecycleReporter = () => {},
  ) {}

  get state(): ModuleRuntimeState {
    return this.runtimeState
  }

  get reporterErrors(): readonly ModuleLifecycleReporterError[] {
    return Object.freeze([...this.reportingFailures])
  }

  install(moduleIds?: ReadonlySet<string>): Promise<void> {
    return this.exclusive(() => this.installModules(moduleIds))
  }

  activate(): Promise<void> {
    return this.exclusive(() => this.activateModules())
  }

  upgrade(previousVersions: ReadonlyMap<string, string>): Promise<void> {
    return this.exclusive(() => this.upgradeModules(previousVersions))
  }

  deactivate(): Promise<void> {
    return this.exclusive(() => this.deactivateModules())
  }

  uninstall(): Promise<void> {
    return this.exclusive(async () => {
      if (this.activeModules.length > 0) {
        throw new ModuleLifecycleStateError('Deactivate modules before uninstalling them.')
      }
      await this.uninstallModules()
    })
  }

  private async exclusive(action: () => Promise<void>): Promise<void> {
    if (this.operationRunning) {
      throw new ModuleLifecycleStateError('A module lifecycle operation is already running.')
    }
    this.operationRunning = true
    try {
      await action()
    } finally {
      this.operationRunning = false
    }
  }

  private async installModules(moduleIds?: ReadonlySet<string>): Promise<void> {
    this.requireCleanupComplete()
    const modules = moduleIds
      ? this.plan.modules.filter((module) => moduleIds.has(module.id))
      : this.plan.modules
    await this.runWithRollback('install', 'uninstall', modules)
  }

  private async activateModules(): Promise<void> {
    this.requireCleanupComplete()
    if (this.runtimeState === 'active') return
    try {
      await this.runWithRollback('activate', 'deactivate', this.plan.modules)
      this.activeModules = [...this.plan.modules]
      this.runtimeState = 'active'
    } catch (error) {
      this.runtimeState = 'failed'
      throw error
    }
  }

  private async upgradeModules(previousVersions: ReadonlyMap<string, string>): Promise<void> {
    this.requireCleanupComplete()
    for (const module of this.plan.modules) {
      const previousVersion = previousVersions.get(module.id)
      if (!previousVersion || previousVersion === module.version) continue

      const context: ModuleUpgradeContext = {
        ...this.createContext(module),
        previousVersion,
        targetVersion: module.version,
      }
      await this.run(module, 'upgrade', () => module.lifecycle.upgrade(context))
    }
  }

  private async deactivateModules(): Promise<void> {
    const failures: ModuleLifecycleError[] = []
    const remaining: FrameworkModule[] = []
    for (const module of [...this.activeModules].reverse()) {
      try {
        await this.run(module, 'deactivate', () =>
          module.lifecycle.deactivate(this.createContext(module)),
        )
      } catch (error) {
        failures.push(error as ModuleLifecycleError)
        remaining.push(module)
      }
    }

    this.activeModules = remaining.reverse()
    this.runtimeState = failures.length > 0 ? 'failed' : 'stopped'
    if (failures.length > 0) throw new AggregateError(failures, 'Module deactivation failed.')
  }

  private async uninstallModules(): Promise<void> {
    for (const module of [...this.plan.modules].reverse()) {
      await this.run(module, 'uninstall', () =>
        module.lifecycle.uninstall(this.createContext(module)),
      )
    }
  }

  private requireCleanupComplete(): void {
    if (this.runtimeState === 'failed' && this.activeModules.length > 0) {
      throw new ModuleLifecycleStateError('Retry deactivation to complete pending module cleanup.')
    }
  }

  private async runWithRollback(
    phase: 'activate' | 'install',
    rollbackPhase: 'deactivate' | 'uninstall',
    modules: readonly FrameworkModule[],
  ): Promise<void> {
    const completed: FrameworkModule[] = []
    for (const module of modules) {
      try {
        await this.run(module, phase, () => module.lifecycle[phase](this.createContext(module)))
        completed.push(module)
      } catch (error) {
        const rollback = await this.rollback(completed, rollbackPhase)
        if (rollbackPhase === 'deactivate') this.activeModules = rollback.remaining
        const failure = error as ModuleLifecycleError
        throw new ModuleLifecycleError(module.id, phase, failure.cause, rollback.errors)
      }
    }
  }

  private async rollback(
    modules: readonly FrameworkModule[],
    phase: 'deactivate' | 'uninstall',
  ): Promise<{ errors: unknown[]; remaining: FrameworkModule[] }> {
    const errors: unknown[] = []
    const remaining: FrameworkModule[] = []
    for (const module of [...modules].reverse()) {
      try {
        await module.lifecycle[phase](this.createContext(module))
      } catch (error) {
        errors.push(error)
        remaining.push(module)
      }
    }
    return { errors, remaining: remaining.reverse() }
  }

  private async run(
    module: FrameworkModule,
    phase: ModuleLifecyclePhase,
    action: () => Promise<void> | void,
  ): Promise<void> {
    this.notify({ moduleId: module.id, phase, status: 'started' })
    try {
      await action()
      this.notify({ moduleId: module.id, phase, status: 'completed' })
    } catch (error) {
      this.notify({ moduleId: module.id, phase, status: 'failed' })
      throw new ModuleLifecycleError(module.id, phase, error)
    }
  }

  private notify(event: ModuleLifecycleEvent): void {
    try {
      this.report(event)
    } catch (cause) {
      this.reportingFailures.push(Object.freeze({ ...event, cause }))
      if (this.reportingFailures.length > 100) this.reportingFailures.shift()
    }
  }
}

function defaultContextFactory(module: FrameworkModule): ModuleLifecycleContext {
  return { moduleId: module.id, signal: new AbortController().signal }
}
