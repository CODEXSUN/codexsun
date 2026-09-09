import { createHash } from 'node:crypto'
import type { FrameworkModule, ModuleCompositionPlan } from '@codexsun/framework'
import {
  validateModuleDataDeclarations,
  validateModuleSchemaDeclaration,
  type PlatformApiModule,
  type PlatformDiagnosticSink,
  type PlatformModuleEventBus,
  type PlatformModuleMigration,
  type PlatformModuleSeed,
} from '@codexsun/platform-core-api'
import type {
  DurableModuleRecord,
  ModuleDataTransactionRunner,
  ModuleRuntimeLock,
  ModuleRuntimeRepository,
} from './module-runtime.types.js'

export type ModuleRuntimeCoordinatorState = 'failed' | 'idle' | 'ready' | 'running'

export interface ModulePreparationResult {
  appliedMigrationIds: readonly string[]
  appliedSeedIds: readonly string[]
  newModuleIds: ReadonlySet<string>
  previousVersions: ReadonlyMap<string, string>
}

export class ModuleRuntimeCoordinator<TContext> {
  private readonly activeModuleIds = new Set<string>()
  private runtimeState: ModuleRuntimeCoordinatorState = 'idle'
  private result: ModulePreparationResult = {
    appliedMigrationIds: [],
    appliedSeedIds: [],
    newModuleIds: new Set(),
    previousVersions: new Map(),
  }

  constructor(
    private readonly plan: ModuleCompositionPlan,
    private readonly modules: readonly PlatformApiModule<TContext, TContext>[],
    private readonly repository: ModuleRuntimeRepository,
    private readonly transactions: ModuleDataTransactionRunner<TContext>,
    private readonly diagnostics: PlatformDiagnosticSink,
    private readonly events: PlatformModuleEventBus,
    private readonly clock: () => Date = () => new Date(),
    private readonly prepareStorage: () => Promise<void> = () => Promise.resolve(),
    private readonly lock: ModuleRuntimeLock = { runExclusive: (action) => action() },
  ) {}

  get state(): ModuleRuntimeCoordinatorState {
    return this.runtimeState
  }

  async prepare(): Promise<ModulePreparationResult> {
    if (this.runtimeState === 'running') throw new Error('The module runtime is already running.')
    if (this.runtimeState === 'ready') return this.result
    this.runtimeState = 'running'

    try {
      await this.prepareStorage()
      this.result = await this.lock.runExclusive(() => this.prepareModules())
      this.runtimeState = 'ready'
      return this.result
    } catch (error) {
      this.runtimeState = 'failed'
      this.report('MODULE_RUNTIME_FAILED', 'error', 'module-runtime', safeMessage(error))
      throw error
    }
  }

  private async prepareModules(): Promise<ModulePreparationResult> {
    const modules = new Map(this.modules.map((module) => [module.manifest.id, module]))
    const appliedMigrationIds: string[] = []
    const appliedSeedIds: string[] = []
    const newModuleIds = new Set<string>()
    const previousVersions = new Map<string, string>()
    for (const manifest of this.plan.modules) {
      const previous = await this.repository.getModule(manifest.id)
      if (previous?.installedVersion) previousVersions.set(manifest.id, previous.installedVersion)
      else newModuleIds.add(manifest.id)
      const applied = await this.prepareModule(manifest, modules.get(manifest.id)!, previous)
      appliedMigrationIds.push(...applied.migrations)
      appliedSeedIds.push(...applied.seeds)
    }
    return { appliedMigrationIds, appliedSeedIds, newModuleIds, previousVersions }
  }

  check(): Promise<void> {
    return this.runtimeState === 'ready'
      ? Promise.resolve()
      : Promise.reject(new Error(`The module runtime is ${this.runtimeState}.`))
  }

  canServe(moduleId: string): boolean {
    return (
      moduleId === 'module-runtime' || moduleId === 'system' || this.activeModuleIds.has(moduleId)
    )
  }

  async markActive(): Promise<void> {
    await this.updatePreparedStates('active')
    for (const record of await this.repository.listModules()) {
      if (record.enabled && record.state === 'active') this.activeModuleIds.add(record.moduleId)
    }
  }

  async markDisabled(): Promise<void> {
    if (this.runtimeState !== 'ready') return
    await this.updatePreparedStates('disabled')
    this.activeModuleIds.clear()
  }

  private async prepareModule(
    manifest: FrameworkModule,
    module: PlatformApiModule<TContext, TContext>,
    previous: DurableModuleRecord | undefined,
  ): Promise<{ migrations: string[]; seeds: string[] }> {
    const migrations = module.migrations ?? []
    const seeds = module.seeds ?? []
    validateModuleDataDeclarations(manifest.id, migrations, seeds)
    validateModuleSchemaDeclaration(manifest.id, module.schema)
    verifySchemaBinding(manifest, module)
    const record = createModuleRecord(manifest, previous, this.clock())
    const applied = { migrations: [] as string[], seeds: [] as string[] }

    try {
      await this.repository.saveModule({ ...record, state: 'validated' })
      await this.repository.saveModule({ ...record, state: 'migrating' })
      for (const migration of migrations) {
        if (await this.applyMigration(manifest.id, migration)) {
          applied.migrations.push(`${manifest.id}:${migration.id}`)
        }
      }
      for (const seed of seeds) {
        if (await this.applySeed(manifest.id, seed)) {
          applied.seeds.push(`${manifest.id}:${seed.id}`)
        }
      }
      const schemaChecksum = await this.verifyModuleSchema(manifest.id, module)
      await this.repository.saveModule({
        ...record,
        installedVersion: manifest.version,
        schemaChecksum,
        state: 'installed',
      })
      await this.events.publish({
        id: 'module-runtime.module-prepared',
        payload: { moduleId: manifest.id, version: manifest.version },
        version: '1.0.0',
      })
      this.report('MODULE_PREPARED', 'info', manifest.id, 'Module data is ready.')
      return applied
    } catch (error) {
      await this.repository.saveModule({
        ...record,
        lastFailureCode: 'MODULE_PREPARATION_FAILED',
        lastFailureMessage: safeMessage(error),
        state: 'failed',
      })
      this.report('MODULE_PREPARATION_FAILED', 'error', manifest.id, safeMessage(error))
      throw error
    }
  }

  private async updatePreparedStates(state: 'active' | 'disabled'): Promise<void> {
    for (const manifest of this.plan.modules) {
      const record = await this.repository.getModule(manifest.id)
      if (!record || record.state === 'failed') continue
      await this.repository.saveModule({ ...record, state, updatedAt: this.clock() })
    }
  }

  private async applyMigration(
    moduleId: string,
    migration: PlatformModuleMigration<TContext>,
  ): Promise<boolean> {
    const applied = await this.repository.findMigration(moduleId, migration.id)
    verifyChecksum(moduleId, 'migration', migration.id, migration.checksum, applied?.checksum)
    if (applied) return false

    const startedAt = Date.now()
    await this.transactions.run(async ({ context, repository }) => {
      await migration.up(context)
      await repository.recordMigration(
        moduleDataRecord(moduleId, migration),
        this.clock(),
        Date.now() - startedAt,
      )
    })
    return true
  }

  private async applySeed(moduleId: string, seed: PlatformModuleSeed<TContext>): Promise<boolean> {
    const applied = await this.repository.findSeed(moduleId, seed.id)
    verifyChecksum(moduleId, 'seed', seed.id, seed.checksum, applied?.checksum)
    if (applied) return false

    await this.transactions.run(async ({ context, repository }) => {
      await seed.run(context)
      await repository.recordSeed(moduleDataRecord(moduleId, seed), this.clock())
    })
    return true
  }

  private async verifyModuleSchema(
    moduleId: string,
    module: PlatformApiModule<TContext, TContext>,
  ): Promise<string | undefined> {
    if (!module.schema) return undefined
    const actual = await this.transactions.run(({ context }) => module.schema!.inspect(context))
    if (actual !== module.schema.checksum) {
      throw new Error(
        `Module "${moduleId}" schema checksum mismatch. Expected ${module.schema.checksum}, received ${actual}.`,
      )
    }
    return actual
  }

  private report(code: string, level: 'error' | 'info', moduleId: string, message: string): void {
    this.diagnostics.report({
      code,
      level,
      message,
      moduleId,
      timestamp: this.clock().toISOString(),
    })
  }
}

function createModuleRecord(
  manifest: FrameworkModule,
  previous: DurableModuleRecord | undefined,
  updatedAt: Date,
): DurableModuleRecord {
  return {
    enabled: previous?.enabled ?? true,
    installedVersion: previous?.installedVersion,
    kind: manifest.kind,
    manifestChecksum: hashManifest(manifest),
    moduleId: manifest.id,
    requestedVersion: manifest.version,
    schemaChecksum: previous?.schemaChecksum,
    state: 'validated',
    updatedAt,
  }
}

function hashManifest(manifest: FrameworkModule): string {
  const value = JSON.stringify({
    capabilities: manifest.capabilities,
    configuration: manifest.configuration,
    consumes: manifest.consumes,
    dependencies: manifest.dependencies,
    dataSchema: manifest.dataSchema,
    extensionPoints: manifest.extensionPoints,
    extensions: manifest.extensions,
    id: manifest.id,
    kind: manifest.kind,
    owner: manifest.owner,
    platformVersionRange: manifest.platformVersionRange,
    publicContracts: manifest.publicContracts,
    publishes: manifest.publishes,
    scope: manifest.scope,
    version: manifest.version,
  })
  return `sha256:${createHash('sha256').update(value).digest('hex')}`
}

function verifySchemaBinding<TContext>(
  manifest: FrameworkModule,
  module: PlatformApiModule<TContext, TContext>,
): void {
  if (!manifest.dataSchema && !module.schema) return
  if (
    manifest.dataSchema?.checksum !== module.schema?.checksum ||
    manifest.dataSchema?.version !== module.schema?.version
  ) {
    throw new Error(`Module "${manifest.id}" schema runtime does not match its manifest.`)
  }
}

function moduleDataRecord(
  moduleId: string,
  declaration: { checksum: string; id: string; version: string },
) {
  return {
    checksum: declaration.checksum,
    id: declaration.id,
    moduleId,
    version: declaration.version,
  }
}

function verifyChecksum(
  moduleId: string,
  kind: 'migration' | 'seed',
  id: string,
  expected: string,
  applied: string | undefined,
): void {
  if (applied && applied !== expected) {
    throw new Error(`Module "${moduleId}" ${kind} "${id}" checksum changed after application.`)
  }
}

function safeMessage(error: unknown): string {
  return error instanceof Error ? error.message.slice(0, 512) : 'Module preparation failed.'
}
