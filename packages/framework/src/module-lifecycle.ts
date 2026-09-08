import type { ModuleCompositionPlan } from './module-composition.js'
import type {
  FrameworkModule,
  ModuleLifecycleContext,
  ModuleUpgradeContext,
} from './module-contracts.js'
import { ModuleLifecycleError, type ModuleLifecyclePhase } from './module-errors.js'

export type ModuleRuntimeState = 'idle' | 'active' | 'stopped' | 'failed'
export type ModuleContextFactory = (module: FrameworkModule) => ModuleLifecycleContext

export class ModuleLifecycleExecutor {
  private activeModules: FrameworkModule[] = []
  private runtimeState: ModuleRuntimeState = 'idle'

  constructor(
    private readonly plan: ModuleCompositionPlan,
    private readonly createContext: ModuleContextFactory = defaultContextFactory,
  ) {}

  get state(): ModuleRuntimeState {
    return this.runtimeState
  }

  async install(): Promise<void> {
    await this.runWithRollback('install', 'uninstall', this.plan.modules)
  }

  async activate(): Promise<void> {
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

  async upgrade(previousVersions: ReadonlyMap<string, string>): Promise<void> {
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

  async deactivate(): Promise<void> {
    const failures: ModuleLifecycleError[] = []
    for (const module of [...this.activeModules].reverse()) {
      try {
        await this.run(module, 'deactivate', () =>
          module.lifecycle.deactivate(this.createContext(module)),
        )
      } catch (error) {
        failures.push(error as ModuleLifecycleError)
      }
    }

    this.activeModules = []
    this.runtimeState = failures.length > 0 ? 'failed' : 'stopped'
    if (failures.length > 0) throw new AggregateError(failures, 'Module deactivation failed.')
  }

  async uninstall(): Promise<void> {
    for (const module of [...this.plan.modules].reverse()) {
      await this.run(module, 'uninstall', () =>
        module.lifecycle.uninstall(this.createContext(module)),
      )
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
        const rollbackErrors = await this.rollback(completed, rollbackPhase)
        const failure = error as ModuleLifecycleError
        throw new ModuleLifecycleError(module.id, phase, failure.cause, rollbackErrors)
      }
    }
  }

  private async rollback(
    modules: readonly FrameworkModule[],
    phase: 'deactivate' | 'uninstall',
  ): Promise<unknown[]> {
    const errors: unknown[] = []
    for (const module of [...modules].reverse()) {
      try {
        await module.lifecycle[phase](this.createContext(module))
      } catch (error) {
        errors.push(error)
      }
    }
    return errors
  }

  private async run(
    module: FrameworkModule,
    phase: ModuleLifecyclePhase,
    action: () => Promise<void> | void,
  ): Promise<void> {
    try {
      await action()
    } catch (error) {
      throw new ModuleLifecycleError(module.id, phase, error)
    }
  }
}

function defaultContextFactory(module: FrameworkModule): ModuleLifecycleContext {
  return { moduleId: module.id, signal: new AbortController().signal }
}
