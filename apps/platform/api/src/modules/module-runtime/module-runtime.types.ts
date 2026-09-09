import type { ModuleKind } from '@codexsun/framework'

export type DurableModuleState =
  'active' | 'disabled' | 'failed' | 'installed' | 'migrating' | 'validated'

export interface DurableModuleRecord {
  enabled: boolean
  installedVersion?: string
  kind: ModuleKind
  lastFailureCode?: string
  lastFailureMessage?: string
  manifestChecksum: string
  moduleId: string
  requestedVersion: string
  schemaChecksum?: string
  state: DurableModuleState
  updatedAt: Date
}

export interface AppliedModuleDataRecord {
  checksum: string
  id: string
  moduleId: string
  version: string
}

export interface ModuleRuntimeRepository {
  findMigration(moduleId: string, migrationId: string): Promise<AppliedModuleDataRecord | undefined>
  findSeed(moduleId: string, seedId: string): Promise<AppliedModuleDataRecord | undefined>
  getModule(moduleId: string): Promise<DurableModuleRecord | undefined>
  listModules(): Promise<readonly DurableModuleRecord[]>
  recordMigration(
    record: AppliedModuleDataRecord,
    appliedAt: Date,
    durationMs: number,
  ): Promise<void>
  recordSeed(record: AppliedModuleDataRecord, appliedAt: Date): Promise<void>
  saveModule(record: DurableModuleRecord): Promise<void>
}

export interface ModuleDataTransaction<TContext> {
  context: TContext
  repository: ModuleRuntimeRepository
}

export interface ModuleDataTransactionRunner<TContext> {
  run<T>(action: (transaction: ModuleDataTransaction<TContext>) => Promise<T>): Promise<T>
}

export interface ModuleRuntimeLock {
  runExclusive<T>(action: () => Promise<T>): Promise<T>
}
